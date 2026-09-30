"use client";

import { Field } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { useActionForm } from "@/components/forms/use-action-form";
import { PasswordInput } from "@/components/auth/password-input";
import { updatePassword } from "@/lib/actions/auth";

export function NewPasswordForm() {
  const { formAction, fieldErrors } = useActionForm(updatePassword);

  return (
    <form action={formAction} className="space-y-4">
      <Field
        label="Nowe hasło"
        error={fieldErrors.password}
        hint="Co najmniej 8 znaków."
      >
        {(props) => (
          <PasswordInput
            {...props}
            name="password"
            autoComplete="new-password"
            minLength={8}
            autoFocus
            required
          />
        )}
      </Field>

      <Field label="Powtórz hasło" error={fieldErrors.passwordConfirm}>
        {(props) => (
          <PasswordInput
            {...props}
            name="passwordConfirm"
            autoComplete="new-password"
            minLength={8}
            required
          />
        )}
      </Field>

      <SubmitButton className="w-full" size="lg" pendingLabel="Zapisuję…">
        Zapisz hasło
      </SubmitButton>
    </form>
  );
}
