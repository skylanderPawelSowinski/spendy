"use client";

import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { useActionForm } from "@/components/forms/use-action-form";
import { createHousehold } from "@/lib/actions/households";

export function NewHouseholdForm() {
  const { formAction, fieldErrors } = useActionForm(createHousehold);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Nazwa" error={fieldErrors.name}>
        {(props) => (
          <Input
            {...props}
            name="name"
            defaultValue="Dom"
            maxLength={60}
            autoFocus
            required
          />
        )}
      </Field>
      <SubmitButton className="w-full" size="lg" pendingLabel="Tworzę…">
        Zaczynamy
      </SubmitButton>
    </form>
  );
}
