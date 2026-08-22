from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import Activity, City
from schemas.city import ActivityResponse, CityResponse


router = APIRouter(
    prefix="/api/cities",
    tags=["Cities"],
)


@router.get("/", response_model=list[CityResponse])
def get_cities(
    db: Session = Depends(get_db),
):
    statement = (
        select(City)
        .order_by(City.popularity.desc())
    )

    cities = db.scalars(statement).all()

    return cities


@router.get("/search", response_model=list[CityResponse])
def search_cities(
    query: str = Query(
        ...,
        min_length=2,
        max_length=100,
        description="City name to search for",
    ),
    db: Session = Depends(get_db),
):
    search_term = f"%{query.strip()}%"

    statement = (
        select(City)
        .where(City.name.ilike(search_term))
        .order_by(City.popularity.desc())
    )

    cities = db.scalars(statement).all()

    return cities


@router.get("/{city_id}", response_model=CityResponse)
def get_city(
    city_id: int,
    db: Session = Depends(get_db),
):
    city = db.get(City, city_id)

    if not city:
        raise HTTPException(
            status_code=404,
            detail="City not found",
        )

    return city


@router.get(
    "/{city_id}/activities",
    response_model=list[ActivityResponse],
)
def get_city_activities(
    city_id: int,
    db: Session = Depends(get_db),
):
    city = db.get(City, city_id)

    if not city:
        raise HTTPException(
            status_code=404,
            detail="City not found",
        )

    statement = (
        select(Activity)
        .where(Activity.city_id == city_id)
        .order_by(Activity.name)
    )

    activities = db.scalars(statement).all()

    return activities