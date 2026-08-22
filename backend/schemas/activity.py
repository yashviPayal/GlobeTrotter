from datetime import date, time
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class TripActivityCreate(BaseModel):
    trip_stop_id: int = Field(..., gt=0)
    activity_id: int = Field(..., gt=0)

    # Optional: backend chooses sensible defaults.
    activity_date: date | None = None
    start_time: time | None = None

    # Optional: defaults to the activity's catalog price.
    estimated_cost: Decimal | None = Field(
        default=None,
        ge=0,
        decimal_places=2,
        max_digits=12,
    )


class TripActivityUpdate(BaseModel):
    activity_date: date | None = None
    start_time: time | None = None
    estimated_cost: Decimal | None = Field(
        default=None,
        ge=0,
        decimal_places=2,
        max_digits=12,
    )


class ActivitySummary(BaseModel):
    id: int
    name: str
    description: str | None
    category: str
    duration_hours: float
    estimated_cost: Decimal
    image_url: str | None

    model_config = ConfigDict(
        from_attributes=True
    )


class TripActivityResponse(BaseModel):
    id: int
    trip_id: int
    trip_stop_id: int
    activity_id: int
    activity_date: date
    start_time: time | None
    estimated_cost: Decimal
    activity: ActivitySummary

    model_config = ConfigDict(
        from_attributes=True
    )