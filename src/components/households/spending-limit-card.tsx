"use client";

import { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { useActionForm } from "@/components/forms/use-action-form";
import { setSpendingLimit } from "@/lib/actions/households";
import type { SpendingLimitKind } from "@/lib/supabase/types";
import { cn } from "cn";

const OPTIONS: {
  value: SpendingLimitKind;
  label: string;
  description: string;
}[] = [
  {
    value: "none",
    label: "Bez progu",
    description: "Nie pilnujemy limitu wydatków.",
  },
  {
    value: "amount",
    label: "Kwota",
    description: "Stały limit na miesiąc, np. 5000 zł.",
  },
  {
    value: "percent",
    label: "Procent przychodów",
    description: "Limit liczony od wpływów danego miesiąca, np. 80%.",
  },
];

export function SpendingLimitCard({
  kind,
  value,
}: {
  kind: SpendingLimitKind;
  value: number | null;
}) {
  const [selected, setSelected] = useState<SpendingLimitKind>(kind);
  const { formAction, fieldErrors } = useActionForm(setSpendingLimit);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Próg wydatków</CardTitle>
        <CardDescription>
          Na pulpicie zobaczysz, ile z progu już poszło. To tylko ostrzeżenie —
          nic nie blokujemy.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="max-w-sm space-y-4">
          <input type="hidden" name="kind" value={selected} />

          <div
            role="radiogroup"
            aria-label="Rodzaj progu"
            className="space-y-2"
          >
            {OPTIONS.map((option) => {
              const active = selected === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSelected(option.value)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                    active
                      ? "border-primary bg-accent"
                      : "hover:bg-accent/50",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                      active ? "border-primary" : "border-input",
                    )}
                  >
                    {active ? (
                      <span className="bg-primary size-2 rounded-full" />
                    ) : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">
                      {option.label}
                    </span>
                    <span className="text-muted-foreground block text-xs">
                      {option.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {selected === "none" ? (
            <input type="hidden" name="value" value="" />
          ) : (
            <Field
              label={selected === "percent" ? "Procent przychodów" : "Kwota"}
              error={fieldErrors.value}
            >
              {(props) => (
                <div className="flex items-center gap-2">
                  <Input
                    {...props}
                    name="value"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder={selected === "percent" ? "80" : "5000"}
                    defaultValue={kind === selected ? (value ?? "") : ""}
                    className="tabular-nums"
                    required
                  />
                  <Label
                    htmlFor={props.id}
                    className="text-muted-foreground shrink-0"
                  >
                    {selected === "percent" ? "%" : "zł"}
                  </Label>
                </div>
              )}
            </Field>
          )}

          <SubmitButton variant="outline" pendingLabel="Zapisuję…">
            Zapisz próg
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
