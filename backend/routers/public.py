from datetime import time

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from database import get_db
from models import Trip, TripActivity, TripStop
from routers.budget import calculate_budget_data
from schemas.public_trip import (
    PublicActivity,
    PublicBudget,
    PublicStop,
    PublicTripResponse,
)


router = APIRouter(
    prefix="/api/public",
    tags=["Public Trips"],
)


@router.get(
    "/trips/{share_code}",
    response_model=PublicTripResponse,
)
def get_public_trip(
    share_code: str,
    db: Session = Depends(get_db),
):
    trip = db.scalar(
        select(Trip)
        .where(
            Trip.share_code == share_code,
            Trip.is_public.is_(True),
        )
        .options(
            selectinload(Trip.stops)
            .selectinload(TripStop.city),
            selectinload(Trip.activities)
            .selectinload(TripActivity.activity),
        )
    )

    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Public trip not found",
        )

    activities_by_stop: dict[int, list[PublicActivity]] = {}

    for trip_activity in trip.activities:
        activity = trip_activity.activity

        activities_by_stop.setdefault(
            trip_activity.trip_stop_id,
            [],
        ).append(
            PublicActivity(
                id=activity.id,
                name=activity.name,
                category=activity.category,
                duration_hours=activity.duration_hours,
                estimated_cost=trip_activity.estimated_cost,
                activity_date=trip_activity.activity_date,
                start_time=trip_activity.start_time,
            )
        )

    public_stops: list[PublicStop] = []

    for stop in sorted(
        trip.stops,
        key=lambda item: item.sequence,
    ):
        stop_activities = activities_by_stop.get(
            stop.id,
            [],
        )

        stop_activities.sort(
            key=lambda item: (
                item.activity_date,
                item.start_time or time(23, 59),
            )
        )

        public_stops.append(
            PublicStop(
                id=stop.id,
                sequence=stop.sequence,
                city_name=stop.city.name,
                country_name=stop.city.country.name,
                start_date=stop.start_date,
                end_date=stop.end_date,
                activities=stop_activities,
            )
        )

    budget = calculate_budget_data(
        trip,
        db,
    )

    return PublicTripResponse(
        name=trip.name,
        description=trip.description,
        start_date=trip.start_date,
        end_date=trip.end_date,
        stops=public_stops,
        budget=PublicBudget(
            accommodation=budget["accommodation"],
            transport=budget["transport"],
            meals=budget["meals"],
            activities=budget["activities"],
            total_allocated=budget["total_allocated"],
            total_planned=budget["total_planned"],
            remaining=budget["remaining"],
            utilization_percent=budget["utilization_percent"],
        ),
    )