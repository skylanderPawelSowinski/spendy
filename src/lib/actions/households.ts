"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getSessionContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { ALLOWED_EMAIL_DOMAIN } from "@/lib/auth-config";
import {
  describeDbError,
  fail,
  fromZod,
  ok,
  uuidSchema,
  type ActionState,
} from "@/lib/actions/shared";

const nameSchema = z
  .string()
  .trim()
  .min(1, "Podaj nazwę")
  .max(60, "Nazwa może mieć maksymalnie 60 znaków");

function refresh() {
  revalidatePath("/", "layout");
}

export async function createHousehold(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({ name: nameSchema })
    .safeParse({ name: formData.get("name") ?? "" });
  if (!parsed.success) return fromZod(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_household", {
    p_name: parsed.data.name,
  });

  if (error) return fail(describeDbError(error));
  refresh();
  redirect("/");
}

export async function renameHousehold(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({ id: uuidSchema, name: nameSchema })
    .safeParse({ id: formData.get("id") ?? "", name: formData.get("name") ?? "" });
  if (!parsed.success) return fromZod(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("households")
    .update({ name: parsed.data.name })
    .eq("id", parsed.data.id);

  if (error) return fail(describeDbError(error));
  refresh();
  return ok("Zmieniono nazwę");
}

/** Przełącza aktywną przestrzeń (zapisujemy na profilu, nie w ciasteczku). */
export async function switchHousehold(formData: FormData) {
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return;

  const { userId } = await getSessionContext();
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ active_household_id: id.data })
    .eq("id", userId);

  refresh();
  redirect("/");
}

export async function leaveHousehold(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return fail("Nie znaleziono przestrzeni.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("leave_household", {
    p_household_id: id.data,
  });

  if (error) return fail(describeDbError(error));
  refresh();
  redirect("/");
}

export async function setSpendingLimit(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const kind = formData.get("kind");
  const rawValue = String(formData.get("value") ?? "")
    .replace(/\s/g, "")
    .replace(",", ".");

  if (kind === "none") {
    const { household } = await getSessionContext();
    const supabase = await createClient();
    const { error } = await supabase
      .from("households")
      .update({ spending_limit_kind: "none", spending_limit_value: null })
      .eq("id", household.id);

    if (error) return fail(describeDbError(error));
    refresh();
    return ok("Próg wyłączony");
  }

  const parsed = z
    .object({
      kind: z.enum(["amount", "percent"]),
      value: z
        .string()
        .min(1, "Podaj wartość")
        .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), "Nieprawidłowa wartość")
        .transform(Number)
        .refine((v) => v > 0, "Wartość musi być większa od zera"),
    })
    .refine(
      (data) => data.kind !== "percent" || data.value <= 100,
      { message: "Procent nie może przekraczać 100", path: ["value"] },
    )
    .refine(
      (data) => data.kind !== "amount" || data.value <= 99_999_999,
      { message: "Kwota jest zbyt duża", path: ["value"] },
    )
    .safeParse({ kind, value: rawValue });

  if (!parsed.success) return fromZod(parsed.error);

  const { household } = await getSessionContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("households")
    .update({
      spending_limit_kind: parsed.data.kind,
      spending_limit_value: parsed.data.value,
    })
    .eq("id", household.id);

  if (error) return fail(describeDbError(error));
  refresh();
  return ok("Próg zapisany");
}

export async function createInvite(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({
      email: z
        .string()
        .trim()
        .toLowerCase()
        .transform((v) => v || null)
        .nullable()
        .refine(
          (v) => v === null || z.email().safeParse(v).success,
          "Nieprawidłowy adres e-mail",
        )
        .refine(
          (v) => v === null || v.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`),
          `Na razie wpuszczamy tylko adresy @${ALLOWED_EMAIL_DOMAIN}`,
        ),
    })
    .safeParse({ email: formData.get("email") ?? "" });
  if (!parsed.success) return fromZod(parsed.error);

  const { household, userId } = await getSessionContext();
  const supabase = await createClient();

  const { error } = await supabase.from("household_invites").insert({
    household_id: household.id,
    invited_by: userId,
    email: parsed.data.email,
  });

  if (error) return fail(describeDbError(error));
  refresh();
  return ok("Zaproszenie gotowe — skopiuj link i wyślij");
}

export async function revokeInvite(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return fail("Nie znaleziono zaproszenia.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("household_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id.data);

  if (error) return fail(describeDbError(error));
  refresh();
  return ok("Anulowano zaproszenie");
}

export async function removeMember(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({ household_id: uuidSchema, user_id: uuidSchema })
    .safeParse({
      household_id: formData.get("household_id") ?? "",
      user_id: formData.get("user_id") ?? "",
    });
  if (!parsed.success) return fail("Nie znaleziono osoby.");

  const { userId } = await getSessionContext();
  if (parsed.data.user_id === userId)
    return fail("Żeby wyjść z przestrzeni, użyj przycisku „Opuść przestrzeń”.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("household_members")
    .delete()
    .eq("household_id", parsed.data.household_id)
    .eq("user_id", parsed.data.user_id);

  if (error) return fail(describeDbError(error));
  refresh();
  return ok("Usunięto osobę z przestrzeni");
}

export async function acceptInvite(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = z
    .string()
    .min(8)
    .safeParse(formData.get("token"));
  if (!token.success) return fail("Nieprawidłowy link zaproszenia.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_invite", {
    p_token: token.data,
  });

  if (error) return fail(describeDbError(error));
  refresh();
  redirect("/");
}
