"use client";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { MonthlyTrendPoint, GenreStat } from "@/types";

const COLORS = ["#0D7377", "#5BADAE", "#E0F4F4", "#0F766E", "#85C1C3", "#A7D9DB", "#CFE9EA", "#E8F7F8"];

interface DashboardChartsProps {
  monthlyTrend: MonthlyTrendPoint[];
  genreStats: GenreStat[];
  completionByGenre: Record<string, number>;
  dnfByGenre: Record<string, number>;
}

function ChartContainer({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-border rounded-lg p-5 shadow-card">
      <h3 className="font-serif font-semibold text-ink mb-4">{title}</h3>
      {children}
    </div>
  );
}

export function DashboardCharts({ monthlyTrend, genreStats, completionByGenre, dnfByGenre }: DashboardChartsProps) {
  const genreCompletionData = Object.entries(completionByGenre)
    .slice(0, 6)
    .map(([genre, rate]) => ({ genre: genre.split(" ")[0], rate: Math.round(rate * 100) }));

  const totalByGenre = genreStats.slice(0, 6);

  return (
    <div className="grid md:grid-cols-2 gap-5">
      {/* Monthly books trend */}
      <ChartContainer title="Books per month">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={monthlyTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="booksGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0D7377" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#0D7377" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#A8A29E" }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 11, fill: "#A8A29E" }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ border: "1px solid #E5E1D8", borderRadius: 8, fontSize: 12, background: "#fff" }}
              formatter={(v: number) => [v, "Books"]}
              labelFormatter={(l) => `Month: ${l}`}
            />
            <Area type="monotone" dataKey="books" stroke="#0D7377" strokeWidth={2} fill="url(#booksGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Pages per month */}
      <ChartContainer title="Pages per month">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#A8A29E" }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 11, fill: "#A8A29E" }} />
            <Tooltip
              contentStyle={{ border: "1px solid #E5E1D8", borderRadius: 8, fontSize: 12, background: "#fff" }}
              formatter={(v: number) => [v.toLocaleString(), "Pages"]}
            />
            <Bar dataKey="pages" fill="#0D7377" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Genre distribution */}
      <ChartContainer title="Books by genre">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={totalByGenre}
              dataKey="count"
              nameKey="genre"
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={40}
              paddingAngle={3}
            >
              {totalByGenre.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ border: "1px solid #E5E1D8", borderRadius: 8, fontSize: 12, background: "#fff" }}
              formatter={(v: number, _: string, { name }: { name: string }) => [v, name]}
            />
            <Legend
              formatter={(value) => <span style={{ fontSize: 11, color: "#57534E" }}>{value}</span>}
              iconSize={10}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Completion rate by genre */}
      <ChartContainer title="Completion rate by genre">
        {genreCompletionData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={genreCompletionData}
              layout="vertical"
              margin={{ top: 4, right: 24, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#A8A29E" }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="genre" tick={{ fontSize: 11, fill: "#57534E" }} width={80} />
              <Tooltip
                contentStyle={{ border: "1px solid #E5E1D8", borderRadius: 8, fontSize: 12, background: "#fff" }}
                formatter={(v: number) => [`${v}%`, "Completion"]}
              />
              <Bar dataKey="rate" fill="#0D7377" radius={[0, 4, 4, 0]}>
                {genreCompletionData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.rate >= 80 ? "#16A34A" : entry.rate >= 60 ? "#0D7377" : "#D97706"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-32 flex items-center justify-center text-sm text-ink-tertiary">
            Read books across genres to see this chart
          </div>
        )}
      </ChartContainer>
    </div>
  );
}
