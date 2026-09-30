import { daysInMonth, elapsedDays, parseMonthKey, type MonthKey } from "@/lib/month";
import { toSlot, type PaletteSlot } from "@/lib/palette";
import type { ExpenseWithCategory, MonthData } from "@/lib/data";

export type CategorySlice = {
  id: string;
  name: string;
  color: PaletteSlot;
  icon: string | null;
  total: number;
  share: number;
  count: number;
};

export type MonthSummary = {
  totalExpenses: number;
  totalIncomes: number;
  balance: number;
  savingsRate: number | null;
  expenseCount: number;
  byCategory: CategorySlice[];
  /** Skumulowane wydatki dzień po dniu — do wykresu tempa. */
  cumulative: { day: number; total: number | null }[];
  averagePerDay: number;
  projectedTotal: number | null;
};

const UNCATEGORIZED_ID = "__none__";

export function summarizeMonth(data: MonthData): MonthSummary {
  const totalExpenses = data.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalIncomes = data.incomes.reduce((sum, i) => sum + Number(i.amount), 0);

  return {
    totalExpenses,
    totalIncomes,
    balance: totalIncomes - totalExpenses,
    savingsRate:
      totalIncomes > 0 ? (totalIncomes - totalExpenses) / totalIncomes : null,
    expenseCount: data.expenses.length,
    byCategory: groupByCategory(data.expenses, totalExpenses),
    ...pace(data.expenses, data.month, totalExpenses),
  };
}

function groupByCategory(
  expenses: ExpenseWithCategory[],
  total: number,
): CategorySlice[] {
  const buckets = new Map<string, CategorySlice>();

  for (const expense of expenses) {
    const id = expense.category?.id ?? UNCATEGORIZED_ID;
    const bucket = buckets.get(id) ?? {
      id,
      name: expense.category?.name ?? "Bez kategorii",
      color: expense.category ? toSlot(expense.category.color) : "slate",
      icon: expense.category?.icon ?? null,
      total: 0,
      share: 0,
      count: 0,
    };
    bucket.total += Number(expense.amount);
    bucket.count += 1;
    buckets.set(id, bucket);
  }

  return [...buckets.values()]
    .map((bucket) => ({
      ...bucket,
      share: total > 0 ? bucket.total / total : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Zwija ogon do „Pozostałe”. Paleta ma 8 slotów i nie cyklujemy hue —
 * powyżej `max` kategorii pozostałe lądują w jednym szarym wycinku.
 */
export function withTail(slices: CategorySlice[], max = 6): CategorySlice[] {
  if (slices.length <= max) return slices;

  const head = slices.slice(0, max - 1);
  const tail = slices.slice(max - 1);

  return [
    ...head,
    {
      id: "__rest__",
      name: `Pozostałe (${tail.length})`,
      color: "slate",
      icon: null,
      total: tail.reduce((sum, s) => sum + s.total, 0),
      share: tail.reduce((sum, s) => sum + s.share, 0),
      count: tail.reduce((sum, s) => sum + s.count, 0),
    },
  ];
}

function pace(
  expenses: ExpenseWithCategory[],
  month: MonthKey,
  total: number,
): Pick<MonthSummary, "cumulative" | "averagePerDay" | "projectedTotal"> {
  const days = daysInMonth(month);
  const elapsed = elapsedDays(month);

  const perDay = new Array<number>(days + 1).fill(0);
  for (const expense of expenses) {
    const day = Number(expense.spent_on.slice(8, 10));
    if (day >= 1 && day <= days) perDay[day] += Number(expense.amount);
  }

  let running = 0;
  const cumulative = Array.from({ length: days }, (_, i) => {
    const day = i + 1;
    running += perDay[day];
    // Dni, które jeszcze nie nastąpiły, zostawiamy puste zamiast rysować
    // płaską linię sugerującą „zero wydatków”.
    return { day, total: day <= elapsed ? running : null };
  });

  const averagePerDay = elapsed > 0 ? total / elapsed : 0;
  const isPastOrCurrent = elapsed > 0;

  return {
    cumulative,
    averagePerDay,
    projectedTotal:
      isPastOrCurrent && elapsed < days ? averagePerDay * days : null,
  };
}

export function monthDayCount(month: MonthKey) {
  const { year, month: m } = parseMonthKey(month);
  return { days: daysInMonth(month), year, month: m };
}
