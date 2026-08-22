from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from database import get_db
from models import City, Trip, TripStop, User
from schemas.stop import StopCreate, StopResponse, StopUpdate
from utils.dependencies import get_current_user


router = APIRouter(
    prefix="/api/trips/{trip_id}/stops",
    tags=["Trip Stops"],
)


def get_user_trip(
    trip_id: int,
    current_user: User,
    db: Session,
) -> Trip:
    trip = db.scalar(
        select(Trip).where(
            Trip.id == trip_id,
            Trip.user_id == current_user.id,
        )
    )

    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found",
        )

    return trip


def validate_stop_dates(
    trip: Trip,
    start_date,
    end_date,
):
    if start_date < trip.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Stop start date cannot be before "
                "the trip start date"
            ),
        )

    if end_date > trip.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Stop end date cannot be after "
                "the trip end date"
            ),
        )

    if end_date < start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Stop end date must be on or after "
                "stop start date"
            ),
        )


def get_trip_stops(
    trip_id: int,
    db: Session,
    exclude_stop_id: int | None = None,
):
    statement = (
        select(TripStop)
        .options(
            selectinload(
                TripStop.city
            ).selectinload(
                City.country
            )
        )
        .where(
            TripStop.trip_id == trip_id
        )
        .order_by(
            TripStop.start_date,
            TripStop.id,
        )
    )

    if exclude_stop_id is not None:
        statement = statement.where(
            TripStop.id != exclude_stop_id
        )

    return db.scalars(statement).all()


def validate_no_overlap(
    existing_stops,
    start_date,
    end_date,
):
    """
    Stops are ordered chronologically.

    Adjacent stops are allowed:

        Stop A: Oct 20 -> Oct 22
        Stop B: Oct 22 -> Oct 25

    Overlapping stops are rejected:

        Stop A: Oct 20 -> Oct 23
        Stop B: Oct 22 -> Oct 25
    """

    for existing in existing_stops:
        overlaps = (
            start_date < existing.end_date
            and end_date > existing.start_date
        )

        if overlaps:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Dates overlap with "
                    f"{existing.city.name}: "
                    f"{existing.start_date} to "
                    f"{existing.end_date}"
                ),
            )


def resequence_stops(
    trip_id: int,
    db: Session,
):
    """
    Recalculate itinerary sequence entirely from start_date.

    Users never manually manage sequence.
    """

    stops = get_trip_stops(
        trip_id,
        db,
    )

    if not stops:
        return

    temporary_base = (
        max((stop.sequence for stop in stops), default=0)
        + len(stops)
        + 1000
    )

    # First move EVERY stop to a temporary unique sequence.
    for index, stop in enumerate(stops, start=1):
        stop.sequence = temporary_base + index

    db.flush()

    # Now assign the actual chronological sequence.
    for index, stop in enumerate(stops, start=1):
        stop.sequence = index

    db.flush()

def load_stop(
    stop_id: int,
    db: Session,
) -> TripStop | None:
    statement = (
        select(TripStop)
        .options(
            selectinload(
                TripStop.city
            ).selectinload(
                City.country
            )
        )
        .where(
            TripStop.id == stop_id
        )
    )

    return db.scalar(statement)


@router.post(
    "/",
    response_model=StopResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_stop(
    trip_id: int,
    stop_data: StopCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = get_user_trip(
        trip_id,
        current_user,
        db,
    )

    city = db.get(
        City,
        stop_data.city_id,
    )

    if not city:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="City not found",
        )

    validate_stop_dates(
        trip,
        stop_data.start_date,
        stop_data.end_date,
    )

    existing_stops = get_trip_stops(
        trip_id,
        db,
    )

    validate_no_overlap(
        existing_stops,
        stop_data.start_date,
        stop_data.end_date,
    )

    # Sequence is generated automatically.
    stop = TripStop(
        trip_id=trip_id,
        city_id=stop_data.city_id,
        start_date=stop_data.start_date,
        end_date=stop_data.end_date,
        sequence=1_000_000,
    )
    db.add(stop)

    try:
        db.flush()

        # Recalculate chronological sequence.
        resequence_stops(
            trip_id,
            db,
        )

        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to add trip stop",
        )

    return load_stop(
        stop.id,
        db,
    )


@router.get(
    "/",
    response_model=list[StopResponse],
)
def get_stops(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_user_trip(
        trip_id,
        current_user,
        db,
    )

    return get_trip_stops(
        trip_id,
        db,
    )


@router.put(
    "/{stop_id}",
    response_model=StopResponse,
)
def update_stop(
    trip_id: int,
    stop_id: int,
    stop_data: StopUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = get_user_trip(
        trip_id,
        current_user,
        db,
    )

    statement = select(TripStop).where(
        TripStop.id == stop_id,
        TripStop.trip_id == trip_id,
    )

    stop = db.scalar(statement)

    if not stop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip stop not found",
        )

    updates = stop_data.model_dump(
        exclude_unset=True
    )

    new_city_id = updates.get(
        "city_id",
        stop.city_id,
    )

    new_start_date = updates.get(
        "start_date",
        stop.start_date,
    )

    new_end_date = updates.get(
        "end_date",
        stop.end_date,
    )

    city = db.get(
        City,
        new_city_id,
    )

    if not city:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="City not found",
        )

    validate_stop_dates(
        trip,
        new_start_date,
        new_end_date,
    )

    existing_stops = get_trip_stops(
        trip_id,
        db,
        exclude_stop_id=stop_id,
    )

    validate_no_overlap(
        existing_stops,
        new_start_date,
        new_end_date,
    )

    for field, value in updates.items():
        setattr(
            stop,
            field,
            value,
        )

    try:
        db.flush()

        # Sequence is recalculated after any date change.
        resequence_stops(
            trip_id,
            db,
        )

        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to update trip stop",
        )

    return load_stop(
        stop.id,
        db,
    )


@router.delete(
    "/{stop_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_stop(
    trip_id: int,
    stop_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_user_trip(
        trip_id,
        current_user,
        db,
    )

    statement = select(TripStop).where(
        TripStop.id == stop_id,
        TripStop.trip_id == trip_id,
    )

    stop = db.scalar(statement)

    if not stop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip stop not found",
        )

    db.delete(stop)

    try:
        db.flush()

        # Re-number remaining stops after deletion.
        resequence_stops(
            trip_id,
            db,
        )

        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to delete trip stop",
        )