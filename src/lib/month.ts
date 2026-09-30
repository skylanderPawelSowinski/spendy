/**
 * Miesiąc rozliczeniowy = pełny miesiąc kalendarzowy (1 → ostatni dzień).
 * W całej aplikacji identyfikowany stringiem "YYYY-MM".
 */

export type MonthKey = string; // "2026-09"

const MONTHS_PL = [
  "styczeń",
  "luty",
  "marzec",
  "kwiecień",
  "maj",
  "czerwiec",
  "lipiec",
  "sierpień",
  "wrzesień",
  "październik",
  "listopad",
  "grudzień",
];

const MONTHS_PL_SHORT = [
  "sty",
  "lut",
  "mar",
  "kwi",
  "maj",
  "cze",
  "lip",
  "sie",
  "wrz",
  "paź",
  "lis",
  "gru",
];

export function currentMonthKey(now = new Date()): MonthKey {
  return toMonthKey(now.getFullYear(), now.getMonth() + 1);
}

export function toMonthKey(year: number, month1: number): MonthKey {
  return `${year}-${String(month1).padStart(2, "0")}`;
}

export function isValidMonthKey(value: unknown): value is MonthKey {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function parseMonthKey(key: MonthKey) {
  const [year, month] = key.split("-").map(Number);
  return { year, month };
}

/** Bezpieczne odczytanie miesiąca z query param (fallback: bieżący). */
export function monthFromParam(value: unknown): MonthKey {
  return isValidMonthKey(value) ? value : currentMonthKey();
}

export function shiftMonth(key: MonthKey, delta: number): MonthKey {
  const { year, month } = parseMonthKey(key);
  const d = new Date(year, month - 1 + delta, 1);
  return toMonthKey(d.getFullYear(), d.getMonth() + 1);
}

/** Pierwszy dzień miesiąca w formacie DATE dla Postgresa. */
export function monthStart(key: MonthKey): string {
  return `${key}-01`;
}

/** Ostatni dzień miesiąca w formacie DATE dla Postgresa. */
export function monthEnd(key: MonthKey): string {
  const { year, month } = parseMonthKey(key);
  const last = new Date(year, month, 0).getDate();
  return `${key}-${String(last).padStart(2, "0")}`;
}

export function daysInMonth(key: MonthKey): number {
  const { year, month } = parseMonthKey(key);
  return new Date(year, month, 0).getDate();
}

export function monthLabel(key: MonthKey): string {
  const { year, month } = parseMonthKey(key);
  return `${MONTHS_PL[month - 1]} ${year}`;
}

export function monthLabelShort(key: MonthKey): string {
  const { year, month } = parseMonthKey(key);
  return `${MONTHS_PL_SHORT[month - 1]} ${String(year).slice(2)}`;
}

export function isCurrentMonth(key: MonthKey, now = new Date()): boolean {
  return key === currentMonthKey(now);
}

/** Ile dni miesiąca już minęło (dla bieżącego: dziś; dla przeszłych: całość). */
export function elapsedDays(key: MonthKey, now = new Date()): number {
  const { year, month } = parseMonthKey(key);
  const start = new Date(year, month - 1, 1);
  if (now < start) return 0;
  const total = daysInMonth(key);
  if (now >= new Date(year, month, 1)) return total;
  return now.getDate();
}

/** Lista N ostatnich miesięcy zakończona na `key` (rosnąco). */
export function lastMonths(key: MonthKey, count: number): MonthKey[] {
  return Array.from({ length: count }, (_, i) => shiftMonth(key, i - count + 1));
}

/** Zakres lat do selecta wyboru miesiąca. */
export function yearRange(key: MonthKey, now = new Date()): number[] {
  const { year } = parseMonthKey(key);
  const current = now.getFullYear();
  const from = Math.min(year, current) - 3;
  const to = Math.max(year, current) + 1;
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

/** Miejscownik — do zdań w rodzaju „mniej niż w sierpniu". */
const MONTHS_PL_LOCATIVE = [
  "styczniu",
  "lutym",
  "marcu",
  "kwietniu",
  "maju",
  "czerwcu",
  "lipcu",
  "sierpniu",
  "wrześniu",
  "październiku",
  "listopadzie",
  "grudniu",
];

/** „sierpniu" — forma do wstawienia po „w". */
export function monthNameLocative(key: MonthKey): string {
  return MONTHS_PL_LOCATIVE[parseMonthKey(key).month - 1];
}

export const MONTH_NAMES_PL = MONTHS_PL;
export const MONTH_NAMES_PL_SHORT = MONTHS_PL_SHORT;
