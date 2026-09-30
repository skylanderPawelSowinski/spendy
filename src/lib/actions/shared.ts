import "server-only";

import { z } from "zod";

export type ActionState =
  | { status: "idle" }
  | { status: "ok"; message?: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

export const IDLE: ActionState = { status: "idle" };

export function ok(message?: string): ActionState {
  return { status: "ok", message };
}

export function fail(
  message: string,
  fieldErrors?: Record<string, string>,
): ActionState {
  return { status: "error", message, fieldErrors };
}

export function fromZod(error: z.ZodError): ActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    fieldErrors[key] ??= issue.message;
  }
  return fail("Popraw zaznaczone pola.", fieldErrors);
}

/** Kwota z inputa: akceptuje "1 234,56", "1234.56", "1234". */
export const amountSchema = z
  .string()
  .trim()
  .min(1, "Podaj kwotę")
  .transform((raw) => raw.replace(/\s/g, "").replace(",", "."))
  .refine((raw) => /^\d+(\.\d{1,2})?$/.test(raw), "Nieprawidłowa kwota")
  .transform(Number)
  .refine((n) => n >= 0, "Kwota nie może być ujemna")
  .refine((n) => n <= 99_999_999, "Kwota jest zbyt duża");

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Nieprawidłowa data");

export const monthKeySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Nieprawidłowy miesiąc");

export const uuidSchema = z.uuid("Nieprawidłowy identyfikator");

export const optionalUuid = z
  .string()
  .transform((v) => (v === "" || v === "none" ? null : v))
  .nullable()
  .refine(
    (v) => v === null || z.uuid().safeParse(v).success,
    "Nieprawidłowy identyfikator",
  );

export const paletteSlotSchema = z.enum([
  "blue",
  "orange",
  "aqua",
  "yellow",
  "magenta",
  "green",
  "violet",
  "red",
  "slate",
]);

/** Zamienia błąd Postgresa/Supabase na komunikat po polsku. */
export function describeDbError(error: {
  code?: string;
  message: string;
}): string {
  if (error.code === "23505") return "Taki wpis już istnieje.";
  if (error.code === "23503") return "Powiązany wpis już nie istnieje.";
  if (error.message.includes("not_a_member"))
    return "Nie masz dostępu do tej przestrzeni.";
  if (error.message.includes("invite_expired"))
    return "To zaproszenie wygasło.";
  if (error.message.includes("invite_revoked"))
    return "To zaproszenie zostało anulowane.";
  if (error.message.includes("invite_not_found"))
    return "Nie znaleziono takiego zaproszenia.";
  return "Coś poszło nie tak. Spróbuj ponownie.";
}
