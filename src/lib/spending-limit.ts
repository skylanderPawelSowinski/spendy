import type { ActiveHousehold } from "@/lib/data";

/** Powyżej tego udziału progu ostrzegamy, zanim zrobi się czerwono. */
const WARNING_AT = 0.8;

export type SpendingLimit =
  | { state: "off" }
  /** Próg procentowy, ale w tym miesiącu nie ma od czego liczyć. */
  | { state: "no-income"; percent: number }
  | {
      state: "active";
      kind: "amount" | "percent";
      /** Procent przychodów — tylko dla kind === "percent". */
      percent: number | null;
      limit: number;
      spent: number;
      remaining: number;
      ratio: number;
      level: "ok" | "warning" | "over";
    };

export function computeSpendingLimit(
  household: Pick<
    ActiveHousehold,
    "spending_limit_kind" | "spending_limit_value"
  >,
  spent: number,
  incomes: number,
): SpendingLimit {
  const kind = household.spending_limit_kind;
  const value = Number(household.spending_limit_value ?? 0);

  if (kind === "none" || value <= 0) return { state: "off" };

  if (kind === "percent" && incomes <= 0) {
    return { state: "no-income", percent: value };
  }

  const limit = kind === "percent" ? (incomes * value) / 100 : value;
  const ratio = limit > 0 ? spent / limit : 0;

  return {
    state: "active",
    kind,
    percent: kind === "percent" ? value : null,
    limit,
    spent,
    remaining: limit - spent,
    ratio,
    level: ratio > 1 ? "over" : ratio >= WARNING_AT ? "warning" : "ok",
  };
}
