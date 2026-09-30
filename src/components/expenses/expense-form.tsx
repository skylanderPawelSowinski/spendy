"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { useActionForm } from "@/components/forms/use-action-form";
import { createExpense, updateExpense } from "@/lib/actions/expenses";
import { monthEnd, monthStart, type MonthKey } from "@/lib/month";
import { slotColor } from "@/lib/palette";
import type { CategoryRow } from "@/lib/supabase/types";
import type { ExpenseWithCategory } from "@/lib/data";

const NO_CATEGORY = "none";

type Props = {
  categories: CategoryRow[];
  month: MonthKey;
  expense?: ExpenseWithCategory;
  onDone: () => void;
};

/** Domyślna data: dziś, jeśli mieścimy się w oglądanym miesiącu; inaczej 1. dnia. */
function defaultDate(month: MonthKey) {
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate(),
  ).padStart(2, "0")}`;
  return iso.startsWith(month) ? iso : monthStart(month);
}

export function ExpenseForm({ categories, month, expense, onDone }: Props) {
  const isEdit = Boolean(expense);
  const { formAction, fieldErrors } = useActionForm(
    isEdit ? updateExpense : createExpense,
    { onSuccess: onDone },
  );

  const [categoryId, setCategoryId] = useState(
    expense?.category_id ?? categories[0]?.id ?? NO_CATEGORY,
  );

  const active = categories.filter(
    (c) => !c.archived || c.id === expense?.category_id,
  );

  return (
    <form action={formAction} className="space-y-4">
      {expense ? <input type="hidden" name="id" value={expense.id} /> : null}

      <Field label="Kwota" error={fieldErrors.amount}>
        {(props) => (
          <Input
            {...props}
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0,00"
            defaultValue={expense ? String(expense.amount) : ""}
            className="h-12 text-xl font-semibold tabular-nums"
            autoFocus={!isEdit}
            required
          />
        )}
      </Field>

      <Field label="Kategoria" error={fieldErrors.category_id}>
        {(props) => (
          <>
            <input type="hidden" name="category_id" value={categoryId} />
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id={props.id} className="w-full">
                <SelectValue placeholder="Wybierz kategorię" />
              </SelectTrigger>
              <SelectContent>
                {active.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <span
                      aria-hidden
                      className="size-2.5 rounded-[3px]"
                      style={{ backgroundColor: slotColor(category.color) }}
                    />
                    {category.name}
                  </SelectItem>
                ))}
                <SelectItem value={NO_CATEGORY}>Bez kategorii</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
      </Field>

      <Field label="Data" error={fieldErrors.spent_on}>
        {(props) => (
          <Input
            {...props}
            name="spent_on"
            type="date"
            defaultValue={expense?.spent_on ?? defaultDate(month)}
            min={monthStart("2000-01")}
            max={monthEnd("2100-12")}
            required
          />
        )}
      </Field>

      <Field
        label="Opis"
        error={fieldErrors.description}
        hint="Opcjonalnie — np. gdzie albo na co."
      >
        {(props) => (
          <Input
            {...props}
            name="description"
            maxLength={200}
            autoComplete="off"
            placeholder="np. Biedronka"
            defaultValue={expense?.description ?? ""}
          />
        )}
      </Field>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onDone}
        >
          Anuluj
        </Button>
        <SubmitButton className="flex-1" pendingLabel="Zapisuję…">
          {isEdit ? "Zapisz" : "Dodaj"}
        </SubmitButton>
      </div>
    </form>
  );
}
