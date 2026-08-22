from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from database import get_db
from models import Trip, TripActivity, User
from schemas.budget import BudgetCategory, BudgetResponse
from utils.dependencies import get_current_user


router = APIRouter(
    prefix="/api/trips/{trip_id}/budget",
    tags=["Budget"],
)


MONEY_ZERO = Decimal("0.00")


def money(value) -> Decimal:
    if value is None:
        return MONEY_ZERO

    return Decimal(str(value)).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )


@router.get(
    "/",
    response_model=BudgetResponse,
)
def get_trip_budget(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Ownership check
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

    # Sum actual trip-specific activity costs.
    activity_total = db.scalar(
        select(func.coalesce(
            func.sum(TripActivity.estimated_cost),
            0,
        )).where(
            TripActivity.trip_id == trip_id
        )
    )

    accommodation = money(
        trip.accommodation_budget
    )
    transport = money(
        trip.transport_budget
    )
    meals = money(
        trip.meal_budget
    )
    activities = money(
        activity_total
    )

    total_allocated = money(
        accommodation
        + transport
        + meals
    )

    total_planned = money(
        activities
    )

    total_planned += accommodation
    total_planned += transport
    total_planned += meals

    remaining = money(
        total_allocated - activities
    )

    if total_allocated > MONEY_ZERO:
        utilization = (
            activities
            / total_allocated
            * Decimal("100")
        )
    else:
        utilization = MONEY_ZERO

    utilization = money(utilization)

    return BudgetResponse(
        trip_id=trip.id,

        accommodation=BudgetCategory(
            allocated=accommodation,
            planned=accommodation,
            remaining=MONEY_ZERO,
        ),

        transport=BudgetCategory(
            allocated=transport,
            planned=transport,
            remaining=MONEY_ZERO,
        ),

        meals=BudgetCategory(
            allocated=meals,
            planned=meals,
            remaining=MONEY_ZERO,
        ),

        activities=BudgetCategory(
            allocated=MONEY_ZERO,
            planned=activities,
            remaining=MONEY_ZERO,
        ),

        total_allocated=total_allocated,
        total_planned=total_planned,
        remaining=remaining,
        utilization_percent=utilization,
    )