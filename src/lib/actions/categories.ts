"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSessionContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import {
  describeDbError,
  fail,
  fromZod,
  ok,
  paletteSlotSchema,
  uuidSchema,
  type ActionState,
} from "@/lib/actions/shared";

const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Podaj nazwę")
    .max(40, "Nazwa może mieć maksymalnie 40 znaków"),
  color: paletteSlotSchema,
});

function refresh() {
  revalidatePath("/", "layout");
}

export async function createCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = categorySchema.safeParse({
    name: formData.get("name") ?? "",
    color: formData.get("color") ?? "slate",
  });
  if (!parsed.success) return fromZod(parsed.error);

  const { household } = await getSessionContext();
  const supabase = await createClient();

  const { data: last } = await supabase
    .from("categories")
    .select("sort_order")
    .eq("household_id", household.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("categories").insert({
    household_id: household.id,
    sort_order: (last?.sort_order ?? 0) + 10,
    ...parsed.data,
  });

  if (error) {
    return error.code === "23505"
      ? fail("Kategoria o tej nazwie już istnieje.", { name: "Nazwa zajęta" })
      : fail(describeDbError(error));
  }
  refresh();
  return ok("Dodano kategorię");
}

export async function updateCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = categorySchema.extend({ id: uuidSchema }).safeParse({
    id: formData.get("id") ?? "",
    name: formData.get("name") ?? "",
    color: formData.get("color") ?? "slate",
  });
  if (!parsed.success) return fromZod(parsed.error);

  const { id, ...values } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update(values)
    .eq("id", id);

  if (error) {
    return error.code === "23505"
      ? fail("Kategoria o tej nazwie już istnieje.", { name: "Nazwa zajęta" })
      : fail(describeDbError(error));
  }
  refresh();
  return ok("Zapisano zmiany");
}

export async function setCategoryArchived(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({ id: uuidSchema, archived: z.enum(["true", "false"]) })
    .safeParse({
      id: formData.get("id") ?? "",
      archived: formData.get("archived") ?? "true",
    });
  if (!parsed.success) return fail("Nie znaleziono kategorii.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ archived: parsed.data.archived === "true" })
    .eq("id", parsed.data.id);

  if (error) return fail(describeDbError(error));
  refresh();
  return ok(
    parsed.data.archived === "true"
      ? "Kategoria ukryta"
      : "Kategoria przywrócona",
  );
}

/**
 * Trwałe usunięcie. Wydatki nie znikają — tracą tylko przypisanie
 * (FK `on delete set null`), więc sumy miesiąca się nie zmienią.
 */
export async function deleteCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return fail("Nie znaleziono kategorii.");

  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id.data);

  if (error) return fail(describeDbError(error));
  refresh();
  return ok("Usunięto kategorię");
}
