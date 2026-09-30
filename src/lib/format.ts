const MONEY = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number | string | null | undefined) {
  return MONEY.format(Number(value ?? 0));
}

/**
 * Etykieta osi — bez symbolu waluty, bo kontekst niesie tytuł karty,
 * a „10 tys. zł" nie mieści się w szerokości osi i ucina się w pół liczby.
 * Spacja przed „tys." jest nierozdzielająca, żeby etykieta nie łamała się
 * na dwie linie.
 */
export function formatAxisAmount(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1000) {
    const scaled = value / 1000;
    return `${new Intl.NumberFormat("pl-PL", {
      maximumFractionDigits: scaled % 1 === 0 ? 0 : 1,
    }).format(scaled)} tys.`;
  }
  return new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(
    value,
  );
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("pl-PL", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

/** "2026-09-14" -> "14 wrz" */
export function formatDayShort(isoDate: string) {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "short",
  }).format(parseISODate(isoDate));
}

/** "2026-09-14" -> "poniedziałek, 14 września" (bez roku — jest w wyborze miesiąca) */
export function formatDayHeader(isoDate: string) {
  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(parseISODate(isoDate));
}

/** "2026-09-14" -> "14 września 2026" */
export function formatDateLong(isoDate: string) {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseISODate(isoDate));
}

/** Parsuje YYYY-MM-DD jako datę lokalną (bez przesunięcia strefy). */
export function parseISODate(isoDate: string) {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
