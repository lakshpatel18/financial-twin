from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np

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
    expenses: dict

@app.post("/forecast")
def forecast(data: FinanceInput):
    total_expenses = sum(data.expenses.values())
    monthly_savings = data.salary - total_expenses

    months = np.arange(1, 61)

    # Base scenario
    base_noise = np.random.normal(0, monthly_savings * 0.05, size=60)
    base = (monthly_savings * months + base_noise.cumsum()).tolist()

    # Optimistic scenario (+5% salary, -5% expenses)
    opt_savings = (data.salary*1.05 - total_expenses*0.95)
    opt_noise = np.random.normal(0, opt_savings*0.05, size=60)
    optimistic = (opt_savings * months + opt_noise.cumsum()).tolist()

    # Conservative scenario (-5% salary, +5% expenses)
    cons_savings = (data.salary*0.95 - total_expenses*1.05)
    cons_noise = np.random.normal(0, cons_savings*0.05, size=60)
    conservative = (cons_savings * months + cons_noise.cumsum()).tolist()

    # Summary projections (Base scenario)
    summary = {
        "monthly": base[0],
        "yearly": base[11],
        "2_years": base[23],
        "5_years": base[59],
    }

    # Recommendation
    highest_expense = max(data.expenses, key=data.expenses.get)
    highest_value = data.expenses[highest_expense]
    savings_ratio = monthly_savings / data.salary if data.salary else 0
    if savings_ratio < 0.1:
        recommendation = f"You are saving less than 10% of your salary. Reduce '{highest_expense}' (${highest_value}/month)."
    elif savings_ratio > 0.3:
        recommendation = "Excellent! You are saving a healthy portion of your income."
    else:
        recommendation = f"Your savings are okay, but reducing '{highest_expense}' (${highest_value}/month) could boost it further."

    return {
        "summary": summary,
        "scenarios": {
            "base": base,
            "optimistic": optimistic,
            "conservative": conservative
        },
        "recommendation": recommendation
    }
