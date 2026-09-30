import type { CSSProperties } from "react";
import Link from "next/link";
import { Gauge, Receipt, RefreshCw, Tags } from "lucide-react";

import type { MonthKey } from "@/lib/month";

/**
 * Pasek skrótów pod nagłówkiem — cztery miejsca, do których najczęściej idzie
 * się z pulpitu. Przewija się w poziomie, więc na wąskim ekranie nie zjada
 * wysokości, a pigułki są na tyle duże, żeby trafić w nie kciukiem (≥44 px).
 */
export function QuickActions({ month }: { month: MonthKey }) {
  const actions = [
    {
      href: `/wydatki?m=${month}`,
      label: "Wszystkie wydatki",
      icon: Receipt,
      color: "var(--chart-1)",
    },
    {
      href: "/cykliczne",
      label: "Cykliczne",
      icon: RefreshCw,
      color: "var(--chart-3)",
    },
    { href: "/kategorie", label: "Kategorie", icon: Tags, color: "var(--chart-2)" },
    {
      href: "/ustawienia",
      label: "Próg wydatków",
      icon: Gauge,
      color: "var(--chart-7)",
    },
  ];

  return (
    <nav aria-label="Skróty">
      {/*
        Ujemne marginesy wypuszczają pasek poza padding strony, żeby ostatnia
        pigułka „wychodziła za krawędź" — czytelny sygnał, że jest co przewijać.
      */}
      <ul className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {actions.map((action, index) => (
          <li
            key={action.href}
            className="reveal-pop snap-start"
            style={
              { "--reveal-delay": `${120 + index * 60}ms` } as CSSProperties
            }
          >
            <Link
              href={action.href}
              className="bg-card ring-foreground/8 hover:bg-accent flex h-11 items-center gap-2 rounded-full px-3.5 text-sm font-medium whitespace-nowrap shadow-sm ring-1 transition-colors active:scale-[0.97]"
            >
              <span
                className="flex size-7 items-center justify-center rounded-full"
                style={{
                  backgroundColor: `color-mix(in oklab, ${action.color} 14%, transparent)`,
                }}
                aria-hidden
              >
                <action.icon className="size-4" style={{ color: action.color }} />
              </span>
              {action.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
