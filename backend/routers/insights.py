from collections import defaultdict
from datetime import date, datetime, time, timedelta
from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from database import get_db
from models import Activity, Trip, TripActivity, TripStop, User
from routers.budget import calculate_budget_data
from schemas.insights import (
    BudgetInsight,
    DailyInsight,
    RecommendedActivity,
    StopInsight,
    TripInsightsResponse,
)
from utils.dependencies import get_current_user


router = APIRouter(
    prefix="/api/trips/{trip_id}/insights",
    tags=["Smart Insights"],
)


DAY_START = time(9, 0)
DAY_END = time(21, 0)
PLANNING_HOURS = 12.0


def money(value) -> Decimal:
    return Decimal(str(value)).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )


def daterange(start_date: date, end_date: date):
    current = start_date

    while current <= end_date:
        yield current
        current += timedelta(days=1)


def get_trip_with_itinerary(
    trip_id: int,
    current_user: User,
    db: Session,
):
    statement = (
        select(Trip)
        .where(
            Trip.id == trip_id,
            Trip.user_id == current_user.id,
        )
        .options(
            selectinload(Trip.stops)
            .selectinload(TripStop.city),

            selectinload(Trip.activities)
            .selectinload(TripActivity.activity),
        )
    )

    trip = db.scalar(statement)

    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found",
        )

    return trip


def calculate_daily_hours(
    activities,
):
    result = defaultdict(float)

    for item in activities:
        result[item.activity_date] += (
            item.activity.duration_hours
        )

    return result


def build_daily_insights(
    trip: Trip,
):
    daily_hours = calculate_daily_hours(
        trip.activities
    )

    daily_counts = defaultdict(int)

    for item in trip.activities:
        daily_counts[item.activity_date] += 1

    insights = []

    for current_date in daterange(
        trip.start_date,
        trip.end_date,
    ):
        planned_hours = round(
            daily_hours.get(current_date, 0.0),
            2,
        )

        activity_count = daily_counts.get(
            current_date,
            0,
        )

        free_hours = round(
            max(
                0.0,
                PLANNING_HOURS - planned_hours,
            ),
            2,
        )

        if planned_hours == 0:
            status = "empty"
            message = (
                "No activities planned. "
                "This day has plenty of free time."
            )

        elif planned_hours > 8:
            status = "overloaded"
            message = (
                "This day is quite dense. "
                "Consider moving an activity."
            )

        elif planned_hours > 6:
            status = "busy"
            message = (
                "Busy day with limited free time."
            )

        elif free_hours >= 6:
            status = "relaxed"
            message = (
                "Relaxed schedule with plenty of free time."
            )

        else:
            status = "balanced"
            message = (
                "Good balance between activities "
                "and free time."
            )

        insights.append(
            DailyInsight(
                date=current_date,
                activity_count=activity_count,
                planned_hours=planned_hours,
                free_hours=free_hours,
                status=status,
                message=message,
            )
        )

    return insights


def get_stop_recommendations(
    trip_stop: TripStop,
    trip: Trip,
    db: Session,
):
    selected_activity_ids = {
        item.activity_id
        for item in trip.activities
        if item.trip_stop_id == trip_stop.id
    }

    activities = db.scalars(
        select(Activity)
        .where(
            Activity.city_id == trip_stop.city_id,
            ~Activity.id.in_(selected_activity_ids)
            if selected_activity_ids
            else True,
        )
        .order_by(
            Activity.estimated_cost,
            Activity.duration_hours,
            Activity.name,
        )
        .limit(3)
    ).all()

    recommendations = []

    for activity in activities:
        if activity.estimated_cost == 0:
            reason = "Free activity that helps maximize your trip value."

        elif activity.duration_hours <= 2:
            reason = "Short activity that fits easily into a free-time gap."

        else:
            reason = "Good additional option for this destination."

        recommendations.append(
            RecommendedActivity(
                id=activity.id,
                name=activity.name,
                category=activity.category,
                duration_hours=activity.duration_hours,
                estimated_cost=money(
                    activity.estimated_cost
                ),
                reason=reason,
            )
        )

    return recommendations


def build_stop_insights(
    trip: Trip,
    db: Session,
):
    result = []

    for stop in sorted(
        trip.stops,
        key=lambda item: item.sequence,
    ):
        activities = [
            item
            for item in trip.activities
            if item.trip_stop_id == stop.id
        ]

        result.append(
            StopInsight(
                stop_id=stop.id,
                city_name=stop.city.name,
                start_date=stop.start_date,
                end_date=stop.end_date,
                activity_count=len(activities),
                recommended_activities=get_stop_recommendations(
                    stop,
                    trip,
                    db,
                ),
            )
        )

    return result


