import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { NewPasswordForm } from "@/components/auth/new-password-form";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Nowe hasło" };

export default async function NewPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Tu trafiamy z linku z maila — o ile sesja odzyskiwania faktycznie powstała.
  if (!user) {
    return (
      <AuthShell
        title="Link jest nieaktywny"
        description="Wygasł albo został już użyty."
      >
        <Button asChild className="w-full">
          <Link href="/auth/reset-hasla">Wyślij nowy link</Link>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Ustaw nowe hasło"
      description={`Zmieniasz hasło dla ${user.email}.`}
    >
      <NewPasswordForm />
    </AuthShell>
  );
}
