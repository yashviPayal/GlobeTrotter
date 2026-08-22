from pydantic import BaseModel, ConfigDict


class ActivityResponse(BaseModel):
    id: int
    name: str
    description: str | None
    category: str
    duration_hours: float
    estimated_cost: float
    image_url: str | None

    model_config = ConfigDict(from_attributes=True)


class CityResponse(BaseModel):
    id: int
    name: str
    country: str
    region: str | None
    cost_index: float
    popularity: int
    image_url: str | None

    model_config = ConfigDict(from_attributes=True)