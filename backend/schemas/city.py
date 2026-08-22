from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CountryResponse(BaseModel):
    id: int
    name: str
    code: str

    model_config = ConfigDict(from_attributes=True)


class ActivityResponse(BaseModel):
    id: int
    name: str
    description: str | None
    category: str
    duration_hours: float = Field(gt=0)
    estimated_cost: Decimal
    image_url: str | None

    model_config = ConfigDict(from_attributes=True)


class CityResponse(BaseModel):
    id: int
    name: str
    country_id: int
    country: CountryResponse
    region: str | None
    cost_index: float
    popularity: int
    image_url: str | None

    model_config = ConfigDict(from_attributes=True)
