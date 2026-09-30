"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { Label } from "@/components/ui/label";
import {
  PALETTE_SLOTS,
  SLOT_LABELS,
  slotColor,
  type PaletteSlot,
} from "@/lib/palette";
import { cn } from "cn";

/**
 * Wybór ze stałej palety zamiast dowolnego heksa — gwarantuje czytelność
 * kolorów obok siebie na wykresach i w trybie ciemnym.
 */
export function ColorPicker({
  name = "color",
  defaultValue = "slate",
}: {
  name?: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState<PaletteSlot>(
    (PALETTE_SLOTS as readonly string[]).includes(defaultValue)
      ? (defaultValue as PaletteSlot)
      : "slate",
  );

  return (
    <div className="space-y-1.5">
      <Label>Kolor</Label>
      <input type="hidden" name={name} value={value} />
      <div role="radiogroup" aria-label="Kolor kategorii" className="flex flex-wrap gap-2">
        {PALETTE_SLOTS.map((slot) => {
          const selected = slot === value;
          return (
            <button
              key={slot}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={SLOT_LABELS[slot]}
              onClick={() => setValue(slot)}
              className={cn(
                "flex size-9 items-center justify-center rounded-lg transition-transform",
                selected
                  ? "ring-foreground ring-2 ring-offset-2 ring-offset-[var(--card)]"
                  : "hover:scale-105",
              )}
              style={{ backgroundColor: slotColor(slot) }}
            >
              {selected ? (
                <Check className="size-4 text-white drop-shadow" aria-hidden />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
