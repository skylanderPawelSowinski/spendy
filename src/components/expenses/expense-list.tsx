"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { deleteExpense } from "@/lib/actions/expenses";
import { formatDayShort, formatMoney } from "@/lib/format";
import { CategoryAvatar } from "@/components/categories/category-avatar";
import type { MonthKey } from "@/lib/month";
import type { CategoryRow } from "@/lib/supabase/types";
import type { ExpenseWithCategory } from "@/lib/data";

type Props = {
  expenses: ExpenseWithCategory[];
  categories: CategoryRow[];
  month: MonthKey;
  /** Wyłącz, gdy lista jest już pogrupowana po dniach — data by się dublowała. */
  showDate?: boolean;
};

export function ExpenseList({
  expenses,
  categories,
  month,
  showDate = true,
}: Props) {
  const [editing, setEditing] = useState<ExpenseWithCategory | null>(null);
  const [deleting, setDeleting] = useState<ExpenseWithCategory | null>(null);

  if (expenses.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        Brak wydatków w tym miesiącu.
      </p>
    );
  }

  return (
    <>
      <ul className="-mx-2">
        {expenses.map((expense) => (
          <li
            key={expense.id}
            className="hover:bg-accent/60 flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors"
          >
            <CategoryAvatar
              color={expense.category?.color}
              icon={expense.category?.icon}
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {expense.description ?? expense.category?.name ?? "Wydatek"}
              </p>
              <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                {showDate ? (
                  <span className="shrink-0">
                    {formatDayShort(expense.spent_on)}
                  </span>
                ) : null}
                {expense.category ? (
                  <>
                    {showDate ? <span aria-hidden>·</span> : null}
                    <span className="truncate">{expense.category.name}</span>
                  </>
                ) : null}
                {expense.recurring_expense_id ? (
                  <>
                    <span aria-hidden>·</span>
                    <RefreshCw className="size-3" aria-hidden />
                    <span className="sr-only">Z wydatku cyklicznego</span>
                  </>
                ) : null}
              </p>
            </div>

            <span className="shrink-0 text-base font-semibold tabular-nums">
              {formatMoney(expense.amount)}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground -mr-1 size-8 shrink-0"
                  aria-label={`Akcje dla wydatku ${formatMoney(expense.amount)}`}
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditing(expense)}>
                  <Pencil className="size-4" aria-hidden />
                  Edytuj
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleting(expense)}
                >
                  <Trash2 className="size-4" aria-hidden />
                  Usuń
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        ))}
      </ul>

      <ResponsiveModal
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Edytuj wydatek"
      >
        {editing ? (
          <ExpenseForm
            key={editing.id}
            categories={categories}
            month={month}
            expense={editing}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </ResponsiveModal>

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Usunąć ten wydatek?"
        description={
          deleting?.recurring_expense_id
            ? "To pozycja z wydatku cyklicznego. Zniknie tylko z tego miesiąca — " +
              "w kolejnych pojawi się dalej."
            : "Tej operacji nie da się cofnąć."
        }
        action={deleteExpense}
        hidden={{ id: deleting?.id ?? "" }}
      />
    </>
  );
}
