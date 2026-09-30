import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { monthEnd, monthStart, shiftMonth, type MonthKey } from "@/lib/month";
import type {
  CategoryRow,
  ExpenseRow,
  HouseholdInviteRow,
  HouseholdMemberView,
  HouseholdRow,
  IncomeRow,
  RecurringExpenseRow,
  RecurringIncomeRow,
} from "@/lib/supabase/types";

export type ActiveHousehold = Pick<
  HouseholdRow,
  "id" | "name" | "currency" | "spending_limit_kind" | "spending_limit_value"
>;

export type SessionContext = {
  userId: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  households: ActiveHousehold[];
  household: ActiveHousehold;
};

const HOUSEHOLD_COLUMNS =
  "id, name, currency, spending_limit_kind, spending_limit_value";

/**
 * Użytkownik + jego przestrzenie.
 *
 * `getClaims()` zamiast `getUser()`: projekt podpisuje tokeny kluczem ES256,
 * więc podpis weryfikujemy lokalnie (~0.5 ms) zamiast pytać Auth API (~100 ms).
 * Dla HS256 biblioteka i tak sama spadnie do `getUser()`.
 */
export const getSessionContext = cache(async (): Promise<SessionContext> => {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims?.sub) redirect("/login");

  const [profileResult, householdsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("active_household_id, full_name, avatar_url, email")
      .eq("id", claims.sub)
      .maybeSingle(),
    supabase
      .from("households")
      .select(HOUSEHOLD_COLUMNS)
      .order("created_at", { ascending: true }),
  ]);

  if (householdsResult.error) throw householdsResult.error;

  let profile = profileResult.data;
  let households = householdsResult.data ?? [];

  // Bootstrap tylko wtedy, gdy naprawdę go brakuje — inaczej doklejalibyśmy
  // zbędny round-trip do każdego renderu strony.
  if (households.length === 0 || !profile) {
    const { error } = await supabase.rpc("bootstrap_user");
    if (error) throw error;

    const [retryProfile, retryHouseholds] = await Promise.all([
      supabase
        .from("profiles")
        .select("active_household_id, full_name, avatar_url, email")
        .eq("id", claims.sub)
        .maybeSingle(),
      supabase
        .from("households")
        .select(HOUSEHOLD_COLUMNS)
        .order("created_at", { ascending: true }),
    ]);

    if (retryHouseholds.error) throw retryHouseholds.error;
    profile = retryProfile.data;
    households = retryHouseholds.data ?? [];
  }

  const active =
    households.find((h) => h.id === profile?.active_household_id) ??
    households[0];

  if (!active) redirect("/onboarding");

  return {
    userId: claims.sub,
    email: profile?.email ?? (claims.email as string | undefined) ?? null,
    fullName: profile?.full_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    households,
    household: active,
  };
});

export type ExpenseWithCategory = ExpenseRow & {
  category: Pick<CategoryRow, "id" | "name" | "color" | "icon"> | null;
};

export type MonthData = {
  month: MonthKey;
  categories: CategoryRow[];
  expenses: ExpenseWithCategory[];
  incomes: IncomeRow[];
};

/** Dogenerowuje pozycje cykliczne dla całego zakresu jednym wywołaniem. */
async function materializeRange(
  householdId: string,
  from: MonthKey,
  to: MonthKey,
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("materialize_range", {
    p_household_id: householdId,
    p_from: monthStart(from),
    p_to: monthStart(to),
  });
  if (error) throw error;
}

export async function getMonthData(
  householdId: string,
  month: MonthKey,
): Promise<MonthData> {
  await materializeRange(householdId, month, month);

  const supabase = await createClient();
  const from = monthStart(month);
  const to = monthEnd(month);

  const [categories, expenses, incomes] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("household_id", householdId)
      .order("sort_order")
      .order("name"),
    supabase
      .from("expenses")
      .select("*, category:categories(id, name, color, icon)")
      .eq("household_id", householdId)
      .gte("spent_on", from)
      .lte("spent_on", to)
      .order("spent_on", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("incomes")
      .select("*")
      .eq("household_id", householdId)
      .gte("received_on", from)
      .lte("received_on", to)
      .order("received_on", { ascending: false }),
  ]);

  if (categories.error) throw categories.error;
  if (expenses.error) throw expenses.error;
  if (incomes.error) throw incomes.error;

  return {
    month,
    categories: categories.data ?? [],
    expenses: (expenses.data ?? []) as unknown as ExpenseWithCategory[],
    incomes: incomes.data ?? [],
  };
}

