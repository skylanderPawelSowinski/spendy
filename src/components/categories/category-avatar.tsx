import {
  Baby,
  Car,
  CircleDashed,
  HeartPulse,
  House,
  PartyPopper,
  PiggyBank,
  Receipt,
  ShoppingBag,
  Utensils,
  type LucideIcon,
} from "lucide-react";

import { slotColor } from "@/lib/palette";
import { cn } from "cn";

const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  house: House,
  car: Car,
  receipt: Receipt,
  "party-popper": PartyPopper,
  "heart-pulse": HeartPulse,
  "piggy-bank": PiggyBank,
  "shopping-bag": ShoppingBag,
  baby: Baby,
  "circle-dashed": CircleDashed,
};

export const CATEGORY_ICON_NAMES = Object.keys(ICONS);

/**
 * Okrągła plakietka kategorii — ikona w kolorze kategorii na jego własnym,
 * mocno rozrzedzonym tle. Kolor nigdy nie niesie znaczenia sam: obok zawsze
 * stoi nazwa kategorii albo opis wydatku.
 */
export function CategoryAvatar({
  color,
  icon,
  size = "default",
  className,
}: {
  color: string | null | undefined;
  icon?: string | null;
  size?: "default" | "sm";
  className?: string;
}) {
  const Icon = (icon && ICONS[icon]) || CircleDashed;
  const hex = slotColor(color);

  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        size === "sm" ? "size-8" : "size-10",
        className,
      )}
      style={{ backgroundColor: `color-mix(in oklab, ${hex} 14%, transparent)` }}
    >
      <Icon
        className={size === "sm" ? "size-4" : "size-[1.125rem]"}
        style={{ color: hex }}
      />
    </span>
  );
}
