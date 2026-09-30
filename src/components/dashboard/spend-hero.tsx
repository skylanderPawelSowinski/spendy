"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  CircleAlert,
  Minus,
  TriangleAlert,
  Wallet,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { MonthPill, useMonthNavigation } from "@/components/month/month-pill";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { formatMoney, formatPercent } from "@/lib/format";
import {
  MONTH_NAMES_PL_SHORT,
  monthLabel,
  monthNameLocative,
  parseMonthKey,
  type MonthKey,
} from "@/lib/month";
import type { SpendingLimit } from "@/lib/spending-limit";
import type { MonthTotal } from "@/lib/data";
import { cn } from "cn";

/**
 * Nagłówek pulpitu: jedna duża liczba, stosunek do progu i sześciomiesięczny
 * kontekst — wszystko na jednej ciemnej płaszczyźnie.
 *
 * Ciemne tło nie jest ozdobnikiem: odcina najważniejszą kartę od reszty
 * jasnego ekranu skuteczniej niż jakikolwiek nagłówek czy ramka, więc oko
 * trafia tam pierwsze bez dodatkowego opisu.
 *
 * Wykres celowo pokazuje jedną serię z wyróżnieniem (bieżący miesiąc
 * w kolorze, reszta wyszarzona) zamiast dwóch serii obok siebie — kiedy liczy
 * się jedna wartość, zestaw kolorów tylko ją zakopuje. Słupki są klikalne,
 * więc pełnią też rolę szybkiej nawigacji po miesiącach.
 */
