from fastapi import FastAPI
from routers.stops import router as stops_router
from routers.auth import router as auth_router
from routers.cities import router as cities_router
from routers.countries import router as countries_router
from routers.trips import router as trips_router
from routers.activities import router as activities_router
from routers.budget import router as budget_router
from routers.public import router as public_router
from routers.insights import router as insights_router
from routers.smart import router as smart_router

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
app.include_router(stops_router)
app.include_router(activities_router)
app.include_router(budget_router)
app.include_router(public_router)
app.include_router(insights_router)
app.include_router(smart_router)

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