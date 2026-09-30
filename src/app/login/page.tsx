import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForms } from "@/components/auth/auth-forms";

export const metadata = { title: "Logowanie" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const rawNext = typeof params.next === "string" ? params.next : "/";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <AuthShell
      title="Zaloguj się"
      description="Adresem e-mail i hasłem."
      footer={
        <p className="text-muted-foreground text-center text-xs">
          Logując się, zgadzasz się na przechowywanie Twoich danych budżetowych
          w tej aplikacji.
        </p>
      }
    >
      {error ? (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive mb-4 rounded-md border px-3 py-2 text-sm"
        >
          {error}
        </p>
      ) : null}

      <AuthForms next={next} />
    </AuthShell>
  );
}
