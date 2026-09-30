"use client";

import { useEffect, useRef, useState } from "react";

import { formatMoney, formatPercent } from "@/lib/format";
import { cn } from "cn";

/**
 * Formatowanie wybieramy nazwą, a nie funkcją w propsie: komponent jest
 * klientowy, a funkcji nie da się przekazać przez granicę serwer → klient.
 */
const FORMATTERS = {
  money: formatMoney,
  percent: formatPercent,
} satisfies Record<string, (value: number) => string>;

export type NumberFormat = keyof typeof FORMATTERS;

/** easeOutExpo — liczba pędzi na starcie i miękko dochodzi do wartości. */
function ease(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Kwota, która „dolicza się" do wartości docelowej.
 *
 * Stan startowy to od razu wartość końcowa — dzięki temu HTML z serwera jest
 * poprawny (i czytelny bez JS), a hydracja nie zgłasza rozjazdu. Animacja
 * rusza dopiero w efekcie, po zamontowaniu.
 *
 * Przy zmianie miesiąca licznik przechodzi z poprzedniej kwoty do nowej,
 * więc widać kierunek zmiany, a nie samo podmienienie liczby.
 */
export function AnimatedNumber({
  value,
  format = "money",
  className,
  duration = 900,
  delay = 0,
}: {
  value: number;
  format?: NumberFormat;
  className?: string;
  duration?: number;
  delay?: number;
}) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(0);

  useEffect(() => {
    const from = previous.current;
    const to = value;
    previous.current = to;

    if (from === to || prefersReducedMotion()) {
      setDisplay(to);
      return;
    }

    let frame = 0;
    let start: number | null = null;

    const step = (now: number) => {
      start ??= now;
      const elapsed = now - start - delay;

      if (elapsed < 0) {
        // Faza oczekiwania: trzymamy wartość startową, żeby licznik ruszył
        // równo z animacją wejścia kafla, a nie przed nią.
        setDisplay(from);
        frame = requestAnimationFrame(step);
        return;
      }

      const t = Math.min(elapsed / duration, 1);
      setDisplay(from + (to - from) * ease(t));
      if (t < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, delay]);

  return (
    <span className={cn("tabular-nums", className)}>
      {FORMATTERS[format](display)}
    </span>
  );
}
