import type { CSSProperties } from "react";

import { cn } from "cn";

/**
 * Opakowanie wejścia treści. Serwerowe — nie kosztuje ani bajta JS, bo cała
 * animacja siedzi w klasie `reveal` z globals.css.
 *
 * `delay` buduje rytm: kolejne sekcje wchodzą po sobie, więc widać, że ekran
 * się składa, zamiast pojawiać się naraz w komplecie.
 */
export function Reveal({
  delay = 0,
  variant = "rise",
  className,
  style,
  children,
}: {
  /** Opóźnienie w ms — zwykle `index * STAGGER`. */
  delay?: number;
  /** `pop` dla małych kafli, które lepiej wyglądają w skali niż w ruchu. */
  variant?: "rise" | "pop";
  className?: string;
  style?: CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(variant === "pop" ? "reveal-pop" : "reveal", className)}
      style={{ "--reveal-delay": `${delay}ms`, ...style } as CSSProperties}
    >
      {children}
    </div>
  );
}

/** Wspólny krok stopniowania — trzymamy jeden, żeby rytm był ten sam wszędzie. */
export const STAGGER = 70;
