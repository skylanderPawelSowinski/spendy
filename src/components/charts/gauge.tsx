import type { CSSProperties } from "react";

import { cn } from "cn";

/** Ile koła zajmuje skala — reszta to przerwa u dołu, pod „zero". */
const SWEEP = 0.72;

/**
 * Mały miernik w kształcie niedomkniętego pierścienia — jedna wartość
 * względem swojego maksimum, z miejscem na ikonę w środku.
 *
 * Miernik nigdy nie stoi sam: obok zawsze jest etykieta i kwota, bo łuk
 * pokazuje proporcję, a nie konkretną liczbę.
 */
export function Gauge({
  ratio,
  color,
  size = 56,
  thickness = 5,
  delay = 0,
  className,
  children,
}: {
  /** 0–1; wartości spoza zakresu są przycinane do skali. */
  ratio: number;
  color: string;
  size?: number;
  thickness?: number;
  delay?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const center = size / 2;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const track = SWEEP * circumference;
  const filled = Math.max(Math.min(ratio, 1), 0) * track;

  // Obrót tak, żeby przerwa wypadła symetrycznie na dole.
  const rotation = 90 + ((1 - SWEEP) * 360) / 2;

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full" aria-hidden>
        <g transform={`rotate(${rotation} ${center} ${center})`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--track)"
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={`${track} ${circumference}`}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="round"
            className="arc-in"
            style={
              {
                "--arc-circumference": circumference,
                "--arc-length": filled,
                "--reveal-delay": `${delay}ms`,
              } as CSSProperties
            }
          />
        </g>
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
