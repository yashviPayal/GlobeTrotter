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
MONEY_QUANTUM = Decimal("0.01")


def money(value) -> Decimal:
    """
    Normalize any numeric value to an exact monetary Decimal
    with two decimal places.
    """
    if value is None:
        return MONEY_ZERO

    return Decimal(str(value)).quantize(
        MONEY_QUANTUM,
        rounding=ROUND_HALF_UP,
    )


def calculate_budget_data(
    trip: Trip,
    db: Session,
) -> dict:
    """
    Calculate the current budget state for a trip.

    Allocated budget:
        accommodation + transport + meals

    Planned spend:
        allocated budget + activity costs

    Remaining:
        allocated budget - activity costs

    Activity costs are read from trip_activities so the result
    always reflects the current itinerary.
    """

    activity_total = db.scalar(
        select(
            func.coalesce(
                func.sum(TripActivity.estimated_cost),
                0,
            )
        ).where(
            TripActivity.trip_id == trip.id
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
        total_allocated
        + activities
    )

    remaining = money(
        total_allocated
        - activities
    )

    if total_allocated > MONEY_ZERO:
        utilization_percent = money(
            activities
            / total_allocated
            * Decimal("100")
        )
    else:
        utilization_percent = MONEY_ZERO

    return {
        "accommodation": accommodation,
        "transport": transport,
        "meals": meals,
        "activities": activities,
        "total_allocated": total_allocated,
        "total_planned": total_planned,
        "remaining": remaining,
        "utilization_percent": utilization_percent,
    }


@router.get(
    "/",
    response_model=BudgetResponse,
)
def get_trip_budget(
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

    budget = calculate_budget_data(
        trip,
        db,
    )

    return BudgetResponse(
        trip_id=trip.id,

        accommodation=BudgetCategory(
            allocated=budget["accommodation"],
            planned=budget["accommodation"],
            remaining=MONEY_ZERO,
        ),

        transport=BudgetCategory(
            allocated=budget["transport"],
            planned=budget["transport"],
            remaining=MONEY_ZERO,
        ),

        meals=BudgetCategory(
            allocated=budget["meals"],
            planned=budget["meals"],
            remaining=MONEY_ZERO,
        ),

        activities=BudgetCategory(
            allocated=MONEY_ZERO,
            planned=budget["activities"],
            remaining=MONEY_ZERO,
        ),

        total_allocated=budget["total_allocated"],
        total_planned=budget["total_planned"],
        remaining=budget["remaining"],
        utilization_percent=budget["utilization_percent"],
    )