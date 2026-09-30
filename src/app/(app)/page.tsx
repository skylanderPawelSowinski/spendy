import { Suspense } from "react";
import Link from "next/link";

import { SpendHero } from "@/components/dashboard/spend-hero";
import { StatRow } from "@/components/dashboard/stat-row";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { PaceChart } from "@/components/dashboard/pace-chart";
import { IncomesCard } from "@/components/incomes/incomes-card";
import { ExpenseList } from "@/components/expenses/expense-list";
import { Reveal, STAGGER } from "@/components/motion/reveal";
import {
  BreakdownSkeleton,
  ChartSkeleton,
  HeroSkeleton,
  ListCardSkeleton,
  StatRowSkeleton,
} from "@/components/skeletons";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMonthData, getMonthlyTotals, getSessionContext } from "@/lib/data";
import { summarizeMonth } from "@/lib/summary";
import { computeSpendingLimit } from "@/lib/spending-limit";
import { formatMoney } from "@/lib/format";
import { isCurrentMonth, monthFromParam, type MonthKey } from "@/lib/month";

export const metadata = { title: "Pulpit" };

const RECENT_LIMIT = 8;
const TREND_MONTHS = 6;

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const month = monthFromParam(params.m);

  return (
    <div className="space-y-3">
      <Suspense key={`hero-${month}`} fallback={<HeroSkeleton />}>
        <HeroSection month={month} />
      </Suspense>

      {/* Skróty nie czekają na żadne zapytanie — wchodzą razem ze szkieletem. */}
      <QuickActions month={month} />

      <Suspense key={`month-${month}`} fallback={<MonthSectionSkeleton />}>
        <MonthSection month={month} />
      </Suspense>
    </div>
  );
}

function MonthSectionSkeleton() {
  return (
    <>
      <StatRowSkeleton />
      <BreakdownSkeleton />
      <ChartSkeleton height="h-48" />
      <ListCardSkeleton rows={2} />
      <ListCardSkeleton rows={5} />
    </>
  );
}

/**
 * Nagłówek liczy się z sum miesięcznych — mniejsze zapytanie, więc wchodzi
 * pierwszy. Próg wydatków też bierze dane stąd: `getMonthlyTotals` zwraca
 * przychody miesiąca, więc nie trzeba czekać na cięższe `getMonthData`.
 */
async function HeroSection({ month }: { month: MonthKey }) {
  const { household } = await getSessionContext();
  const totals = await getMonthlyTotals(household.id, month, TREND_MONTHS);
  const current = totals.find((t) => t.month === month);

  const limit = computeSpendingLimit(
    household,
    current?.expenses ?? 0,
    current?.incomes ?? 0,
  );

  return (
    <Reveal>
      <SpendHero
        month={month}
        spent={current?.expenses ?? 0}
        totals={totals}
        limit={limit}
      />
    </Reveal>
  );
}

async function MonthSection({ month }: { month: MonthKey }) {
  const { household } = await getSessionContext();
  const data = await getMonthData(household.id, month);

  const summary = summarizeMonth(data);
  const recent = data.expenses.slice(0, RECENT_LIMIT);

  return (
    <>
      <Reveal delay={STAGGER}>
        <StatRow
          totalIncomes={summary.totalIncomes}
          totalExpenses={summary.totalExpenses}
          balance={summary.balance}
          savingsRate={summary.savingsRate}
        />
      </Reveal>

      <Reveal delay={STAGGER * 2}>
        <CategoryBreakdown
          slices={summary.byCategory}
          total={summary.totalExpenses}
          month={month}
        />
      </Reveal>

      {summary.totalExpenses > 0 ? (
        <Reveal delay={STAGGER * 3}>
          <Card>
            <CardHeader>
              <CardTitle>Tempo wydawania</CardTitle>
              <CardDescription>
                Średnio {formatMoney(summary.averagePerDay)} dziennie
                {summary.projectedTotal !== null && isCurrentMonth(month)
                  ? ` — przy tym tempie miesiąc zamknie się na ${formatMoney(
                      summary.projectedTotal,
                    )}`
                  : ""}
                .
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaceChart
                data={summary.cumulative}
                budget={summary.totalIncomes || null}
              />
            </CardContent>
          </Card>
        </Reveal>
      ) : null}

      <Reveal delay={STAGGER * 4}>
        <IncomesCard
          incomes={data.incomes}
          month={month}
          total={summary.totalIncomes}
        />
      </Reveal>

      <Reveal delay={STAGGER * 5}>
        <Card>
          <CardHeader>
            <CardTitle>Ostatnie wydatki</CardTitle>
            <CardDescription>
              {summary.expenseCount > 0
                ? `${summary.expenseCount} ${
                    summary.expenseCount === 1 ? "wpis" : "wpisów"
                  } w tym miesiącu`
                : "Jeszcze nic tu nie ma"}
            </CardDescription>
            {summary.expenseCount > RECENT_LIMIT ? (
              <CardAction>
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/wydatki?m=${month}`}>Wszystkie</Link>
                </Button>
              </CardAction>
            ) : null}
          </CardHeader>
          <CardContent>
            <ExpenseList
              expenses={recent}
              categories={data.categories}
              month={month}
            />
          </CardContent>
        </Card>
      </Reveal>
    </>
  );
}
