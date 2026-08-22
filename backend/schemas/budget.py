from decimal import Decimal

from pydantic import BaseModel


class BudgetCategory(BaseModel):
    allocated: Decimal
    planned: Decimal
    remaining: Decimal


class BudgetResponse(BaseModel):
    trip_id: int

    accommodation: BudgetCategory
    transport: BudgetCategory
    meals: BudgetCategory
    activities: BudgetCategory

    total_allocated: Decimal
    total_planned: Decimal
    remaining: Decimal

    utilization_percent: Decimal