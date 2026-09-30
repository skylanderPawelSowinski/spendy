"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatAxisAmount, formatMoney } from "@/lib/format";

const config = {
  total: { label: "Wydano narastająco", color: "var(--chart-1)" },
} satisfies ChartConfig;

/**
 * Tempo wydawania w miesiącu. Jedna seria — bez legendy, tytuł ją nazywa.
 * `budget` rysuje poziomą kreskę przychodów, żeby było widać, gdzie jest sufit.
 */
export function PaceChart({
  data,
  budget,
}: {
  data: { day: number; total: number | null }[];
  budget: number | null;
}) {
  return (
    <ChartContainer config={config} className="h-48 w-full">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="pace-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-total)" stopOpacity={0.24} />
            <stop offset="100%" stopColor="var(--color-total)" stopOpacity={0.02} />
          </linearGradient>
        </defs>

        <CartesianGrid vertical={false} stroke="var(--grid)" />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={58}
          tickFormatter={(value: number) => formatAxisAmount(value)}
        />

        {budget && budget > 0 ? (
          <ReferenceLine
            y={budget}
            stroke="var(--axis)"
            strokeDasharray="4 4"
            label={{
              value: "przychody",
              position: "insideTopRight",
              fill: "var(--muted-foreground)",
              fontSize: 11,
            }}
          />
        ) : null}

        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value) => `Dzień ${value}`}
              formatter={(value) => (
                <span className="font-medium tabular-nums">
                  {formatMoney(value as number)}
                </span>
              )}
            />
          }
        />

        <Area
          type="monotone"
          dataKey="total"
          stroke="var(--color-total)"
          strokeWidth={2}
          fill="url(#pace-fill)"
          connectNulls={false}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
