"use client";
import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
  const [targetSavings, setTargetSavings] = useState<number>(50000);
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

  useEffect(() => {
    fetchForecast();
  }, [salary, expenses]);

  const chartData = forecast?.scenarios?.base
    ? forecast.scenarios.base.map((_, idx) => ({
        month: idx + 1,
        base: forecast.scenarios.base[idx],
        optimistic: forecast.scenarios.optimistic[idx],
        conservative: forecast.scenarios.conservative[idx],
      }))
    : [];

  const baseGoalMonth =
    forecast?.scenarios?.base?.findIndex((s) => s >= targetSavings) + 1 || null;
  const optimisticGoalMonth =
    forecast?.scenarios?.optimistic?.findIndex((s) => s >= targetSavings) + 1 ||
    null;
  const conservativeGoalMonth =
    forecast?.scenarios?.conservative?.findIndex((s) => s >= targetSavings) + 1 ||
    null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-b from-blue-50 to-purple-100 p-6 font-sans">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">💎 Financial Health Twin</h1>

      {/* Sliders Section */}
      <div className="w-full max-w-md bg-white/30 backdrop-blur-lg rounded-2xl p-6 shadow-xl space-y-6 border border-white/20">
        <div>
          <label className="block mb-1 font-semibold text-gray-700">Monthly Salary: ${salary}</label>
          <input
            type="range"
            min={1000}
            max={20000}
            step={100}
            value={salary}
            onChange={(e) => setSalary(Number(e.target.value))}
            className="w-full accent-purple-400"
          />
        </div>

        {Object.keys(expenses).map((key) => (
          <div key={key}>
            <label className="block mb-1 font-semibold text-gray-700">
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
              className="w-full accent-pink-400"
            />
          </div>
        ))}

        <div>
          <label className="block mb-1 font-semibold text-gray-700">
            Target Savings: ${targetSavings}
          </label>
          <input
            type="range"
            min={1000}
            max={200000}
            step={1000}
            value={targetSavings}
            onChange={(e) => setTargetSavings(Number(e.target.value))}
            className="w-full accent-green-400"
          />
        </div>
      </div>

      {/* Forecast Section */}
      {forecast && (
        <div className="mt-10 w-full max-w-3xl space-y-8">
          {/* Summary Card */}
          <div className="bg-white/30 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">📊 Projections</h2>
            <ul className="grid grid-cols-2 gap-4 text-gray-700 font-medium">
              <li>Monthly Savings: ${forecast.summary.monthly.toFixed(2)}</li>
              <li>Yearly Savings: ${forecast.summary.yearly.toFixed(2)}</li>
              <li>2 Years: ${forecast.summary["2_years"].toFixed(2)}</li>
              <li>5 Years: ${forecast.summary["5_years"].toFixed(2)}</li>
            </ul>
            <p className="mt-4 text-gray-800 font-medium">{forecast.recommendation}</p>
          </div>

          {/* Chart Card */}
          <div className="bg-white/30 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                <XAxis
                  dataKey="month"
                  label={{ value: "Month", position: "insideBottomRight", offset: -5, fill: "#555" }}
                />
                <YAxis label={{ value: "Savings ($)", angle: -90, position: "insideLeft", fill: "#555" }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="base" stroke="#8884d8" strokeWidth={2} name="Base (BG)" />
                <Line type="monotone" dataKey="optimistic" stroke="#82ca9d" strokeWidth={2} name="Optimistic (OG)" />
                <Line type="monotone" dataKey="conservative" stroke="#ff6b6b" strokeWidth={2} name="Conservative (CG)" />

                {baseGoalMonth && <ReferenceLine x={baseGoalMonth} stroke="#8884d8" strokeDasharray="3 3" label="BG" />}
                {optimisticGoalMonth && <ReferenceLine x={optimisticGoalMonth} stroke="#82ca9d" strokeDasharray="3 3" label="OG" />}
                {conservativeGoalMonth && <ReferenceLine x={conservativeGoalMonth} stroke="#ff6b6b" strokeDasharray="3 3" label="CG" />}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Goal Info Card */}
          <div className="bg-white/30 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            <h3 className="font-semibold mb-2 text-gray-800">🎯 Goal Simulation</h3>
            <ul className="text-gray-700 font-medium">
              <li>Base (BG): {baseGoalMonth ? `${baseGoalMonth} month(s)` : "Goal not reached"}</li>
              <li>Optimistic (OG): {optimisticGoalMonth ? `${optimisticGoalMonth} month(s)` : "Goal not reached"}</li>
              <li>Conservative (CG): {conservativeGoalMonth ? `${conservativeGoalMonth} month(s)` : "Goal not reached"}</li>
            </ul>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-4 justify-center">
            <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl shadow hover:bg-blue-700 transition font-semibold">
              📄 Export CSV
            </button>
            <button className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-2xl shadow hover:bg-green-700 transition font-semibold">
              📊 Export PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
