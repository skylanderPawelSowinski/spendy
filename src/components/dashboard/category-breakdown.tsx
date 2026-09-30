import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Ring } from "@/components/charts/ring";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { formatMoney, formatPercent } from "@/lib/format";
import { slotColor } from "@/lib/palette";
import { CategoryAvatar } from "@/components/categories/category-avatar";
import { withTail, type CategorySlice } from "@/lib/summary";
import type { MonthKey } from "@/lib/month";

/**
 * Część-do-całości: pierścień z sumą w środku + lista z wartościami.
 *
 * Pierścień pokazuje proporcje, ale nie odczyta się z niego kwoty — dlatego
 * lista pod nim pełni rolę etykiet bezpośrednich. Kolor nigdy nie niesie
 * znaczenia sam: przy każdym wycinku stoi nazwa kategorii i liczba.
 */
export function CategoryBreakdown({
  slices,
  total,
  month,
}: {
  slices: CategorySlice[];
  total: number;
  month: MonthKey;
}) {
  const shown = withTail(slices);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Na co poszły pieniądze</CardTitle>
        <CardDescription>
          {total > 0
            ? `${formatMoney(total)} w ${slices.length} ${
                slices.length === 1 ? "kategorii" : "kategoriach"
              }`
            : "Brak wydatków w tym miesiącu"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {total > 0 ? (
          <>
            <div className="flex justify-center pt-1">
              <Ring
                segments={shown.map((slice) => ({
                  id: slice.id,
                  label: slice.name,
                  value: slice.total,
                  color: slotColor(slice.color),
                }))}
                total={total}
                delay={180}
                label={`Podział wydatków: ${shown
                  .map((s) => `${s.name} ${formatPercent(s.share)}`)
                  .join(", ")}`}
              >
                <span className="text-muted-foreground text-xs">
                  Suma wydatków
                </span>
                <AnimatedNumber
                  value={total}
                  delay={180}
                  className="text-xl font-semibold tracking-tight"
                />
              </Ring>
            </div>

            <ul className="-mx-1 space-y-0.5">
              {shown.map((slice, index) => (
                <li
                  key={slice.id}
                  className="reveal flex items-center gap-3 rounded-2xl px-1 py-1.5"
                  style={
                    { "--reveal-delay": `${320 + index * 60}ms` } as CSSProperties
                  }
                >
                  <CategoryAvatar
                    color={slice.color}
                    icon={slice.icon}
                    size="sm"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {slice.name}
                    </span>
                    <span className="text-muted-foreground block text-xs tabular-nums">
                      {formatPercent(slice.share)}
                    </span>
                  </span>
                  <span className="text-right text-sm font-semibold tabular-nums">
                    {formatMoney(slice.total)}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href={`/wydatki?m=${month}`}
              className="text-muted-foreground hover:text-foreground hover:bg-accent inline-flex items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1 text-sm transition-colors"
            >
              Zobacz wszystkie wydatki
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            Dodaj pierwszy wydatek, żeby zobaczyć podział na kategorie.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