export type MonthTotal = {
  month: MonthKey;
  expenses: number;
  incomes: number;
};

export async function getMonthlyTotals(
  householdId: string,
  month: MonthKey,
  count: number,
): Promise<MonthTotal[]> {
  const months = Array.from({ length: count }, (_, i) =>
    shiftMonth(month, i - count + 1),
  );

  await materializeRange(householdId, months[0], months[months.length - 1]);

  const supabase = await createClient();
  const from = monthStart(months[0]);
  const to = monthEnd(months[months.length - 1]);

  const [expenses, incomes] = await Promise.all([
    supabase
      .from("expenses")
      .select("amount, period_month")
      .eq("household_id", householdId)
      .gte("spent_on", from)
      .lte("spent_on", to),
    supabase
      .from("incomes")
      .select("amount, period_month")
      .eq("household_id", householdId)
      .gte("received_on", from)
      .lte("received_on", to),
  ]);

  if (expenses.error) throw expenses.error;
  if (incomes.error) throw incomes.error;

  const byMonth = new Map<MonthKey, MonthTotal>(
    months.map((m) => [m, { month: m, expenses: 0, incomes: 0 }]),
  );

  for (const row of expenses.data ?? []) {
    const bucket = byMonth.get(row.period_month.slice(0, 7));
    if (bucket) bucket.expenses += Number(row.amount);
  }
  for (const row of incomes.data ?? []) {
    const bucket = byMonth.get(row.period_month.slice(0, 7));
    if (bucket) bucket.incomes += Number(row.amount);
  }

  return months.map((m) => byMonth.get(m)!);
}

export async function getCategories(
  householdId: string,
): Promise<CategoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("household_id", householdId)
    .order("sort_order")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getCategoryUsage(
  householdId: string,
): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("category_id")
    .eq("household_id", householdId)
    .not("category_id", "is", null);
  if (error) throw error;

  const usage: Record<string, number> = {};
  for (const row of data ?? []) {
    if (row.category_id) usage[row.category_id] = (usage[row.category_id] ?? 0) + 1;
  }
  return usage;
}

export type RecurringExpenseWithCategory = RecurringExpenseRow & {
  category: Pick<CategoryRow, "id" | "name" | "color" | "icon"> | null;
};

export async function getRecurring(householdId: string): Promise<{
  expenses: RecurringExpenseWithCategory[];
  incomes: RecurringIncomeRow[];
}> {
  const supabase = await createClient();
  const [expenses, incomes] = await Promise.all([
    supabase
      .from("recurring_expenses")
      .select("*, category:categories(id, name, color, icon)")
      .eq("household_id", householdId)
      .order("active", { ascending: false })
      .order("day_of_month"),
    supabase
      .from("recurring_incomes")
      .select("*")
      .eq("household_id", householdId)
      .order("active", { ascending: false })
      .order("day_of_month"),
  ]);

  if (expenses.error) throw expenses.error;
  if (incomes.error) throw incomes.error;

  return {
    expenses: (expenses.data ?? []) as unknown as RecurringExpenseWithCategory[],
    incomes: incomes.data ?? [],
  };
}

export async function getHouseholdPeople(householdId: string): Promise<{
  members: HouseholdMemberView[];
  invites: HouseholdInviteRow[];
}> {
  const supabase = await createClient();
  const [members, invites] = await Promise.all([
    supabase.rpc("household_members_view", { p_household_id: householdId }),
    supabase
      .from("household_invites")
      .select("*")
      .eq("household_id", householdId)
      .is("accepted_at", null)
      .is("revoked_at", null)
      .order("created_at", { ascending: false }),
  ]);

  if (members.error) throw members.error;
  if (invites.error) throw invites.error;

  return {
    members: (members.data ?? []) as HouseholdMemberView[],
    invites: invites.data ?? [],
  };
}
