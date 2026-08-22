from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class AdminOverview(BaseModel):
    total_users: int
    total_trips: int
    total_public_trips: int
    total_cities: int
    total_activities: int
    total_trip_activities: int
    total_activity_spend: Decimal


class AdminUserSummary(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class AdminTripSummary(BaseModel):
    id: int
    user_id: int
    user_name: str
    name: str
    start_date: str
    end_date: str
    is_public: bool
    created_at: datetime