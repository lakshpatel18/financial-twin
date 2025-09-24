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
    expenses: dict  # e.g., {"rent": 1000, "food": 300, "entertainment": 200}

@app.post("/forecast")
def forecast(data: FinanceInput):
    total_expenses = sum(data.expenses.values())
    monthly_savings = data.salary - total_expenses

    # Generate 60 months projection with slight variation
    months = np.arange(1, 61)
    noise = np.random.normal(0, monthly_savings * 0.05, size=60)
    projected_savings = (monthly_savings * months + noise.cumsum()).tolist()

    # Prepare summary projections for easy display
    summary = {
        "monthly": projected_savings[0],
        "yearly": projected_savings[11],
        "2_years": projected_savings[23],
        "5_years": projected_savings[59],
    }

    # Personalized recommendation
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
        "monthly_projection": projected_savings,
        "recommendation": recommendation
    }
