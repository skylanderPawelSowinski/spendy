"use client";

import Link from "next/link";
import { MailCheck } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { useActionForm } from "@/components/forms/use-action-form";
import { PasswordInput } from "@/components/auth/password-input";
import { signIn, signUp } from "@/lib/actions/auth";
import { ALLOWED_EMAIL_DOMAIN } from "@/lib/auth-config";

const DOMAIN_HINT = `Tylko adresy @${ALLOWED_EMAIL_DOMAIN}`;

export function AuthForms({ next = "/" }: { next?: string }) {
  return (
    <Tabs defaultValue="signin">
      <TabsList className="w-full">
        <TabsTrigger value="signin" className="flex-1">
          Logowanie
        </TabsTrigger>
        <TabsTrigger value="signup" className="flex-1">
          Rejestracja
        </TabsTrigger>
      </TabsList>

      <TabsContent value="signin" className="mt-4">
        <SignInForm next={next} />
      </TabsContent>

      <TabsContent value="signup" className="mt-4">
        <SignUpForm next={next} />
      </TabsContent>
    </Tabs>
  );
}

function SignInForm({ next }: { next: string }) {
  const { formAction, fieldErrors } = useActionForm(signIn);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

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

      <Field label="Hasło" error={fieldErrors.password}>
        {(props) => (
          <PasswordInput
            {...props}
            name="password"
            autoComplete="current-password"
            required
          />
        )}
      </Field>

      <SubmitButton className="w-full" size="lg" pendingLabel="Loguję…">
        Zaloguj się
      </SubmitButton>

      <Link
        href="/auth/reset-hasla"
        className="text-muted-foreground hover:text-foreground block text-center text-sm underline underline-offset-4"
      >
        Nie pamiętam hasła
      </Link>
    </form>
  );
}

function SignUpForm({ next }: { next: string }) {
  const { state, formAction, fieldErrors } = useActionForm(signUp, {
    toastOnSuccess: false,
  });

  // Komunikat z akcji jest neutralny — nie zdradza, czy konto już istniało.
  const message = state.status === "ok" ? state.message : null;

  if (message) {
    return (
      <div className="space-y-4 text-center">
        <div className="bg-secondary mx-auto flex size-11 items-center justify-center rounded-xl">
          <MailCheck className="size-5" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-medium">{message}</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Kliknij w link z wiadomości, żeby aktywować konto. Sprawdź też spam.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <Field label="E-mail" error={fieldErrors.email} hint={DOMAIN_HINT}>
        {(props) => (
          <Input
            {...props}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={`imie.nazwisko@${ALLOWED_EMAIL_DOMAIN}`}
            required
          />
        )}
      </Field>

      <Field
        label="Hasło"
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

      <SubmitButton className="w-full" size="lg" pendingLabel="Zakładam konto…">
        Załóż konto
      </SubmitButton>
    </form>
  );
}
