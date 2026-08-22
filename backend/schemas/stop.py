from datetime import date

from pydantic import BaseModel, ConfigDict, Field, model_validator

from schemas.city import CountryResponse


class StopCreate(BaseModel):
    city_id: int = Field(
        ...,
        gt=0,
    )

    start_date: date
    end_date: date

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date < self.start_date:
            raise ValueError(
                "Stop end date must be on or after start date"
            )

        return self


class StopUpdate(BaseModel):
    city_id: int | None = Field(
        default=None,
        gt=0,
    )

    start_date: date | None = None
    end_date: date | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if (
            self.start_date is not None
            and self.end_date is not None
            and self.end_date < self.start_date
        ):
            raise ValueError(
                "Stop end date must be on or after start date"
            )

        return self


class StopCity(BaseModel):
    id: int
    name: str
    country_id: int
    country: CountryResponse
    region: str | None
    cost_index: float
    popularity: int
    image_url: str | None

    model_config = ConfigDict(
        from_attributes=True
    )


class StopResponse(BaseModel):
    id: int
    trip_id: int
    city_id: int
    start_date: date
    end_date: date
    sequence: int
    city: StopCity

    model_config = ConfigDict(
        from_attributes=True
    )