from fastapi import FastAPI

from routers.auth import router as auth_router
from routers.cities import router as cities_router
from routers.countries import router as countries_router
from routers.trips import router as trips_router


app = FastAPI(
    title="GlobeTrotter API",
    description="Personalized travel planning API",
    version="1.0.0",
)


# Register API routers
app.include_router(auth_router)
app.include_router(cities_router)
app.include_router(countries_router)
app.include_router(trips_router)


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