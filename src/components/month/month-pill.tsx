"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  MONTH_NAMES_PL_SHORT,
  currentMonthKey,
  isCurrentMonth,
  monthLabel,
  parseMonthKey,
  toMonthKey,
  yearRange,
  type MonthKey,
} from "@/lib/month";
import { cn } from "cn";

/** Wspólna nawigacja po miesiącach — kompaktowa pigułka z siatką miesięcy. */
export function useMonthNavigation(month: MonthKey) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const today = currentMonthKey();

  function goTo(next: MonthKey) {
    if (next === month) return;
    const params = new URLSearchParams(searchParams.toString());
    if (next === today) params.delete("m");
    else params.set("m", next);
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  return { goTo, isPending, today };
}

export function MonthPill({
  month,
  tone = "light",
  className,
}: {
  month: MonthKey;
  /** `ink` — wariant na ciemnej karcie nagłówka pulpitu. */
  tone?: "light" | "ink";
  className?: string;
}) {
  const { goTo, isPending, today } = useMonthNavigation(month);
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(() => parseMonthKey(month).year);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setYear(parseMonthKey(month).year);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-colors active:scale-[0.97]",
            tone === "ink"
              ? "bg-ink-foreground/12 text-ink-foreground hover:bg-ink-foreground/20"
              : "bg-secondary text-secondary-foreground hover:bg-accent",
            isPending && "animate-pulse opacity-70",
            className,
          )}
        >
          {monthLabel(month)}
          <ChevronDown className="size-3.5 opacity-60" aria-hidden />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-72" align="end">
        <div className="mb-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Poprzedni rok"
            onClick={() => setYear((y) => y - 1)}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <span className="text-sm font-semibold tabular-nums">{year}</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Następny rok"
            onClick={() => setYear((y) => y + 1)}
            disabled={year >= yearRange(month).at(-1)!}
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {MONTH_NAMES_PL_SHORT.map((name, index) => {
            const key = toMonthKey(year, index + 1);
            const selected = key === month;
            return (
              <Button
                key={key}
                variant={selected ? "default" : "ghost"}
                size="sm"
                aria-current={selected ? "true" : undefined}
                className={cn(
                  "capitalize",
                  !selected && key === today && "ring-ring ring-1",
                )}
                onClick={() => {
                  goTo(key);
                  setOpen(false);
                }}
              >
                {name}
              </Button>
            );
          })}
        </div>

        {!isCurrentMonth(month) ? (
          <Button
            variant="link"
            size="sm"
            className="mt-2 h-auto w-full"
            onClick={() => {
              goTo(today);
              setOpen(false);
            }}
          >
            Wróć do bieżącego miesiąca
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
