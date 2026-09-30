/**
 * Paleta kategorialna zwalidowana pod kątem daltonizmu na jasnym tle:
 * najgorsza para sąsiadująca CVD ΔE 9.1, normal-vision 19.6 (OKLab ×100).
 *
 * Kolejność slotów jest częścią tej walidacji — przestawienie jej albo
 * dorzucenie dziewiątego odcienia psuje gwarancję rozróżnialności.
 * Trzymamy slot, nie hex, żeby kolory dało się zmienić w jednym miejscu.
 */

export const PALETTE_SLOTS = [
  "blue",
  "orange",
  "aqua",
  "yellow",
  "magenta",
  "green",
  "violet",
  "red",
  "slate",
] as const;

export type PaletteSlot = (typeof PALETTE_SLOTS)[number];

export const SLOT_LABELS: Record<PaletteSlot, string> = {
  blue: "Niebieski",
  orange: "Pomarańczowy",
  aqua: "Morski",
  yellow: "Żółty",
  magenta: "Różowy",
  green: "Zielony",
  violet: "Fioletowy",
  red: "Czerwony",
  slate: "Szary",
};

export const SLOT_HEX: Record<PaletteSlot, string> = {
  blue: "#2a78d6",
  orange: "#eb6834",
  aqua: "#1baf7a",
  yellow: "#eda100",
  magenta: "#e87ba4",
  green: "#008300",
  violet: "#4a3aa7",
  red: "#e34948",
  slate: "#898781",
};

export function isPaletteSlot(value: unknown): value is PaletteSlot {
  return (
    typeof value === "string" &&
    (PALETTE_SLOTS as readonly string[]).includes(value)
  );
}

export function toSlot(value: string | null | undefined): PaletteSlot {
  return isPaletteSlot(value) ? value : "slate";
}

export function slotColor(value: string | null | undefined): string {
  return SLOT_HEX[toSlot(value)];
}

/** Slot dla n-tej serii bez przypisanej kategorii (bez zapętlania hue). */
export function slotForIndex(index: number): PaletteSlot {
  return PALETTE_SLOTS[Math.min(index, PALETTE_SLOTS.length - 1)];
}
