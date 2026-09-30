"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSessionContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import {
  amountSchema,
  describeDbError,
  fail,
  fromZod,
  isoDateSchema,
  ok,
  uuidSchema,
  type ActionState,
} from "@/lib/actions/shared";

const incomeSchema = z.object({
  amount: amountSchema,
  received_on: isoDateSchema,
  description: z
    .string()
    .trim()
    .max(200, "Opis może mieć maksymalnie 200 znaków")
    .transform((v) => v || null),
});

function refresh() {
  revalidatePath("/", "layout");
}

export async function createIncome(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = incomeSchema.safeParse({
    amount: formData.get("amount") ?? "",
    received_on: formData.get("received_on") ?? "",
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return fromZod(parsed.error);

  const { household, userId } = await getSessionContext();
  const supabase = await createClient();

  const { error } = await supabase.from("incomes").insert({
    household_id: household.id,
    created_by: userId,
    ...parsed.data,
  });

  if (error) return fail(describeDbError(error));
  refresh();
  return ok("Dodano przychód");
}

export async function updateIncome(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = incomeSchema.extend({ id: uuidSchema }).safeParse({
    id: formData.get("id") ?? "",
    amount: formData.get("amount") ?? "",
    received_on: formData.get("received_on") ?? "",
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return fromZod(parsed.error);

  const { id, ...values } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("incomes").update(values).eq("id", id);

  if (error) return fail(describeDbError(error));
  refresh();
  return ok("Zapisano zmiany");
}

export async function deleteIncome(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return fail("Nie znaleziono przychodu.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_income", { p_id: id.data });

  if (error) return fail(describeDbError(error));
  refresh();
  return ok("Usunięto przychód");
}
