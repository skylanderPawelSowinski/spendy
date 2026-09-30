"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { useActionForm } from "@/components/forms/use-action-form";
import { PasswordInput } from "@/components/auth/password-input";
import { changePassword } from "@/lib/actions/auth";

export function ChangePasswordCard({ email }: { email: string | null }) {
  const { formAction, fieldErrors } = useActionForm(changePassword);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hasło</CardTitle>
        <CardDescription>
          {email ? `Konto ${email}.` : "Zmiana hasła do konta."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="max-w-sm space-y-4">
          <Field label="Obecne hasło" error={fieldErrors.currentPassword}>
            {(props) => (
              <PasswordInput
                {...props}
                name="currentPassword"
                autoComplete="current-password"
                required
              />
            )}
          </Field>

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
                required
              />
            )}
          </Field>

          <Field label="Powtórz nowe hasło" error={fieldErrors.passwordConfirm}>
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

          <SubmitButton variant="outline" pendingLabel="Zapisuję…">
            Zmień hasło
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
