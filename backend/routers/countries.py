from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import Country
from schemas.city import CountryResponse


router = APIRouter(
    prefix="/api/countries",
    tags=["Countries"],
)


@router.get("/", response_model=list[CountryResponse])
def get_countries(
    db: Session = Depends(get_db),
):
    statement = (
        select(Country)
        .order_by(Country.name)
    )

    return db.scalars(statement).all()
