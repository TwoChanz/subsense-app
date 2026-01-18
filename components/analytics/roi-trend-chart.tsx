"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import type { ROIDataPoint } from "@/lib/analytics"
import { STATUS_COLORS } from "@/lib/analytics"

interface ROITrendChartProps {
  data: ROIDataPoint[]
}

export function ROITrendChart({ data }: ROITrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No ROI trend data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="month"
          className="text-xs"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
          labelStyle={{ color: "hsl(var(--popover-foreground))" }}
          formatter={(value: number, name: string) => {
            const label =
              name === "good"
                ? "Healthy"
                : name === "review"
                  ? "Needs Review"
                  : "Consider Cutting"
            return [value, label]
          }}
        />
        <Legend
          formatter={(value: string) => {
            const label =
              value === "good"
                ? "Healthy"
                : value === "review"
                  ? "Needs Review"
                  : "Consider Cutting"
            return <span className="text-xs text-muted-foreground">{label}</span>
          }}
        />
        <Area
          type="monotone"
          dataKey="good"
          stackId="1"
          stroke={STATUS_COLORS.good}
          fill={STATUS_COLORS.good}
          fillOpacity={0.6}
        />
        <Area
          type="monotone"
          dataKey="review"
          stackId="1"
          stroke={STATUS_COLORS.review}
          fill={STATUS_COLORS.review}
          fillOpacity={0.6}
        />
        <Area
          type="monotone"
          dataKey="cut"
          stackId="1"
          stroke={STATUS_COLORS.cut}
          fill={STATUS_COLORS.cut}
          fillOpacity={0.6}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
