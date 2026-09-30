import {
  LayoutDashboard,
  Receipt,
  RefreshCw,
  Settings,
  Tags,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Pulpit",
    shortLabel: "Pulpit",
    icon: LayoutDashboard,
  },
  {
    href: "/wydatki",
    label: "Wydatki",
    shortLabel: "Wydatki",
    icon: Receipt,
  },
  {
    href: "/cykliczne",
    label: "Cykliczne",
    shortLabel: "Cykliczne",
    icon: RefreshCw,
  },
  {
    href: "/kategorie",
    label: "Kategorie",
    shortLabel: "Kategorie",
    icon: Tags,
  },
  {
    href: "/ustawienia",
    label: "Ustawienia",
    shortLabel: "Więcej",
    icon: Settings,
  },
];

export function isActivePath(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
