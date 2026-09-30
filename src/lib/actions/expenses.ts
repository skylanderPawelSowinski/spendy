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
  optionalUuid,
  uuidSchema,
  type ActionState,
} from "@/lib/actions/shared";

const expenseSchema = z.object({
  amount: amountSchema,
  spent_on: isoDateSchema,
  category_id: optionalUuid,
  description: z
    .string()
    .trim()
    .max(200, "Opis może mieć maksymalnie 200 znaków")
    .transform((v) => v || null),
});

function refresh() {
  revalidatePath("/", "layout");
}

export async function createExpense(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = expenseSchema.safeParse({
    amount: formData.get("amount") ?? "",
    spent_on: formData.get("spent_on") ?? "",
    category_id: formData.get("category_id") ?? "",
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return fromZod(parsed.error);

  const { household, userId } = await getSessionContext();
  const supabase = await createClient();

  const { error } = await supabase.from("expenses").insert({
    household_id: household.id,
    created_by: userId,
    ...parsed.data,
  });

  if (error) return fail(describeDbError(error));
  refresh();
  return ok("Dodano wydatek");
}

export async function updateExpense(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = expenseSchema
    .extend({ id: uuidSchema })
    .safeParse({
      id: formData.get("id") ?? "",
      amount: formData.get("amount") ?? "",
      spent_on: formData.get("spent_on") ?? "",
      category_id: formData.get("category_id") ?? "",
      description: formData.get("description") ?? "",
    });
  if (!parsed.success) return fromZod(parsed.error);

  const { id, ...values } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").update(values).eq("id", id);

  if (error) return fail(describeDbError(error));
  refresh();
  return ok("Zapisano zmiany");
}

/**
 * Usuwa wydatek. Dla pozycji z szablonu cyklicznego zapisuje pominięcie,
 * żeby nie wróciła przy następnym wejściu w ten miesiąc.
 */
export async function deleteExpense(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return fail("Nie znaleziono wydatku.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_expense", { p_id: id.data });

  if (error) return fail(describeDbError(error));
  refresh();
  return ok("Usunięto wydatek");
}
