import { ArrowDownLeft, ArrowUpRight, PiggyBank } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Gauge } from "@/components/charts/gauge";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { formatPercent } from "@/lib/format";
import { cn } from "cn";

/**
 * Trzy liczby miesiąca w jednym rzędzie: wpłynęło, wypłynęło, zostało.
 *
 * Łuk przy każdej z nich pokazuje proporcję do największej z trzech wartości,
 * więc różnica między przychodem a wydatkiem jest widoczna, zanim ktokolwiek
 * przeczyta kwoty. Sam łuk nigdy nie jest jedynym nośnikiem: obok stoi
 * podpis i pełna liczba.
 */
export function StatRow({
  totalIncomes,
  totalExpenses,
  balance,
  savingsRate,
}: {
  totalIncomes: number;
  totalExpenses: number;
  balance: number;
  savingsRate: number | null;
}) {
  const scale = Math.max(totalIncomes, totalExpenses, 1);
  const positive = balance >= 0;

  const tiles = [
    {
      key: "incomes",
      label: "Przychody",
      value: totalIncomes,
      ratio: totalIncomes / scale,
      color: "var(--chart-3)",
      Icon: ArrowDownLeft,
      hint: null,
    },
    {
      key: "expenses",
      label: "Wydatki",
      value: totalExpenses,
      ratio: totalExpenses / scale,
      color: "var(--chart-1)",
      Icon: ArrowUpRight,
      hint: null,
    },
    {
      key: "balance",
      label: positive ? "Zostało" : "Na minusie",
      value: balance,
      ratio: totalIncomes > 0 ? Math.abs(balance) / totalIncomes : 0,
      color: positive ? "var(--positive)" : "var(--negative)",
      Icon: PiggyBank,
      hint:
        savingsRate !== null
          ? `${formatPercent(Math.abs(savingsRate))} przychodów`
          : null,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {tiles.map((tile, index) => (
        <Card key={tile.key}>
          <CardContent className="flex flex-col items-center gap-2 px-2 text-center">
            <Gauge
              ratio={tile.ratio}
              color={tile.color}
              delay={260 + index * 110}
            >
              <tile.Icon
                className="size-4"
                style={{ color: tile.color }}
                aria-hidden
              />
            </Gauge>

            <div className="min-w-0 space-y-0.5">
              <p className="text-muted-foreground text-xs">{tile.label}</p>
              <AnimatedNumber
                value={tile.value}
                delay={260 + index * 110}
                className={cn(
                  "block text-sm font-semibold",
                  tile.key === "balance" &&
                    (positive ? "text-positive" : "text-negative"),
                )}
              />
              {tile.hint ? (
                <p className="text-muted-foreground text-[11px]">{tile.hint}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
