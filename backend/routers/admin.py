from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from database import get_db
from models import Activity, City, Trip, TripActivity, User
from schemas.admin import (
    AdminOverview,
    AdminTripSummary,
    AdminUserSummary,
)
from utils.admin import get_current_admin


router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
)


@router.get(
    "/overview",
    response_model=AdminOverview,
)
def get_admin_overview(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    total_users = db.scalar(
        select(func.count(User.id))
    ) or 0

    total_trips = db.scalar(
        select(func.count(Trip.id))
    ) or 0

    total_public_trips = db.scalar(
        select(func.count(Trip.id)).where(
            Trip.is_public.is_(True)
        )
    ) or 0

    total_cities = db.scalar(
        select(func.count(City.id))
    ) or 0

    total_activities = db.scalar(
        select(func.count(Activity.id))
    ) or 0

    total_trip_activities = db.scalar(
        select(func.count(TripActivity.id))
    ) or 0

    total_activity_spend = db.scalar(
        select(
            func.coalesce(
                func.sum(
                    TripActivity.estimated_cost
                ),
                Decimal("0.00"),
            )
        )
    )

    return AdminOverview(
        total_users=total_users,
        total_trips=total_trips,
        total_public_trips=total_public_trips,
        total_cities=total_cities,
        total_activities=total_activities,
        total_trip_activities=total_trip_activities,
        total_activity_spend=total_activity_spend,
    )


@router.get(
    "/users",
    response_model=list[AdminUserSummary],
)
def get_admin_users(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    statement = (
        select(User)
        .order_by(User.created_at.desc())
    )

    return db.scalars(statement).all()


@router.get(
    "/trips",
    response_model=list[AdminTripSummary],
)
def get_admin_trips(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    statement = (
        select(
            Trip.id,
            Trip.user_id,
            User.name.label("user_name"),
            Trip.name,
            Trip.start_date,
            Trip.end_date,
            Trip.is_public,
            Trip.created_at,
        )
        .join(
            User,
            User.id == Trip.user_id,
        )
        .order_by(
            Trip.created_at.desc()
        )
    )

    rows = db.execute(statement).all()

    return [
        AdminTripSummary(
            id=row.id,
            user_id=row.user_id,
            user_name=row.user_name,
            name=row.name,
            start_date=str(row.start_date),
            end_date=str(row.end_date),
            is_public=row.is_public,
            created_at=row.created_at,
        )
        for row in rows
    ]