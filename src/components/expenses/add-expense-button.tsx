"use client";

import { useState, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { monthFromParam, type MonthKey } from "@/lib/month";
import type { CategoryRow } from "@/lib/supabase/types";
import { cn } from "cn";

type Props = {
  categories: CategoryRow[];
  /** Domyślnie miesiąc z adresu — dzięki temu FAB działa na każdej stronie. */
  month?: MonthKey;
  /** `fab` — pływający przycisk w wycięciu dolnej nawigacji. */
  variant?: "fab" | "inline";
};

export function AddExpenseButton({
  categories,
  month: monthProp,
  variant = "inline",
}: Props) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const month = monthProp ?? monthFromParam(searchParams.get("m"));

  return (
    <>
      {variant === "fab" ? (
        // Pozycjonowanie i animacja siedzą na opakowaniu, nie na przycisku:
        // `reveal-pop` kończy się na `transform: none` i skasowałoby zarówno
        // wyśrodkowanie, jak i reakcję na dotknięcie.
        <div
          className={cn(
            // Na telefonie siada w wycięciu dolnej nawigacji, na desktopie
            // wraca do prawego dolnego rogu (paska na dole tam nie ma).
            // Środkujemy ujemnym marginesem (połowa z size-14), nie translate.
            "reveal-pop fixed bottom-5 left-1/2 z-50 -ml-7",
            "md:bottom-8 md:right-8 md:left-auto md:ml-0",
          )}
          style={{ "--reveal-delay": "220ms" } as CSSProperties}
        >
          <Button
            size="lg"
            onClick={() => setOpen(true)}
            className="ring-background size-14 rounded-full p-0 shadow-lg ring-4 transition-transform active:scale-90 md:ring-0"
            aria-label="Dodaj wydatek"
          >
            <Plus className="size-6" aria-hidden />
          </Button>
        </div>
      ) : (
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="size-4" aria-hidden />
          Dodaj wydatek
        </Button>
      )}

      <ResponsiveModal
        open={open}
        onOpenChange={setOpen}
        title="Nowy wydatek"
        description="Kwota i kategoria wystarczą — resztę możesz uzupełnić później."
      >
        {open ? (
          <ExpenseForm
            categories={categories}
            month={month}
            onDone={() => setOpen(false)}
          />
        ) : null}
      </ResponsiveModal>
    </>
  );
}
