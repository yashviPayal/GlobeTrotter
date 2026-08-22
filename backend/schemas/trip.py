from datetime import date

from pydantic import BaseModel, Field, model_validator


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

    accommodation_budget: float = Field(
        default=0.0,
        ge=0,
    )

    transport_budget: float = Field(
        default=0.0,
        ge=0,
    )

    meal_budget: float = Field(
        default=0.0,
        ge=0,
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

    accommodation_budget: float | None = Field(
        default=None,
        ge=0,
    )

    transport_budget: float | None = Field(
        default=None,
        ge=0,
    )

    meal_budget: float | None = Field(
        default=None,
        ge=0,
    )

    is_public: bool | None = None


class TripResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: str | None
    start_date: date
    end_date: date
    accommodation_budget: float
    transport_budget: float
    meal_budget: float
    is_public: bool
    share_code: str | None

    model_config = {
        "from_attributes": True
    }