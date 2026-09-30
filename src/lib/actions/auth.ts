"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import { ALLOWED_EMAIL_DOMAIN } from "@/lib/auth-config";
import { fail, fromZod, ok, type ActionState } from "@/lib/actions/shared";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Podaj poprawny adres e-mail"))
  .refine(
    (value) => value.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`),
    `Na razie wpuszczamy tylko adresy @${ALLOWED_EMAIL_DOMAIN}`,
  );

const passwordSchema = z
  .string()
  .min(8, "Hasło musi mieć co najmniej 8 znaków")
  .max(72, "Hasło może mieć maksymalnie 72 znaki");

/** Supabase mówi po angielsku — tłumaczymy to, co użytkownik faktycznie zobaczy. */
function describeAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Nieprawidłowy e-mail lub hasło.";
  if (m.includes("email not confirmed"))
    return "Najpierw potwierdź adres e-mail — sprawdź skrzynkę.";
  if (m.includes("email_domain_not_allowed") || m.includes("database error"))
    return `Na razie wpuszczamy tylko adresy @${ALLOWED_EMAIL_DOMAIN}.`;
  if (m.includes("user already registered"))
    return "Konto z tym adresem już istnieje.";
  if (m.includes("for security purposes") || m.includes("rate limit") || m.includes("too many"))
    return "Za dużo prób. Odczekaj chwilę i spróbuj ponownie.";
  if (m.includes("password") && m.includes("should be"))
    return "Hasło jest za słabe — użyj co najmniej 8 znaków.";
  if (m.includes("same password"))
    return "Nowe hasło musi różnić się od poprzedniego.";
  if (m.includes("expired") || m.includes("invalid") || m.includes("token"))
    return "Link wygasł albo został już użyty. Poproś o nowy.";
  return "Nie udało się. Spróbuj ponownie.";
}

function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "/";
  // Tylko ścieżki względne — inaczej mamy open redirect.
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function signIn(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({ email: emailSchema, password: z.string().min(1, "Podaj hasło") })
    .safeParse({
      email: formData.get("email") ?? "",
      password: formData.get("password") ?? "",
    });
  if (!parsed.success) return fromZod(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) return fail(describeAuthError(error.message));

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

export async function signUp(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({
      email: emailSchema,
      password: passwordSchema,
      passwordConfirm: z.string(),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: "Hasła nie są takie same",
      path: ["passwordConfirm"],
    })
    .safeParse({
      email: formData.get("email") ?? "",
      password: formData.get("password") ?? "",
      passwordConfirm: formData.get("passwordConfirm") ?? "",
    });
  if (!parsed.success) return fromZod(parsed.error);

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();
  const next = safeNext(formData.get("next"));

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) return fail(describeAuthError(error.message));

  // Supabase nie zdradza, czy konto już istnieje (ochrona przed enumeracją) —
  // sygnałem jest pusta lista tożsamości. Komunikat trzymamy neutralny.
  const alreadyRegistered = data.user?.identities?.length === 0;

  return ok(
    alreadyRegistered
      ? "Jeśli ten adres nie miał jeszcze konta, wysłaliśmy link aktywacyjny."
      : "Wysłaliśmy link aktywacyjny — sprawdź skrzynkę.",
  );
}

export async function requestPasswordReset(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({ email: emailSchema })
    .safeParse({ email: formData.get("email") ?? "" });
  if (!parsed.success) return fromZod(parsed.error);

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent("/auth/nowe-haslo")}`,
    },
  );

  // Nie zdradzamy, czy konto istnieje — komunikat jest ten sam w obie strony.
  if (error && !error.message.toLowerCase().includes("user not found")) {
    return fail(describeAuthError(error.message));
  }

  return ok("Jeśli konto istnieje, wysłaliśmy link do ustawienia hasła.");
}

/** Zmiana hasła przez zalogowaną osobę — z potwierdzeniem obecnego hasła. */
export async function changePassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({
      currentPassword: z.string().min(1, "Podaj obecne hasło"),
      password: passwordSchema,
      passwordConfirm: z.string(),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: "Hasła nie są takie same",
      path: ["passwordConfirm"],
    })
    .refine((data) => data.password !== data.currentPassword, {
      message: "Nowe hasło musi różnić się od obecnego",
      path: ["password"],
    })
    .safeParse({
      currentPassword: formData.get("currentPassword") ?? "",
      password: formData.get("password") ?? "",
      passwordConfirm: formData.get("passwordConfirm") ?? "",
    });
  if (!parsed.success) return fromZod(parsed.error);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return fail("Musisz być zalogowany.");

  // Supabase nie wymaga obecnego hasła przy zmianie — sprawdzamy je sami,
  // żeby przejęta sesja nie wystarczyła do zablokowania konta właścicielowi.
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });

  if (reauthError)
    return fail("Obecne hasło jest nieprawidłowe.", {
      currentPassword: "Nieprawidłowe hasło",
    });

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) return fail(describeAuthError(error.message));

  revalidatePath("/", "layout");
  return ok("Hasło zmienione");
}

export async function updatePassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({ password: passwordSchema, passwordConfirm: z.string() })
    .refine((data) => data.password === data.passwordConfirm, {
      message: "Hasła nie są takie same",
      path: ["passwordConfirm"],
    })
    .safeParse({
      password: formData.get("password") ?? "",
      passwordConfirm: formData.get("passwordConfirm") ?? "",
    });
  if (!parsed.success) return fromZod(parsed.error);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return fail("Link wygasł albo został już użyty. Poproś o nowy.");

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) return fail(describeAuthError(error.message));

  revalidatePath("/", "layout");
  redirect("/");
}