def build_budget_insight(
    trip: Trip,
    db: Session,
):
    budget = calculate_budget_data(
        trip,
        db,
    )

    utilization = budget["utilization_percent"]

    if budget["remaining"] < 0:
        status = "over_budget"
        message = (
            "Your planned activities exceed the "
            "allocated trip budget."
        )

    elif utilization >= Decimal("80"):
        status = "warning"
        message = (
            "You are using most of your allocated "
            "budget. Consider lower-cost activities."
        )

    elif utilization >= Decimal("50"):
        status = "moderate"
        message = (
            "Your activity spending is moderate."
        )

    else:
        status = "healthy"
        message = (
            "You still have plenty of budget "
            "flexibility."
        )

    return BudgetInsight(
        allocated=budget["total_allocated"],
        planned=budget["total_planned"],
        remaining=budget["remaining"],
        utilization_percent=utilization,
        status=status,
        message=message,
    )


def build_score(
    daily_insights,
    budget_insight,
    trip,
):
    score = 100

    overloaded_days = sum(
        1
        for item in daily_insights
        if item.status == "overloaded"
    )

    empty_days = sum(
        1
        for item in daily_insights
        if item.status == "empty"
    )

    if overloaded_days:
        score -= overloaded_days * 10

    if empty_days:
        score -= empty_days * 4

    if budget_insight.status == "over_budget":
        score -= 25

    elif budget_insight.status == "warning":
        score -= 10

    if not trip.stops:
        score -= 20

    return max(
        0,
        min(100, score),
    )


@router.get(
    "/",
    response_model=TripInsightsResponse,
)
def get_trip_insights(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = get_trip_with_itinerary(
        trip_id,
        current_user,
        db,
    )

    daily_insights = build_daily_insights(
        trip
    )

    stop_insights = build_stop_insights(
        trip,
        db,
    )

    budget = build_budget_insight(
        trip,
        db,
    )

    total_days = (
        trip.end_date - trip.start_date
    ).days + 1

    planned_hours = round(
        sum(
            item.planned_hours
            for item in daily_insights
        ),
        2,
    )

    average_daily_hours = round(
        planned_hours / total_days,
        2,
    ) if total_days else 0.0

    warnings = []
    suggestions = []

    overloaded_days = [
        item
        for item in daily_insights
        if item.status == "overloaded"
    ]

    empty_days = [
        item
        for item in daily_insights
        if item.status == "empty"
    ]

    if overloaded_days:
        warnings.append(
            f"{len(overloaded_days)} day(s) have more than "
            "8 hours of planned activities."
        )

    if budget.status == "over_budget":
        warnings.append(
            "Your planned activity spending exceeds "
            "your allocated budget."
        )

    elif budget.status == "warning":
        warnings.append(
            "Your activity spending is approaching "
            "the allocated budget."
        )

    if empty_days:
        suggestions.append(
            "Consider adding activities to one or more "
            "completely free days."
        )

    if any(
        item.free_hours >= 5
        for item in daily_insights
    ):
        suggestions.append(
            "You have large free-time windows that could "
            "accommodate additional activities."
        )

    if any(
        item.recommended_activities
        for item in stop_insights
    ):
        suggestions.append(
            "Some destinations have additional low-cost "
            "activities that could fit your schedule."
        )

    score = build_score(
        daily_insights,
        budget,
        trip,
    )

    if score >= 90:
        summary = (
            "Your trip is well balanced with a "
            "healthy schedule and budget."
        )

    elif score >= 75:
        summary = (
            "Your trip looks good overall, with a few "
            "areas that could be optimized."
        )

    elif score >= 50:
        summary = (
            "Your itinerary could benefit from some "
            "schedule or budget adjustments."
        )

    else:
        summary = (
            "Your trip needs attention before it is "
            "fully balanced."
        )

    return TripInsightsResponse(
        trip_id=trip.id,
        overall_score=score,
        summary=summary,
        total_days=total_days,
        planned_activity_hours=planned_hours,
        average_daily_hours=average_daily_hours,
        daily_insights=daily_insights,
        stop_insights=stop_insights,
        budget=budget,
        warnings=warnings,
        suggestions=suggestions,
    )