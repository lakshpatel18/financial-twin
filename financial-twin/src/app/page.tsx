"use client";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Projections {
  monthly: number;
  yearly: number;
  "2_years": number;
  "5_years": number;
}

interface ForecastResponse {
  summary: Projections;
  monthly_projection: number[];
  recommendation: string;
}

export default function Home() {
  const [salary, setSalary] = useState<number | "">("");
  const [expenses, setExpenses] = useState<{ [key: string]: number }>({
    rent: 0,
    food: 0,
    entertainment: 0,
  });
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      salary === "" ||
      Object.values(expenses).some(
        (v) => isNaN(v) || v === null || v === undefined
      )
    )
      return;

    const res = await fetch("http://localhost:8001/forecast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salary, expenses }),
    });
    const data: ForecastResponse = await res.json();
    setForecast(data);
  };

  // Prepare chart data dynamically for 60 months
  const chartData = forecast
    ? forecast.monthly_projection.map((savings, idx) => ({
        month: idx + 1,
        savings: savings,
      }))
    : [];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6">Financial Health Twin</h1>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-6 rounded-xl shadow-md w-full max-w-md"
      >
        <div>
          <label className="block mb-1 font-medium">Monthly Salary</label>
          <input
            type="number"
            placeholder="Enter your monthly salary"
            value={salary}
            onChange={(e) => setSalary(Number(e.target.value))}
            className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Rent</label>
          <input
            type="number"
            placeholder="Enter rent expense"
            value={expenses.rent}
            onChange={(e) =>
              setExpenses({ ...expenses, rent: Number(e.target.value) })
            }
            className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Food</label>
          <input
            type="number"
            placeholder="Enter food expense"
            value={expenses.food}
            onChange={(e) =>
              setExpenses({ ...expenses, food: Number(e.target.value) })
            }
            className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Entertainment</label>
          <input
            type="number"
            placeholder="Enter entertainment expense"
            value={expenses.entertainment}
            onChange={(e) =>
              setExpenses({ ...expenses, entertainment: Number(e.target.value) })
            }
            className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 transition"
        >
          Forecast
        </button>
      </form>

      {/* Forecast Display */}
      {forecast && (
        <div className="mt-6 w-full max-w-md">
          <div className="p-4 bg-green-100 rounded shadow mb-6">
            <h2 className="text-xl font-semibold mb-2">Projections:</h2>
            <ul className="list-disc pl-5">
              <li>Monthly Savings: ${forecast.summary.monthly.toFixed(2)}</li>
              <li>Yearly Savings: ${forecast.summary.yearly.toFixed(2)}</li>
              <li>2 Years: ${forecast.summary["2_years"].toFixed(2)}</li>
              <li>5 Years: ${forecast.summary["5_years"].toFixed(2)}</li>
            </ul>
            <p className="mt-4 font-medium">{forecast.recommendation}</p>
          </div>

          {/* Line Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                label={{ value: "Month", position: "insideBottomRight", offset: -5 }}
              />
              <YAxis label={{ value: "Savings ($)", angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="savings" stroke="#8884d8" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
