"use client";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Projections {
  monthly: number;
  yearly: number;
  "2_years": number;
  "5_years": number;
}

interface ForecastResponse {
  summary: Projections;
  scenarios: {
    base: number[];
    optimistic: number[];
    conservative: number[];
  };
  recommendation: string;
}

export default function Home() {
  const [salary, setSalary] = useState<number>(5000);
  const [expenses, setExpenses] = useState<{ [key: string]: number }>({
    rent: 1000,
    food: 500,
    entertainment: 300,
  });
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);

  const fetchForecast = async () => {
    const res = await fetch("http://localhost:8001/forecast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salary, expenses }),
    });
    const data: ForecastResponse = await res.json();
    setForecast(data);
  };

  // Fetch new forecast whenever salary or expenses change
  useEffect(() => {
    fetchForecast();
  }, [salary, expenses]);

  // Prepare chart data dynamically
  const chartData = forecast
    ? forecast.scenarios.base.map((_, idx) => ({
        month: idx + 1,
        base: forecast.scenarios.base[idx],
        optimistic: forecast.scenarios.optimistic[idx],
        conservative: forecast.scenarios.conservative[idx],
      }))
    : [];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6">Financial Health Twin</h1>

      {/* Sliders */}
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md space-y-6">
        <div>
          <label className="block mb-1 font-medium">Monthly Salary: ${salary}</label>
          <input
            type="range"
            min={1000}
            max={20000}
            step={100}
            value={salary}
            onChange={(e) => setSalary(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {Object.keys(expenses).map((key) => (
          <div key={key}>
            <label className="block mb-1 font-medium">
              {key.charAt(0).toUpperCase() + key.slice(1)}: ${expenses[key]}
            </label>
            <input
              type="range"
              min={0}
              max={5000}
              step={50}
              value={expenses[key]}
              onChange={(e) =>
                setExpenses({ ...expenses, [key]: Number(e.target.value) })
              }
              className="w-full"
            />
          </div>
        ))}
      </div>

      {/* Forecast Display */}
      {forecast && (
        <div className="mt-6 w-full max-w-3xl">
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
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                label={{ value: "Month", position: "insideBottomRight", offset: -5 }}
              />
              <YAxis label={{ value: "Savings ($)", angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="base" stroke="#8884d8" strokeWidth={2} name="Base" />
              <Line type="monotone" dataKey="optimistic" stroke="#82ca9d" strokeWidth={2} name="Optimistic" />
              <Line type="monotone" dataKey="conservative" stroke="#ff6b6b" strokeWidth={2} name="Conservative" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