export function SpendHero({
  month,
  spent,
  totals,
  limit,
}: {
  month: MonthKey;
  spent: number;
  totals: MonthTotal[];
  limit: SpendingLimit;
}) {
  const { goTo, isPending } = useMonthNavigation(month);

  const max = Math.max(...totals.map((t) => t.expenses), 1);
  const index = totals.findIndex((t) => t.month === month);
  const previous = index > 0 ? totals[index - 1] : null;

  const delta =
    previous && previous.expenses > 0
      ? (spent - previous.expenses) / previous.expenses
      : null;

  return (
    <Card className="bg-ink text-ink-foreground">
      <CardContent className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-ink-muted flex items-center gap-2 text-sm">
            <span className="bg-ink-foreground/10 flex size-7 items-center justify-center rounded-full">
              <Wallet className="text-ink-foreground size-3.5" aria-hidden />
            </span>
            Wydatki
          </p>
          <MonthPill month={month} tone="ink" />
        </div>

        <div className="space-y-1">
          <AnimatedNumber
            value={spent}
            delay={120}
            className="block text-[2.75rem] leading-none font-semibold tracking-tight"
          />
          <DeltaLine delta={delta} previousMonth={previous?.month} />
        </div>

        <LimitStrip limit={limit} />

        <div
          className={cn(
            "flex items-end gap-1.5 transition-opacity",
            isPending && "opacity-50",
          )}
          role="group"
          aria-label="Wydatki w ostatnich miesiącach"
        >
          {totals.map((total, barIndex) => {
            const selected = total.month === month;
            const height = Math.max((total.expenses / max) * 100, 2);
            const { month: m } = parseMonthKey(total.month);

            return (
              <button
                key={total.month}
                type="button"
                onClick={() => goTo(total.month)}
                aria-current={selected ? "true" : undefined}
                aria-label={`${monthLabel(total.month)}: ${formatMoney(total.expenses)}`}
                className="group flex flex-1 cursor-pointer flex-col items-center gap-2"
              >
                <span className="flex h-24 w-full items-end">
                  <span
                    className={cn(
                      "grow-y w-full rounded-t-md transition-colors",
                      selected
                        ? "bg-ink-accent"
                        : "bg-ink-track group-hover:bg-ink-foreground/35",
                    )}
                    style={
                      {
                        height: `${height}%`,
                        "--reveal-delay": `${240 + barIndex * 60}ms`,
                      } as CSSProperties
                    }
                  />
                </span>
                <span
                  className={cn(
                    "text-[11px] capitalize",
                    selected
                      ? "text-ink-foreground font-semibold"
                      : "text-ink-muted",
                  )}
                >
                  {MONTH_NAMES_PL_SHORT[m - 1]}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function DeltaLine({
  delta,
  previousMonth,
}: {
  delta: number | null;
  previousMonth: MonthKey | undefined;
}) {
  if (delta === null || !previousMonth) {
    return (
      <p className="text-ink-muted text-sm">Suma wydatków w tym miesiącu</p>
    );
  }

  const percent = new Intl.NumberFormat("pl-PL", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(Math.abs(delta));

  const flat = Math.abs(delta) < 0.005;
  const Icon = flat ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;
  const previousName = monthNameLocative(previousMonth);

  return (
    <p className="text-ink-muted flex items-center gap-1 text-sm">
      <Icon
        className={cn(
          "size-4 shrink-0",
          flat ? "" : delta > 0 ? "text-ink-negative" : "text-ink-accent",
        )}
        aria-hidden
      />
      {flat
        ? `Tyle samo co w ${previousName}`
        : `${percent} ${delta > 0 ? "więcej" : "mniej"} niż w ${previousName}`}
    </p>
  );
}

/**
 * Pasek progu wydatków wewnątrz nagłówka. Stoi tu, a nie w osobnej karcie,
 * bo odnosi się dokładnie do liczby nad nim — rozdzielone, zmuszałyby do
 * zestawiania dwóch kwot wzrokiem.
 */
function LimitStrip({ limit }: { limit: SpendingLimit }) {
  if (limit.state === "off") return null;

  if (limit.state === "no-income") {
    return (
      <p className="text-ink-muted flex items-start gap-2 text-xs">
        <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span>
          Próg to {limit.percent}% przychodów, ale w tym miesiącu nie ma
          jeszcze żadnych wpływów — nie ma od czego go policzyć.{" "}
          <Link
            href="/ustawienia"
            className="hover:text-ink-foreground underline underline-offset-4"
          >
            Zmień próg
          </Link>
        </span>
      </p>
    );
  }

  const { level, ratio, limit: cap, remaining, percent, kind } = limit;

  const tone = {
    ok: {
      Icon: null,
      fill: "bg-ink-accent",
      text: "text-ink-muted",
      label: `Zostało ${formatMoney(remaining)} do progu`,
    },
    warning: {
      Icon: TriangleAlert,
      fill: "bg-ink-warning",
      text: "text-ink-warning",
      label: `Blisko progu — zostało ${formatMoney(remaining)}`,
    },
    over: {
      Icon: CircleAlert,
      fill: "bg-ink-negative",
      text: "text-ink-negative",
      label: `Próg przekroczony o ${formatMoney(Math.abs(remaining))}`,
    },
  }[level];

  const basis =
    kind === "percent"
      ? `${percent}% przychodów = ${formatMoney(cap)}`
      : formatMoney(cap);

  return (
    <div className="space-y-2">
      <div
        className="bg-ink-track h-2.5 w-full overflow-hidden rounded-full"
        role="meter"
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Wykorzystanie progu wydatków: ${formatPercent(ratio)} z ${basis}`}
      >
        <div
          className={cn("grow-x h-full rounded-full", tone.fill)}
          style={
            {
              width: `${Math.min(ratio, 1) * 100}%`,
              "--reveal-delay": "200ms",
            } as CSSProperties
          }
        />
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <p className={cn("flex items-center gap-1.5 text-xs", tone.text)}>
          {tone.Icon ? (
            <tone.Icon className="size-3.5 shrink-0" aria-hidden />
          ) : null}
          {tone.label}
        </p>
        <p className="text-sm font-semibold tabular-nums">
          {formatPercent(ratio)}
        </p>
      </div>

      <p className="text-ink-muted text-xs">
        Próg miesięczny: {basis}.{" "}
        <Link
          href="/ustawienia"
          className="hover:text-ink-foreground underline underline-offset-4"
        >
          Zmień
        </Link>
      </p>
    </div>
  );
}
