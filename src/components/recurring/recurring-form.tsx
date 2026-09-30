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
import {
  createRecurringExpense,
  createRecurringIncome,
  updateRecurringExpense,
  updateRecurringIncome,
} from "@/lib/actions/recurring";
import { currentMonthKey } from "@/lib/month";
import { slotColor } from "@/lib/palette";
import type {
  CategoryRow,
  RecurringIncomeRow,
} from "@/lib/supabase/types";
import type { RecurringExpenseWithCategory } from "@/lib/data";

const NO_CATEGORY = "none";

type Kind = "expense" | "income";

type Props = {
  kind: Kind;
  categories?: CategoryRow[];
  template?: RecurringExpenseWithCategory | RecurringIncomeRow;
  onDone: () => void;
};

export function RecurringForm({ kind, categories = [], template, onDone }: Props) {
  const isEdit = Boolean(template);
  const isExpense = kind === "expense";

  const action = isExpense
    ? isEdit
      ? updateRecurringExpense
      : createRecurringExpense
    : isEdit
      ? updateRecurringIncome
      : createRecurringIncome;

  const { formAction, fieldErrors } = useActionForm(action, {
    onSuccess: onDone,
  });

  const expenseTemplate = isExpense
    ? (template as RecurringExpenseWithCategory | undefined)
    : undefined;

  const [categoryId, setCategoryId] = useState(
    expenseTemplate?.category_id ?? categories[0]?.id ?? NO_CATEGORY,
  );
  const [hasEnd, setHasEnd] = useState(Boolean(template?.end_month));

  const active = categories.filter(
    (c) => !c.archived || c.id === expenseTemplate?.category_id,
  );

  return (
    <form action={formAction} className="space-y-4">
      {template ? <input type="hidden" name="id" value={template.id} /> : null}

      <Field label="Nazwa" error={fieldErrors.name}>
        {(props) => (
          <Input
            {...props}
            name="name"
            maxLength={80}
            autoComplete="off"
            placeholder={isExpense ? "np. Czynsz" : "np. Wypłata"}
            defaultValue={template?.name ?? ""}
            autoFocus={!isEdit}
            required
          />
        )}
      </Field>

      <Field label="Kwota" error={fieldErrors.amount}>
        {(props) => (
          <Input
            {...props}
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0,00"
            defaultValue={template ? String(template.amount) : ""}
            className="h-12 text-xl font-semibold tabular-nums"
            required
          />
        )}
      </Field>

      {isExpense ? (
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
      ) : null}

      <Field
        label="Dzień miesiąca"
        error={fieldErrors.day_of_month}
        hint="W krótszych miesiącach przesuniemy na ostatni dzień."
      >
        {(props) => (
          <Input
            {...props}
            name="day_of_month"
            type="number"
            min={1}
            max={31}
            inputMode="numeric"
            defaultValue={template?.day_of_month ?? 1}
            required
          />
        )}
      </Field>

      <Field label="Od miesiąca" error={fieldErrors.start_month}>
        {(props) => (
          <Input
            {...props}
            name="start_month"
            type="month"
            defaultValue={template?.start_month?.slice(0, 7) ?? currentMonthKey()}
            required
          />
        )}
      </Field>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-primary size-4"
            checked={hasEnd}
            onChange={(event) => setHasEnd(event.target.checked)}
          />
          Ma datę końca
        </label>

        {hasEnd ? (
          <Field label="Do miesiąca (włącznie)" error={fieldErrors.end_month}>
            {(props) => (
              <Input
                {...props}
                name="end_month"
                type="month"
                defaultValue={template?.end_month?.slice(0, 7) ?? ""}
                required
              />
            )}
          </Field>
        ) : (
          <input type="hidden" name="end_month" value="" />
        )}
      </div>

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
