from decimal import Decimal
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field, model_validator


class TripCreate(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )

    description: str | None = Field(
        default=None,
        max_length=1000,
    )

    start_date: date
    end_date: date

    accommodation_budget: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        decimal_places=2,
        max_digits=12,
    )

    transport_budget: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        decimal_places=2,
        max_digits=12,
    )

    meal_budget: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        decimal_places=2,
        max_digits=12,
    )

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date < self.start_date:
            raise ValueError(
                "End date must be on or after start date"
            )

        return self


class TripUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    description: str | None = Field(
        default=None,
        max_length=1000,
    )

    start_date: date | None = None
    end_date: date | None = None

    accommodation_budget: Decimal | None = Field(
        default=None,
        ge=0,
        decimal_places=2,
        max_digits=12,
    )

    transport_budget: Decimal | None = Field(
        default=None,
        ge=0,
        decimal_places=2,
        max_digits=12,
    )

    meal_budget: Decimal | None = Field(
        default=None,
        ge=0,
        decimal_places=2,
        max_digits=12,
    )

    is_public: bool | None = None


class TripResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: str | None
    start_date: date
    end_date: date
    accommodation_budget: Decimal
    transport_budget: Decimal
    meal_budget: Decimal
    is_public: bool
    share_code: str | None
    created_at: datetime
    updated_at: datetime
    ordering_mode: str
    
    model_config = ConfigDict(from_attributes=True)