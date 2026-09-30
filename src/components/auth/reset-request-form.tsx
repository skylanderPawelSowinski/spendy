"use client";

import Link from "next/link";
import { MailCheck } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { useActionForm } from "@/components/forms/use-action-form";
import { requestPasswordReset } from "@/lib/actions/auth";
import { ALLOWED_EMAIL_DOMAIN } from "@/lib/auth-config";

export function ResetRequestForm() {
  const { state, formAction, fieldErrors } = useActionForm(
    requestPasswordReset,
    { toastOnSuccess: false },
  );

  if (state.status === "ok") {
    return (
      <div className="space-y-4 text-center">
        <div className="bg-secondary mx-auto flex size-11 items-center justify-center rounded-xl">
          <MailCheck className="size-5" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-medium">{state.message}</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Link jest ważny przez godzinę. Sprawdź też spam.
          </p>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Wróć do logowania</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <Field label="E-mail" error={fieldErrors.email}>
        {(props) => (
          <Input
            {...props}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={`imie.nazwisko@${ALLOWED_EMAIL_DOMAIN}`}
            autoFocus
            required
          />
        )}
      </Field>

      <SubmitButton className="w-full" size="lg" pendingLabel="Wysyłam…">
        Wyślij link
      </SubmitButton>

      <Button asChild variant="ghost" className="w-full">
        <Link href="/login">Wróć do logowania</Link>
      </Button>
    </form>
  );
}
