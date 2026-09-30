"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS, isActivePath } from "@/components/app-shell/nav-items";
import { cn } from "cn";

/**
 * Dolna nawigacja z wyciętym miejscem na środku — tam siada pływający
 * przycisk dodawania wydatku (AddExpenseButton, wariant "fab").
 */
export function BottomNav() {
  const pathname = usePathname();
  const [left, right] = [NAV_ITEMS.slice(0, 2), NAV_ITEMS.slice(2)];

  return (
    <nav
      aria-label="Nawigacja główna"
      className="bg-card/90 pb-safe fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-lg md:hidden"
    >
      <ul className="mx-auto flex max-w-2xl items-stretch">
        {left.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        {/* miejsce na FAB */}
        <li aria-hidden className="w-18 shrink-0" />

        {right.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </ul>
    </nav>
  );
}

function NavLink({
  item,
  pathname,
}: {
  item: (typeof NAV_ITEMS)[number];
  pathname: string;
}) {
  const active = isActivePath(item.href, pathname);

  return (
    <li className="flex-1">
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium transition-colors",
          active
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {/*
          Aktywna pozycja dostaje pigułkę pod ikoną — samo pogrubienie kreski
          ginie na małym ekranie, a tło widać kątem oka.
        */}
        <span
          className={cn(
            "relative flex h-7 w-11 items-center justify-center rounded-full transition-colors",
            active ? "bg-secondary" : "bg-transparent",
          )}
        >
          <item.icon
            className={cn("size-5", active && "stroke-[2.25]")}
            aria-hidden
          />
          <NavPending />
        </span>
        {item.shortLabel}
      </Link>
    </li>
  );
}

/**
 * Potwierdzenie kliknięcia, gdy przejście nie jest natychmiastowe (strona
 * dynamiczna, prefetch jeszcze w locie). Element istnieje zawsze i ma stały
 * rozmiar — zmienia się tylko przezroczystość, więc nic nie przeskakuje.
 *
 * Animacja startuje z opóźnieniem 120 ms: przy szybkiej nawigacji użytkownik
 * nie zobaczy mignięcia, bo wskaźnik nie zdąży się pojawić.
 */
function NavPending() {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden
      className={cn(
        "border-foreground/25 border-t-foreground pointer-events-none absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 opacity-0 transition-opacity delay-[120ms] duration-150",
        pending && "animate-spin opacity-100",
      )}
    />
  );
}
