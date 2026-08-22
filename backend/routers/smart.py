from datetime import date, datetime, time, timedelta
from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from database import get_db
from models import Activity, Trip, TripActivity, TripStop, User
from schemas.smart import (
    FreeTimeResponse,
    FreeTimeWindow,
    OptimizeDayResponse,
    OptimizedActivity,
    RecommendationResponse,
    SmartRecommendation,
)
from utils.dependencies import get_current_user
from schemas.assistant import AssistantResponse

router = APIRouter(
    prefix="/api/trips/{trip_id}/smart",
    tags=["Smart Features"],
)


DAY_START = time(9, 0)
DAY_END = time(21, 0)
BUFFER_MINUTES = 30


def money(value) -> Decimal:
    return Decimal(str(value)).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
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


def get_activities_for_date(
    trip_id: int,
    activity_date: date,
    db: Session,
):
    statement = (
        select(TripActivity)
        .options(
            selectinload(TripActivity.activity),
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

    return db.scalars(statement).all()


def validate_trip_date(
    trip: Trip,
    requested_date: date,
):
    if not (
        trip.start_date
        <= requested_date
        <= trip.end_date
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Date must be between "
                f"{trip.start_date} and {trip.end_date}"
            ),
        )


def get_stop_for_date(
    trip: Trip,
    requested_date: date,
):
    for stop in trip.stops:
        if (
            stop.start_date
            <= requested_date
            <= stop.end_date
        ):
            return stop

    return None


def datetime_from_time(
    requested_date: date,
    requested_time: time,
):
    return datetime.combine(
        requested_date,
        requested_time,
    )


def calculate_free_windows(
    requested_date: date,
    activities,
):
    day_start = datetime_from_time(
        requested_date,
        DAY_START,
    )

    day_end = datetime_from_time(
        requested_date,
        DAY_END,
    )

    occupied = []

    for item in activities:
        if item.start_time is None:
            continue

        start = datetime_from_time(
            requested_date,
            item.start_time,
        )

        end = start + timedelta(
            hours=item.activity.duration_hours,
        )

        occupied.append(
            (start, end)
        )

    occupied.sort(
        key=lambda value: value[0]
    )

    windows = []
    cursor = day_start

    for start, end in occupied:
        if start > cursor:
            duration = (
                start - cursor
            ).total_seconds() / 3600

            if duration >= 1.0:
                windows.append(
                    FreeTimeWindow(
                        date=requested_date,
                        start_time=cursor.time(),
                        end_time=start.time(),
                        duration_hours=round(
                            duration,
                            2,
                        ),
                    )
                )

        if end > cursor:
            cursor = end

    if cursor < day_end:
        duration = (
            day_end - cursor
        ).total_seconds() / 3600

        if duration >= 1.0:
            windows.append(
                FreeTimeWindow(
                    date=requested_date,
                    start_time=cursor.time(),
                    end_time=day_end.time(),
                    duration_hours=round(
                        duration,
                        2,
                    ),
                )
            )

    return windows


@router.get(
    "/free-time",
    response_model=FreeTimeResponse,
)
def find_free_time(
    trip_id: int,
    date_value: date = Query(
        ...,
        alias="date",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = get_user_trip(
        trip_id,
        current_user,
        db,
    )

    validate_trip_date(
        trip,
        date_value,
    )

    activities = get_activities_for_date(
        trip_id,
        date_value,
        db,
    )

    windows = calculate_free_windows(
        date_value,
        activities,
    )

    total_free = round(
        sum(
            window.duration_hours
            for window in windows
        ),
        2,
    )

    return FreeTimeResponse(
        trip_id=trip_id,
        date=date_value,
        windows=windows,
        total_free_hours=total_free,
    )


@router.get(
    "/recommendations",
    response_model=RecommendationResponse,
)
def get_smart_recommendations(
    trip_id: int,
    budget_limit: Decimal = Query(
        ...,
        ge=0,
        decimal_places=2,
        max_digits=12,
    ),
    city_id: int | None = Query(
        default=None,
        gt=0,
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = get_user_trip(
        trip_id,
        current_user,
        db,
    )

    selected_activity_ids = {
        item.activity_id
        for item in trip.activities
    }

    statement = (
        select(Activity)
        .where(
            Activity.estimated_cost <= budget_limit,
        )
        .order_by(
            Activity.estimated_cost,
            Activity.duration_hours,
            Activity.name,
        )
    )

    if city_id is not None:
        statement = statement.where(
            Activity.city_id == city_id
        )

    if selected_activity_ids:
        statement = statement.where(
            ~Activity.id.in_(selected_activity_ids)
        )

    activities = db.scalars(
        statement.limit(10)
    ).all()

    recommendations = []

    for activity in activities:
        if activity.estimated_cost == 0:
            reason = (
                "Free activity that adds value without "
                "increasing your activity budget."
            )

        elif activity.estimated_cost <= budget_limit / 2:
            reason = (
                "Affordable option that leaves room "
                "for additional activities."
            )

        elif activity.duration_hours <= 2:
            reason = (
                "Short activity that is easier to fit "
                "into an existing free-time window."
            )

        else:
            reason = (
                "Good destination activity within "
                "your selected budget."
            )

        recommendations.append(
            SmartRecommendation(
                activity_id=activity.id,
                name=activity.name,
                category=activity.category,
                duration_hours=activity.duration_hours,
                estimated_cost=money(
                    activity.estimated_cost
                ),
                city_id=activity.city_id,
                city_name=activity.city.name,
                reason=reason,
            )
        )

    return RecommendationResponse(
        trip_id=trip.id,
        budget_limit=money(budget_limit),
        recommendations=recommendations,
    )


@router.post(
    "/optimize-day",
    response_model=OptimizeDayResponse,
)
def optimize_day(
    trip_id: int,
    date_value: date = Query(
        ...,
        alias="date",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = get_user_trip(
        trip_id,
        current_user,
        db,
    )

    validate_trip_date(
        trip,
        date_value,
    )

    activities = get_activities_for_date(
        trip_id,
        date_value,
        db,
    )

    if not activities:
        return OptimizeDayResponse(
            trip_id=trip_id,
            date=date_value,
            activities=[],
            total_planned_hours=0.0,
            free_hours=12.0,
            message="No activities found for this day.",
        )

    # Intelligent heuristic:
    # longer activities go earlier so the day has
    # flexible short activities later.
    activities.sort(
        key=lambda item: (
            -item.activity.duration_hours,
            item.activity.name,
        )
    )

    current_time = datetime_from_time(
        date_value,
        DAY_START,
    )

    day_end = datetime_from_time(
        date_value,
        DAY_END,
    )

    optimized = []

    for item in activities:
        duration = timedelta(
            hours=item.activity.duration_hours
        )

        if current_time + duration > day_end:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "The selected day's activities cannot "
                    "fit into the 09:00–21:00 planning window."
                ),
            )

        item.start_time = current_time.time()

        optimized.append(
            item
        )

        current_time += duration
        current_time += timedelta(
            minutes=BUFFER_MINUTES
        )

    db.commit()

    total_hours = round(
        sum(
            item.activity.duration_hours
            for item in optimized
        ),
        2,
    )

    free_hours = round(
        max(
            0,
            12
            - total_hours
            - (
                BUFFER_MINUTES
                * max(0, len(optimized) - 1)
                / 60
            ),
        ),
        2,
    )

    result = [
        OptimizedActivity(
            trip_activity_id=item.id,
            activity_id=item.activity_id,
            name=item.activity.name,
            activity_date=item.activity_date,
            start_time=item.start_time,
            duration_hours=item.activity.duration_hours,
            estimated_cost=money(
                item.estimated_cost
            ),
        )
        for item in optimized
    ]

    return OptimizeDayResponse(
        trip_id=trip_id,
        date=date_value,
        activities=result,
        total_planned_hours=total_hours,
        free_hours=free_hours,
        message=(
            "Activities were automatically reordered and "
            "rescheduled to create a balanced day."
        ),
    )

@router.get(
    "/assistant",
    response_model=AssistantResponse,
)
def get_trip_assistant(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = get_user_trip(
        trip_id,
        current_user,
        db,
    )

    daily_insights = build_daily_insights(trip)
    budget = build_budget_insight(trip, db)
    stop_insights = build_stop_insights(trip, db)

    score = build_score(
        daily_insights,
        budget,
        trip,
    )

    priority_warning = None
    priority_suggestion = None

    overloaded = [
        item
        for item in daily_insights
        if item.status == "overloaded"
    ]

    empty = [
        item
        for item in daily_insights
        if item.status == "empty"
    ]

    if budget.status == "over_budget":
        priority_warning = (
            "Your planned activities exceed your allocated budget."
        )
        priority_suggestion = (
            "Replace expensive activities with lower-cost alternatives."
        )

    elif overloaded:
        priority_warning = (
            f"{overloaded[0].date} has a very dense schedule."
        )
        priority_suggestion = (
            "Move one activity to another free day."
        )

    elif empty:
        priority_warning = (
            f"{empty[0].date} currently has no planned activities."
        )
        priority_suggestion = (
            "Consider adding an activity to make better use of the day."
        )

    # Pick recommendations from the first stop that has them.
    recommendations = []

    for stop in stop_insights:
        if stop.recommended_activities:
            recommendations = stop.recommended_activities[:3]
            break

    total_free_hours = round(
        sum(
            item.free_hours
            for item in daily_insights
        ),
        2,
    )

    if score >= 90:
        summary = "Your trip is well balanced and ready to go."

    elif score >= 75:
        summary = (
            "Your trip looks good, with a few opportunities to improve it."
        )

    elif score >= 50:
        summary = (
            "Your itinerary needs a little optimization before it is ideal."
        )

    else:
        summary = (
            "Your itinerary needs attention to improve schedule and budget."
        )

    return AssistantResponse(
        trip_id=trip.id,
        overall_score=score,
        summary=summary,
        budget=budget,
        priority_warning=priority_warning,
        priority_suggestion=priority_suggestion,
        daily_insights=daily_insights,
        recommendations=recommendations,
        total_free_hours=total_free_hours,
    )