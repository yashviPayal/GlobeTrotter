from decimal import Decimal

from pydantic import BaseModel

from schemas.insights import (
    BudgetInsight,
    DailyInsight,
    RecommendedActivity,
)


class AssistantResponse(BaseModel):
    trip_id: int
    overall_score: int
    summary: str

    budget: BudgetInsight

    priority_warning: str | None
    priority_suggestion: str | None

    daily_insights: list[DailyInsight]
    recommendations: list[RecommendedActivity]

    total_free_hours: float