from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from database import get_db
from models import Activity, City, Trip, TripActivity, TripStop, User
from schemas.activity import (
    TripActivityCreate,
    TripActivityResponse,
    TripActivityUpdate,
)
from utils.dependencies import get_current_user


router = APIRouter(
    prefix="/api/trips/{trip_id}/activities",
    tags=["Trip Activities"],
)


# Default planning window used when the user does not choose a time.
DAY_START = time(9, 0)
DAY_END = time(21, 0)


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


def get_trip_stop(
    trip_id: int,
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
            TripStop.id == stop_id,
            TripStop.trip_id == trip_id,
        )
    )

    return db.scalar(statement)


def get_trip_activities_for_date(
    trip_id: int,
    activity_date: date,
    db: Session,
    exclude_id: int | None = None,
):
    statement = (
        select(TripActivity)
        .options(
            selectinload(TripActivity.activity)
        )
        .where(
            TripActivity.trip_id == trip_id,
            TripActivity.activity_date == activity_date,
        )
        .order_by(
            TripActivity.start_time,
            TripActivity.id,
        )
    )

    if exclude_id is not None:
        statement = statement.where(
            TripActivity.id != exclude_id
        )

    return db.scalars(statement).all()


def combine_date_time(
    activity_date: date,
    start_time: time,
) -> datetime:
    return datetime.combine(
        activity_date,
        start_time,
    )


def calculate_end_time(
    start_time: time,
    duration_hours: float,
) -> time:
    start = datetime.combine(
        date.today(),
        start_time,
    )

    end = start + timedelta(
        hours=duration_hours
    )

    return end.time()


def has_time_overlap(
    first_start: time,
    first_duration: float,
    second_start: time,
    second_duration: float,
) -> bool:
    first_start_dt = datetime.combine(
        date.today(),
        first_start,
    )

    first_end_dt = (
        first_start_dt
        + timedelta(hours=first_duration)
    )

    second_start_dt = datetime.combine(
        date.today(),
        second_start,
    )

    second_end_dt = (
        second_start_dt
        + timedelta(hours=second_duration)
    )

    return (
        first_start_dt < second_end_dt
        and second_start_dt < first_end_dt
    )


def find_next_available_time(
    existing_activities,
    duration_hours: float,
) -> time | None:
    """
    Finds the first available slot between 09:00 and 21:00.

    Activities are placed at 30-minute boundaries.
    """

    candidate = datetime.combine(
        date.today(),
        DAY_START,
    )

    day_end = datetime.combine(
        date.today(),
        DAY_END,
    )

    # Try every 30-minute boundary.
    while candidate < day_end:
        candidate_time = candidate.time()

        candidate_end = (
            candidate
            + timedelta(hours=duration_hours)
        )

        if candidate_end > day_end:
            break

        conflict = False

        for existing in existing_activities:
            if existing.start_time is None:
                continue

            if has_time_overlap(
                candidate_time,
                duration_hours,
                existing.start_time,
                existing.activity.duration_hours,
            ):
                conflict = True
                break

        if not conflict:
            return candidate_time

        candidate += timedelta(
            minutes=30
        )

    return None


def validate_activity_date(
    trip: Trip,
    stop: TripStop,
    activity_date: date,
):
    if activity_date < trip.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Activity date cannot be before the trip start date",
        )

    if activity_date > trip.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Activity date cannot be after the trip end date",
        )

    if activity_date < stop.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Activity date cannot be before the selected stop",
        )

    if activity_date > stop.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Activity date cannot be after the selected stop",
        )


def load_trip_activity(
    trip_activity_id: int,
    db: Session,
):
    statement = (
        select(TripActivity)
        .options(
            selectinload(
                TripActivity.activity
            )
        )
        .where(
            TripActivity.id == trip_activity_id
        )
    )

    return db.scalar(statement)


