from datetime import date, time
from decimal import Decimal

from pydantic import BaseModel


class DailyInsight(BaseModel):
    date: date
    activity_count: int
    planned_hours: float
    free_hours: float
    status: str
    message: str


class RecommendedActivity(BaseModel):
    id: int
    name: str
    category: str
    duration_hours: float
    estimated_cost: Decimal
    reason: str


class StopInsight(BaseModel):
    stop_id: int
    city_name: str
    start_date: date
    end_date: date
    activity_count: int
    recommended_activities: list[RecommendedActivity]


class BudgetInsight(BaseModel):
    allocated: Decimal
    planned: Decimal
    remaining: Decimal
    utilization_percent: Decimal
    status: str
    message: str


class TripInsightsResponse(BaseModel):
    trip_id: int
    overall_score: int
    summary: str

    total_days: int
    planned_activity_hours: float
    average_daily_hours: float

    daily_insights: list[DailyInsight]
    stop_insights: list[StopInsight]
    budget: BudgetInsight

    warnings: list[str]
    suggestions: list[str]