"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSessionContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { monthStart } from "@/lib/month";
import {
  amountSchema,
  describeDbError,
  fail,
  fromZod,
  monthKeySchema,
  ok,
  optionalUuid,
  uuidSchema,
  type ActionState,
} from "@/lib/actions/shared";

const baseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Podaj nazwę")
    .max(80, "Nazwa może mieć maksymalnie 80 znaków"),
  amount: amountSchema,
  day_of_month: z.coerce
    .number()
    .int()
    .min(1, "Dzień musi być z zakresu 1–31")
    .max(31, "Dzień musi być z zakresu 1–31"),
  start_month: monthKeySchema.transform(monthStart),
  end_month: z
    .string()
    .transform((v) => (v ? v : null))
    .nullable()
    .refine(
      (v) => v === null || monthKeySchema.safeParse(v).success,
      "Nieprawidłowy miesiąc",
    )
    .transform((v) => (v ? monthStart(v) : null)),
});

const expenseSchema = baseSchema.extend({ category_id: optionalUuid });

function refresh() {
  revalidatePath("/", "layout");
}

function readExpense(formData: FormData) {
  return {
    name: formData.get("name") ?? "",
    amount: formData.get("amount") ?? "",
    day_of_month: formData.get("day_of_month") ?? "1",
    start_month: formData.get("start_month") ?? "",
    end_month: formData.get("end_month") ?? "",
    category_id: formData.get("category_id") ?? "",
  };
}

function readIncome(formData: FormData) {
  return {
    name: formData.get("name") ?? "",
    amount: formData.get("amount") ?? "",
    day_of_month: formData.get("day_of_month") ?? "1",
    start_month: formData.get("start_month") ?? "",
    end_month: formData.get("end_month") ?? "",
  };
}

const validRange = (data: { start_month: string; end_month: string | null }) =>
  data.end_month === null || data.end_month >= data.start_month;

export async function createRecurringExpense(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = expenseSchema.safeParse(readExpense(formData));
  if (!parsed.success) return fromZod(parsed.error);
  if (!validRange(parsed.data))
    return fail("Koniec nie może być przed początkiem.", {
      end_month: "Za wcześnie",
    });

  const { household, userId } = await getSessionContext();
  const supabase = await createClient();
  const { error } = await supabase.from("recurring_expenses").insert({
    household_id: household.id,
    created_by: userId,
    ...parsed.data,
  });

  if (error) return fail(describeDbError(error));
  refresh();
  return ok("Dodano wydatek cykliczny");
}

export async function updateRecurringExpense(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = expenseSchema
    .extend({ id: uuidSchema })
    .safeParse({ ...readExpense(formData), id: formData.get("id") ?? "" });
  if (!parsed.success) return fromZod(parsed.error);
  if (!validRange(parsed.data))
    return fail("Koniec nie może być przed początkiem.", {
      end_month: "Za wcześnie",
    });

  const { id, ...values } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_expenses")
    .update(values)
    .eq("id", id);

  if (error) return fail(describeDbError(error));
  refresh();
  return ok(
    "Zapisano szablon. Zmiana dotyczy przyszłych miesięcy — już utworzone " +
      "wpisy popraw na liście wydatków.",
  );
}

export async function setRecurringExpenseActive(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({ id: uuidSchema, active: z.enum(["true", "false"]) })
    .safeParse({
      id: formData.get("id") ?? "",
      active: formData.get("active") ?? "true",
    });
  if (!parsed.success) return fail("Nie znaleziono szablonu.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_expenses")
    .update({ active: parsed.data.active === "true" })
    .eq("id", parsed.data.id);

  if (error) return fail(describeDbError(error));
  refresh();
  return ok(parsed.data.active === "true" ? "Wznowiono" : "Wstrzymano");
}

/** Kasuje szablon; wygenerowane wpisy zostają (FK `on delete set null`). */
export async function deleteRecurringExpense(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return fail("Nie znaleziono szablonu.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_expenses")
    .delete()
    .eq("id", id.data);

  if (error) return fail(describeDbError(error));
  refresh();
  return ok("Usunięto szablon");
}

export async function createRecurringIncome(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = baseSchema.safeParse(readIncome(formData));
  if (!parsed.success) return fromZod(parsed.error);
  if (!validRange(parsed.data))
    return fail("Koniec nie może być przed początkiem.", {
      end_month: "Za wcześnie",
    });

  const { household, userId } = await getSessionContext();
  const supabase = await createClient();
  const { error } = await supabase.from("recurring_incomes").insert({
    household_id: household.id,
    created_by: userId,
    ...parsed.data,
  });

  if (error) return fail(describeDbError(error));
  refresh();
  return ok("Dodano stały przychód");
}

export async function updateRecurringIncome(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = baseSchema
    .extend({ id: uuidSchema })
    .safeParse({ ...readIncome(formData), id: formData.get("id") ?? "" });
  if (!parsed.success) return fromZod(parsed.error);
  if (!validRange(parsed.data))
    return fail("Koniec nie może być przed początkiem.", {
      end_month: "Za wcześnie",
    });

  const { id, ...values } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_incomes")
    .update(values)
    .eq("id", id);

  if (error) return fail(describeDbError(error));
  refresh();
  return ok(
    "Zapisano szablon. Zmiana dotyczy przyszłych miesięcy — już utworzone " +
      "wpisy popraw na liście przychodów.",
  );
}

export async function setRecurringIncomeActive(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({ id: uuidSchema, active: z.enum(["true", "false"]) })
    .safeParse({
      id: formData.get("id") ?? "",
      active: formData.get("active") ?? "true",
    });
  if (!parsed.success) return fail("Nie znaleziono szablonu.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_incomes")
    .update({ active: parsed.data.active === "true" })
    .eq("id", parsed.data.id);

  if (error) return fail(describeDbError(error));
  refresh();
  return ok(parsed.data.active === "true" ? "Wznowiono" : "Wstrzymano");
}

export async function deleteRecurringIncome(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return fail("Nie znaleziono szablonu.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_incomes")
    .delete()
    .eq("id", id.data);

  if (error) return fail(describeDbError(error));
  refresh();
  return ok("Usunięto szablon");
}