@router.post(
    "/",
    response_model=TripActivityResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_trip_activity(
    trip_id: int,
    activity_data: TripActivityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = get_user_trip(
        trip_id,
        current_user,
        db,
    )

    stop = get_trip_stop(
        trip_id,
        activity_data.trip_stop_id,
        db,
    )

    if not stop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip stop not found",
        )

    activity = db.scalar(
        select(Activity)
        .where(
            Activity.id == activity_data.activity_id
        )
    )

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found",
        )

    # Critical integrity rule:
    # An activity can only be added to a stop belonging
    # to the same city as the activity.
    if activity.city_id != stop.city_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"{activity.name} belongs to a different city "
                f"than {stop.city.name}"
            ),
        )

    # Prevent adding the exact same activity twice to the
    # same trip stop.
    duplicate = db.scalar(
        select(TripActivity).where(
            TripActivity.trip_id == trip_id,
            TripActivity.trip_stop_id
            == activity_data.trip_stop_id,
            TripActivity.activity_id
            == activity_data.activity_id,
        )
    )

    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Activity is already added to this stop",
        )

    # Smart default: use the beginning of the stop.
    selected_date = (
        activity_data.activity_date
        or stop.start_date
    )

    validate_activity_date(
        trip,
        stop,
        selected_date,
    )

    existing_activities = (
        get_trip_activities_for_date(
            trip_id,
            selected_date,
            db,
        )
    )

    # Smart cost:
    # use user-provided estimate if supplied,
    # otherwise use the catalog activity cost.
    selected_cost = (
        activity_data.estimated_cost
        if activity_data.estimated_cost is not None
        else activity.estimated_cost
    )

    # Smart scheduling:
    # if user gives a time, respect it;
    # otherwise find the first available slot.
    selected_time = activity_data.start_time

    if selected_time is None:
        selected_time = find_next_available_time(
            existing_activities,
            activity.duration_hours,
        )

        if selected_time is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"No available time slot on "
                    f"{selected_date}"
                ),
            )
    else:
        # Validate manually supplied time.
        if selected_time < DAY_START:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Activities cannot start before 09:00",
            )

        if selected_time >= DAY_END:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Activities must start before 21:00",
            )

        # Prevent manual overlap.
        for existing in existing_activities:
            if existing.start_time is None:
                continue

            if has_time_overlap(
                selected_time,
                activity.duration_hours,
                existing.start_time,
                existing.activity.duration_hours,
            ):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"Activity overlaps with "
                        f"{existing.activity.name}"
                    ),
                )

    trip_activity = TripActivity(
        trip_id=trip_id,
        trip_stop_id=stop.id,
        activity_id=activity.id,
        activity_date=selected_date,
        start_time=selected_time,
        estimated_cost=selected_cost,
    )

    db.add(trip_activity)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to add activity to trip",
        )

    return load_trip_activity(
        trip_activity.id,
        db,
    )


@router.get(
    "/",
    response_model=list[TripActivityResponse],
)
def get_trip_activities(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_user_trip(
        trip_id,
        current_user,
        db,
    )

    statement = (
        select(TripActivity)
        .options(
            selectinload(
                TripActivity.activity
            )
        )
        .where(
            TripActivity.trip_id == trip_id
        )
        .order_by(
            TripActivity.activity_date,
            TripActivity.start_time,
            TripActivity.id,
        )
    )

    return db.scalars(statement).all()


@router.put(
    "/{trip_activity_id}",
    response_model=TripActivityResponse,
)
def update_trip_activity(
    trip_id: int,
    trip_activity_id: int,
    activity_data: TripActivityUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_user_trip(
        trip_id,
        current_user,
        db,
    )

    trip_activity = db.scalar(
        select(TripActivity)
        .where(
            TripActivity.id == trip_activity_id,
            TripActivity.trip_id == trip_id,
        )
    )

    if not trip_activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip activity not found",
        )

    activity = db.get(
        Activity,
        trip_activity.activity_id,
    )

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found",
        )

    stop = db.get(
        TripStop,
        trip_activity.trip_stop_id,
    )

    if not stop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip stop not found",
        )

    new_date = (
        activity_data.activity_date
        or trip_activity.activity_date
    )

    new_time = (
        activity_data.start_time
        if activity_data.start_time is not None
        else trip_activity.start_time
    )

    new_cost = (
        activity_data.estimated_cost
        if activity_data.estimated_cost is not None
        else trip_activity.estimated_cost
    )

    validate_activity_date(
        trip,
        stop,
        new_date,
    )

    existing_activities = (
        get_trip_activities_for_date(
            trip_id,
            new_date,
            db,
            exclude_id=trip_activity_id,
        )
    )

    if new_time is None:
        new_time = find_next_available_time(
            existing_activities,
            activity.duration_hours,
        )

        if new_time is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"No available time slot on "
                    f"{new_date}"
                ),
            )

    else:
        if new_time < DAY_START:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Activities cannot start before 09:00",
            )

        if new_time >= DAY_END:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Activities must start before 21:00",
            )

        for existing in existing_activities:
            if existing.start_time is None:
                continue

            if has_time_overlap(
                new_time,
                activity.duration_hours,
                existing.start_time,
                existing.activity.duration_hours,
            ):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"Activity overlaps with "
                        f"{existing.activity.name}"
                    ),
                )

    trip_activity.activity_date = new_date
    trip_activity.start_time = new_time
    trip_activity.estimated_cost = new_cost

    db.commit()

    return load_trip_activity(
        trip_activity.id,
        db,
    )


@router.delete(
    "/{trip_activity_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_trip_activity(
    trip_id: int,
    trip_activity_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_user_trip(
        trip_id,
        current_user,
        db,
    )

    trip_activity = db.scalar(
        select(TripActivity).where(
            TripActivity.id == trip_activity_id,
            TripActivity.trip_id == trip_id,
        )
    )

    if not trip_activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip activity not found",
        )

    db.delete(trip_activity)
    db.commit()