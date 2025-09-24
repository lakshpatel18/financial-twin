"use client";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
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

  const chartData = forecast
    ? forecast.scenarios.base.map((_, idx) => ({
        month: idx + 1,
        base: forecast.scenarios.base[idx],
        optimistic: forecast.scenarios.optimistic[idx],
        conservative: forecast.scenarios.conservative[idx],
      }))
    : [];

  const exportCSV = () => {
    if (!forecast) return;
    let csv = "Month,Base,Optimistic,Conservative\n";
    forecast.scenarios.base.forEach((_, idx) => {
      csv += `${idx + 1},${forecast.scenarios.base[idx]},${forecast.scenarios.optimistic[idx]},${forecast.scenarios.conservative[idx]}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "financial_projection.csv");
  };

  const exportPDF = async () => {
    if (!forecast) return;
    const doc = new jsPDF("p", "mm", "a4");

    doc.setFontSize(16);
    doc.text("Financial Health Twin Projections", 10, 10);

    doc.setFontSize(12);
    doc.text(`Monthly Salary: $${salary}`, 10, 20);
    doc.text(`Expenses: ${JSON.stringify(expenses)}`, 10, 30);
    doc.text("Summary:", 10, 40);
    doc.text(`Monthly: $${forecast.summary.monthly.toFixed(2)}`, 10, 50);
    doc.text(`Yearly: $${forecast.summary.yearly.toFixed(2)}`, 10, 60);
    doc.text(`2 Years: $${forecast.summary["2_years"].toFixed(2)}`, 10, 70);
    doc.text(`5 Years: $${forecast.summary["5_years"].toFixed(2)}`, 10, 80);

    const chartElement = document.getElementById("chart-container");
    if (chartElement) {
      const canvas = await html2canvas(chartElement);
      const imgData = canvas.toDataURL("image/png");
      doc.addPage();
      doc.text("Savings Projection Chart", 10, 10);
      doc.addImage(imgData, "PNG", 10, 20, 190, 100);
    }

    doc.save("financial_projection.pdf");
  };

  const goalMonth = (arr: number[], target: number) => {
    const idx = arr.findIndex((savings) => savings >= target);
    return idx >= 0 ? idx + 1 : null;
  };

  const baseGoalMonth = forecast ? goalMonth(forecast.scenarios.base, targetSavings) : null;
  const optimisticGoalMonth = forecast ? goalMonth(forecast.scenarios.optimistic, targetSavings) : null;
  const conservativeGoalMonth = forecast ? goalMonth(forecast.scenarios.conservative, targetSavings) : null;

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

        {/* Target Savings Slider */}
        <div>
          <label className="block mb-1 font-medium">Target Savings: ${targetSavings}</label>
          <input
            type="range"
            min={1000}
            max={200000}
            step={1000}
            value={targetSavings}
            onChange={(e) => setTargetSavings(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Forecast */}
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

          {/* Chart */}
          <div id="chart-container" className="w-full h-96">
            <ResponsiveContainer width="100%" height={400}>
  <LineChart
    data={chartData}
    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
  >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis
      dataKey="month"
      label={{ value: "Month", position: "insideBottomRight", offset: -5 }}
    />
    <YAxis label={{ value: "Savings ($)", angle: -90, position: "insideLeft" }} />
    <Tooltip />
    <Legend />
    
    {/* Lines for each scenario */}
    <Line
      type="monotone"
      dataKey="base"
      stroke="#8884d8"
      strokeWidth={2}
      name="Base (BG)"
    />
    <Line
      type="monotone"
      dataKey="optimistic"
      stroke="#82ca9d"
      strokeWidth={2}
      name="Optimistic (OG)"
    />
    <Line
      type="monotone"
      dataKey="conservative"
      stroke="#ff6b6b"
      strokeWidth={2}
      name="Conservative (CG)"
    />

    {/* ReferenceLines for goal achievement */}
    {baseGoalMonth && (
      <ReferenceLine
        x={baseGoalMonth}
        stroke="#8884d8"
        strokeDasharray="3 3"
        label={{ value: "BG", position: "top", fill: "#8884d8" }}
      />
    )}
    {optimisticGoalMonth && (
      <ReferenceLine
        x={optimisticGoalMonth}
        stroke="#82ca9d"
        strokeDasharray="3 3"
        label={{ value: "OG", position: "top", fill: "#82ca9d" }}
      />
    )}
    {conservativeGoalMonth && (
      <ReferenceLine
        x={conservativeGoalMonth}
        stroke="#ff6b6b"
        strokeDasharray="3 3"
        label={{ value: "CG", position: "top", fill: "#ff6b6b" }}
      />
    )}
  </LineChart>
</ResponsiveContainer>

          </div>

          {/* Goal Info */}
          <div className="mt-4 p-4 bg-yellow-100 rounded shadow">
            <h3 className="font-semibold mb-2">Goal Simulation</h3>
            <ul className="list-disc pl-5">
              <li>Base (BG): {baseGoalMonth ? `${baseGoalMonth} month(s)` : "Goal not reached"}</li>
              <li>Optimistic (OG): {optimisticGoalMonth ? `${optimisticGoalMonth} month(s)` : "Goal not reached"}</li>
              <li>Conservative (CG): {conservativeGoalMonth ? `${conservativeGoalMonth} month(s)` : "Goal not reached"}</li>
            </ul>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-4 mt-6 justify-center">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition font-semibold"
            >
              📄 Export CSV
            </button>
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg shadow hover:bg-green-700 transition font-semibold"
            >
              📊 Export PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
