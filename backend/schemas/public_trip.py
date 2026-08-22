from datetime import date, time
from decimal import Decimal

from pydantic import BaseModel


class PublicActivity(BaseModel):
    id: int
    name: str
    category: str
    duration_hours: float
    estimated_cost: Decimal
    activity_date: date
    start_time: time | None


class PublicStop(BaseModel):
    id: int
    sequence: int
    city_name: str
    country_name: str
    start_date: date
    end_date: date
    activities: list[PublicActivity]


class PublicBudget(BaseModel):
    accommodation: Decimal
    transport: Decimal
    meals: Decimal
    activities: Decimal
    total_allocated: Decimal
    total_planned: Decimal
    remaining: Decimal
    utilization_percent: Decimal


class PublicTripResponse(BaseModel):
    name: str
    description: str | None
    start_date: date
    end_date: date
    stops: list[PublicStop]
    budget: PublicBudget