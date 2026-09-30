"use client";

import { useState } from "react";
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
        <Button
          size="lg"
          onClick={() => setOpen(true)}
          className={cn(
            // Na telefonie siada w wycięciu dolnej nawigacji, na desktopie
            // wraca do prawego dolnego rogu (paska na dole tam nie ma).
            "fixed bottom-5 left-1/2 z-50 size-14 -translate-x-1/2 rounded-full p-0",
            "ring-background shadow-lg ring-4",
            "md:bottom-8 md:left-auto md:right-8 md:translate-x-0 md:ring-0",
            // Wjazd po zamontowaniu + odczuwalna reakcja na dotknięcie:
            // przycisk „siada" pod palcem zamiast tylko zmienić kolor.
            "reveal-pop transition-transform active:scale-90",
          )}
          style={{ "--reveal-delay": "220ms" } as React.CSSProperties}
          aria-label="Dodaj wydatek"
        >
          <Plus className="size-6" aria-hidden />
        </Button>
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
