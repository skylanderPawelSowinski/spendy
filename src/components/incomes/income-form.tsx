"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { useActionForm } from "@/components/forms/use-action-form";
import { createIncome, updateIncome } from "@/lib/actions/incomes";
import { monthStart, type MonthKey } from "@/lib/month";
import type { IncomeRow } from "@/lib/supabase/types";

function defaultDate(month: MonthKey) {
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate(),
  ).padStart(2, "0")}`;
  return iso.startsWith(month) ? iso : monthStart(month);
}

export function IncomeForm({
  month,
  income,
  onDone,
}: {
  month: MonthKey;
  income?: IncomeRow;
  onDone: () => void;
}) {
  const isEdit = Boolean(income);
  const { formAction, fieldErrors } = useActionForm(
    isEdit ? updateIncome : createIncome,
    { onSuccess: onDone },
  );

  return (
    <form action={formAction} className="space-y-4">
      {income ? <input type="hidden" name="id" value={income.id} /> : null}

      <Field label="Kwota" error={fieldErrors.amount}>
        {(props) => (
          <Input
            {...props}
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0,00"
            defaultValue={income ? String(income.amount) : ""}
            className="h-12 text-xl font-semibold tabular-nums"
            autoFocus={!isEdit}
            required
          />
        )}
      </Field>

      <Field label="Data" error={fieldErrors.received_on}>
        {(props) => (
          <Input
            {...props}
            name="received_on"
            type="date"
            defaultValue={income?.received_on ?? defaultDate(month)}
            required
          />
        )}
      </Field>

      <Field
        label="Opis"
        error={fieldErrors.description}
        hint="Np. premia, zwrot podatku, sprzedaż roweru."
      >
        {(props) => (
          <Input
            {...props}
            name="description"
            maxLength={200}
            autoComplete="off"
            placeholder="np. Premia kwartalna"
            defaultValue={income?.description ?? ""}
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
