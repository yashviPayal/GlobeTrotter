from datetime import date, time
from decimal import Decimal

from pydantic import BaseModel


class FreeTimeWindow(BaseModel):
    date: date
    start_time: time
    end_time: time
    duration_hours: float


class FreeTimeResponse(BaseModel):
    trip_id: int
    date: date
    windows: list[FreeTimeWindow]
    total_free_hours: float


class SmartRecommendation(BaseModel):
    activity_id: int
    name: str
    category: str
    duration_hours: float
    estimated_cost: Decimal
    city_id: int
    city_name: str
    reason: str


class RecommendationResponse(BaseModel):
    trip_id: int
    budget_limit: Decimal
    recommendations: list[SmartRecommendation]


class OptimizedActivity(BaseModel):
    trip_activity_id: int
    activity_id: int
    name: str
    activity_date: date
    start_time: time
    duration_hours: float
    estimated_cost: Decimal


class OptimizeDayResponse(BaseModel):
    trip_id: int
    date: date
    activities: list[OptimizedActivity]
    total_planned_hours: float
    free_hours: float
    message: str