import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import Trip, User
from schemas.trip import TripCreate, TripResponse, TripUpdate
from utils.dependencies import get_current_user


router = APIRouter(
    prefix="/api/trips",
    tags=["Trips"],
)


@router.post(
    "/",
    response_model=TripResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_trip(
    trip_data: TripCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = Trip(
        user_id=current_user.id,
        name=trip_data.name.strip(),
        description=trip_data.description,
        start_date=trip_data.start_date,
        end_date=trip_data.end_date,
        accommodation_budget=trip_data.accommodation_budget,
        transport_budget=trip_data.transport_budget,
        meal_budget=trip_data.meal_budget,
        is_public=False,
        share_code=secrets.token_urlsafe(8),
    )

    db.add(trip)
    db.commit()
    db.refresh(trip)

    return trip


@router.get(
    "/",
    response_model=list[TripResponse],
)
def get_my_trips(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    statement = (
        select(Trip)
        .where(Trip.user_id == current_user.id)
        .order_by(Trip.start_date.desc())
    )

    return db.scalars(statement).all()


@router.get(
    "/{trip_id}",
    response_model=TripResponse,
)
def get_trip(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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


@router.put(
    "/{trip_id}",
    response_model=TripResponse,
)
def update_trip(
    trip_id: int,
    trip_data: TripUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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

    updates = trip_data.model_dump(
        exclude_unset=True
    )

    if (
        "start_date" in updates
        and "end_date" in updates
    ):
        if updates["end_date"] < updates["start_date"]:
            raise HTTPException(
                status_code=400,
                detail="End date must be on or after start date",
            )

    elif "start_date" in updates:
        if updates["start_date"] > trip.end_date:
            raise HTTPException(
                status_code=400,
                detail="Start date cannot be after end date",
            )

    elif "end_date" in updates:
        if updates["end_date"] < trip.start_date:
            raise HTTPException(
                status_code=400,
                detail="End date cannot be before start date",
            )

    for field, value in updates.items():
        if field == "name" and value is not None:
            value = value.strip()

        setattr(trip, field, value)

    db.commit()
    db.refresh(trip)

    return trip


@router.delete(
    "/{trip_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_trip(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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

    db.delete(trip)
    db.commit()