from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
from pydantic import BaseModel
from typing import Dict

 # e.g., {"rent": 1000, "food": 300, "entertainment": 200}


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
    expenses: Dict[str, float]  # e.g., {"rent": 1000, "food": 300, "entertainment": 200}

@app.post("/forecast")
def forecast(data: FinanceInput):
    total_expenses = sum(data.expenses.values())
    monthly_savings = data.salary - total_expenses

    # Simulate realistic fluctuations over 60 months
    months = np.arange(1, 61)
    noise = np.random.normal(0, monthly_savings*0.05, size=60)
    projected_savings = monthly_savings * months + noise.cumsum()

    projections = {
        "monthly": float(projected_savings[0]),
        "yearly": float(projected_savings[11]),
        "2_years": float(projected_savings[23]),
        "5_years": float(projected_savings[59])
    }

    # AI-powered personalized tips
    highest_expense = max(data.expenses, key=data.expenses.get)
    highest_value = data.expenses[highest_expense]

    if monthly_savings < data.salary * 0.1:
        recommendation = (
            f"You are saving less than 10% of your salary. "
            f"Consider reducing your highest expense category: '{highest_expense}' (${highest_value}/month)."
        )
    elif monthly_savings > data.salary * 0.3:
        recommendation = "Excellent! You are saving a healthy portion of your income."
    else:
        recommendation = (
            f"Your savings are okay, but reducing '{highest_expense}' (${highest_value}/month) could boost it further."
        )

    return {
        "projections": projections,
        "recommendation": recommendation
    }

