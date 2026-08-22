from fastapi import FastAPI

from database import Base, engine
from models import Activity, City, Trip, TripActivity, TripStop, User
from routers.cities import router as cities_router


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="GlobeTrotter API",
    description="Personalized travel planning API",
    version="1.0.0",
)


app.include_router(cities_router)


@app.get("/")
def root():
    return {
        "message": "GlobeTrotter API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }