from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Allow frontend (localhost:3000) to access backend
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input model
class FinanceInput(BaseModel):
    salary: float
    expenses: float

# Endpoint to calculate savings
@app.post("/forecast")
def forecast(data: FinanceInput):
    monthly_savings = data.salary - data.expenses
    yearly_savings = monthly_savings * 12
    return {"savings": yearly_savings}
