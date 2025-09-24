from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict

app = FastAPI()

origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FinanceInput(BaseModel):
    salary: float
    expenses: Dict[str, float]
    base_goal: float = 50000
    optimistic_goal: float = 60000
    conservative_goal: float = 40000

def generate_projections(salary: float, expenses: Dict[str,float], months=60):
    total_expenses = sum(expenses.values())
    base = []
    optimistic = []
    conservative = []

    for month in range(1, months+1):
        base_monthly = salary - total_expenses
        optimistic_monthly = (salary * (1 + 0.003)**month) - (total_expenses * (1 + 0.002)**month)
        conservative_monthly = salary - (total_expenses * (1 + 0.005)**month)
        base.append(base_monthly)
        optimistic.append(optimistic_monthly)
        conservative.append(conservative_monthly)

    # cumulative savings
    base_cum = [sum(base[:i+1]) for i in range(months)]
    optimistic_cum = [sum(optimistic[:i+1]) for i in range(months)]
    conservative_cum = [sum(conservative[:i+1]) for i in range(months)]

    return base_cum, optimistic_cum, conservative_cum

def goal_month(projections, target):
    for idx, value in enumerate(projections):
        if value >= target:
            return idx + 1
    return None

@app.post("/forecast")
def forecast(data: FinanceInput):
    base_cum, optimistic_cum, conservative_cum = generate_projections(data.salary, data.expenses)

    summary = {
        "monthly": base_cum[0],                 # first month savings
        "yearly": base_cum[11] if len(base_cum) > 11 else base_cum[-1], # after 1 year
        "2_years": base_cum[23] if len(base_cum) > 23 else base_cum[-1],
        "5_years": base_cum[-1]
    }

    response = {
        "summary": summary,
        "scenarios": {
            "base": base_cum,
            "optimistic": optimistic_cum,
            "conservative": conservative_cum
        },
        "recommendation": "Consider saving more on discretionary expenses."
    }

    return response
