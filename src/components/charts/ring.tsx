import type { CSSProperties } from "react";

import { cn } from "cn";

export type RingSegment = {
  id: string;
  label: string;
  value: number;
  color: string;
};

/**
 * Pierścień część-do-całości z sumą w środku.
 *
 * Wycinki mają zaokrąglone końce i przerwy między sobą — dzięki temu
 * sąsiadujące kategorie są rozróżnialne także wtedy, gdy kolory wypadną
 * podobnie (np. w daltonizmie), bo granicę niesie kształt, nie tylko odcień.
 *
 * Komponent jest serwerowy: rysowanie łuku to animacja CSS (`arc-in`) na
 * `stroke-dasharray`, więc nie potrzeba tu ani grama JS.
 */
export function Ring({
  segments,
  total,
  size = 208,
  thickness = 20,
  stagger = 90,
  delay = 0,
  label,
  className,
  children,
}: {
  segments: RingSegment[];
  /** Mianownik udziałów. Zwykle suma `value`, ale bywa podany z zewnątrz. */
  total: number;
  size?: number;
  thickness?: number;
  /** Odstęp w ms między rysowaniem kolejnych wycinków. */
  stagger?: number;
  delay?: number;
  /** Opis dla czytnika ekranu — pierścień jest obrazem, nie listą. */
  label: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const center = size / 2;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  // Przy jednym wycinku przerwa robiłaby przypadkowe wcięcie w pełnym kole.
  const single = segments.length <= 1;
  const gap = single ? 0 : thickness * 1.1;

  let cursor = 0;
  const arcs = segments.map((segment, index) => {
    const share = total > 0 ? segment.value / total : 0;
    const span = share * circumference;
    const start = cursor;
    cursor += span;

    return {
      ...segment,
      index,
      offset: start + gap / 2,
      length: Math.max(span - gap, 0.01),
    };
  });

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="size-full"
        role="img"
        aria-label={label}
      >
        {/* Obrót o -90°: wycinki startują od godziny 12, a nie od 3. */}
        <g transform={`rotate(-90 ${center} ${center})`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--track)"
            strokeWidth={thickness}
          />

          {arcs.map((arc) => (
            <circle
              key={arc.id}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={thickness}
              strokeLinecap={single ? "butt" : "round"}
              strokeDashoffset={-arc.offset}
              className="arc-in"
              style={
                {
                  "--arc-circumference": circumference,
                  "--arc-length": arc.length,
                  "--reveal-delay": `${delay + arc.index * stagger}ms`,
                } as CSSProperties
              }
            />
          ))}
        </g>
      </svg>

      {children ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {children}
        </div>
      ) : null}
    </div>
  );
}
