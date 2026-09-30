"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { slotColor } from "@/lib/palette";
import type { CategoryRow } from "@/lib/supabase/types";
import { cn } from "cn";

type Props = {
  categories: CategoryRow[];
  /** Liczba wydatków w każdej kategorii — pozycje puste chowamy. */
  counts: Record<string, number>;
  active: string | null;
};

export function CategoryFilter({ categories, counts, active }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const visible = categories.filter((c) => (counts[c.id] ?? 0) > 0);
  if (visible.length < 2) return null;

  function select(id: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("k", id);
    else params.delete("k");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-2 pb-2">
        <Chip selected={active === null} onClick={() => select(null)}>
          Wszystkie
        </Chip>
        {visible.map((category) => (
          <Chip
            key={category.id}
            selected={active === category.id}
            onClick={() => select(category.id)}
            color={category.color}
          >
            {category.name}
          </Chip>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

function Chip({
  selected,
  onClick,
  color,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
        selected
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card hover:bg-accent",
      )}
    >
      {color ? (
        <span
          aria-hidden
          className="size-2 rounded-[2px]"
          style={{ backgroundColor: slotColor(color) }}
        />
      ) : null}
      {children}
    </button>
  );
}
