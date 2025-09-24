from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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
    expenses: float

@app.post("/forecast")
def forecast(data: FinanceInput):
    monthly_savings = data.salary - data.expenses
    yearly_savings = monthly_savings * 12

    # Future projections assuming constant savings
    projections = {
        "monthly": monthly_savings,
        "yearly": yearly_savings,
        "2_years": yearly_savings * 2,
        "5_years": yearly_savings * 5
    }

    # Simple recommendations
    recommendation = ""
    savings_ratio = monthly_savings / data.salary if data.salary else 0
    if savings_ratio < 0.1:
        recommendation = "Try reducing expenses to save more each month."
    elif savings_ratio > 0.3:
        recommendation = "Great job! You are saving a healthy portion of your income."

    return {
        "projections": projections,
        "recommendation": recommendation
    }
