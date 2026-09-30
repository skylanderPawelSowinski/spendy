import { Suspense } from "react";

import { MonthPill } from "@/components/month/month-pill";
import { CategoryFilter } from "@/components/expenses/category-filter";
import { ExpenseList } from "@/components/expenses/expense-list";
import { ExpensesSkeleton } from "@/components/skeletons";
import { Card, CardContent } from "@/components/ui/card";
import { getMonthData, getSessionContext } from "@/lib/data";
import { formatDayHeader, formatMoney } from "@/lib/format";
import { monthFromParam, type MonthKey } from "@/lib/month";

export const metadata = { title: "Wydatki" };

export default async function ExpensesPage({
  searchParams,
}: PageProps<"/wydatki">) {
  const params = await searchParams;
  const month = monthFromParam(params.m);
  const categoryId = typeof params.k === "string" ? params.k : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Wydatki</h1>
        <MonthPill month={month} />
      </div>

      <Suspense
        key={`${month}-${categoryId ?? "all"}`}
        fallback={<ExpensesSkeleton />}
      >
        <ExpensesSection month={month} categoryId={categoryId} />
      </Suspense>
    </div>
  );
}

async function ExpensesSection({
  month,
  categoryId,
}: {
  month: MonthKey;
  categoryId: string | null;
}) {
  const { household } = await getSessionContext();
  const data = await getMonthData(household.id, month);

  const counts: Record<string, number> = {};
  for (const expense of data.expenses) {
    if (expense.category_id)
      counts[expense.category_id] = (counts[expense.category_id] ?? 0) + 1;
  }

  const filtered = categoryId
    ? data.expenses.filter((e) => e.category_id === categoryId)
    : data.expenses;

  const total = filtered.reduce((sum, e) => sum + Number(e.amount), 0);

  // Wydatki przychodzą posortowane malejąco po dacie — grupujemy po dniu.
  const byDay = new Map<string, typeof filtered>();
  for (const expense of filtered) {
    const list = byDay.get(expense.spent_on) ?? [];
    list.push(expense);
    byDay.set(expense.spent_on, list);
  }

  return (
    <>
      <CategoryFilter
        categories={data.categories}
        counts={counts}
        active={categoryId}
      />

      <div className="flex items-baseline justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          {filtered.length} {filtered.length === 1 ? "wpis" : "wpisów"}
        </p>
        <p className="text-lg font-semibold tabular-nums">
          {formatMoney(total)}
        </p>
      </div>

      {byDay.size === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            Brak wydatków
            {categoryId ? " w tej kategorii" : ""} w tym miesiącu.
          </CardContent>
        </Card>
      ) : (
        /* Jedna karta z nagłówkami dni w środku — osobna karta na każdy dzień
           przy jednym wpisie dawała ścianę prawie pustych prostokątów. */
        <Card>
          <CardContent className="divide-y">
            {[...byDay.entries()].map(([day, expenses]) => (
              <section key={day} className="py-3 first:pt-0 last:pb-0">
                <div className="mb-1 flex items-baseline justify-between gap-4">
                  <h2 className="text-muted-foreground text-xs font-medium first-letter:uppercase">
                    {formatDayHeader(day)}
                  </h2>
                  {/* Przy jednym wpisie suma dnia tylko powtarzałaby kwotę obok. */}
                  {expenses.length > 1 ? (
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {formatMoney(
                        expenses.reduce((sum, e) => sum + Number(e.amount), 0),
                      )}
                    </span>
                  ) : null}
                </div>
                <ExpenseList
                  expenses={expenses}
                  categories={data.categories}
                  month={month}
                  showDate={false}
                />
              </section>
            ))}
          </CardContent>
        </Card>
      )}

    </>
  );
}
