"use client";
import { useState } from "react";

interface Projections {
  monthly: number;
  yearly: number;
  "2_years": number;
  "5_years": number;
}

interface ForecastResponse {
  projections: Projections;
  recommendation: string;
}

export default function Home() {
  const [salary, setSalary] = useState<number | "">("");
  const [expenses, setExpenses] = useState<number | "">("");
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (salary === "" || expenses === "") return;

    const res = await fetch("http://localhost:8001/forecast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salary, expenses }),
    });
    const data: ForecastResponse = await res.json();
    setForecast(data);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-4">Financial Health Twin</h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-6 rounded-xl shadow-md"
      >
        <input
          type="number"
          placeholder="Monthly Salary"
          value={salary}
          onChange={(e) => setSalary(Number(e.target.value))}
          className="border p-2 rounded w-full"
        />
        <input
          type="number"
          placeholder="Monthly Expenses"
          value={expenses}
          onChange={(e) => setExpenses(Number(e.target.value))}
          className="border p-2 rounded w-full"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          Forecast
        </button>
      </form>

      {forecast && (
        <div className="mt-6 p-4 bg-green-100 rounded shadow w-full max-w-md">
          <h2 className="text-xl font-semibold mb-2">Projections:</h2>
          <ul className="list-disc pl-5">
            <li>Monthly Savings: ${forecast.projections.monthly}</li>
            <li>Yearly Savings: ${forecast.projections.yearly}</li>
            <li>2 Years: ${forecast.projections["2_years"]}</li>
            <li>5 Years: ${forecast.projections["5_years"]}</li>
          </ul>
          <p className="mt-4 font-medium">{forecast.recommendation}</p>
        </div>
      )}
    </div>
  );
}
