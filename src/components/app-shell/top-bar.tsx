"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { HouseholdSwitcher } from "@/components/app-shell/household-switcher";
import { NAV_ITEMS, isActivePath } from "@/components/app-shell/nav-items";
import { UserMenu } from "@/components/app-shell/user-menu";
import { cn } from "cn";

type Props = {
  households: { id: string; name: string }[];
  activeHouseholdId: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
};

export function TopBar({
  households,
  activeHouseholdId,
  fullName,
  email,
  avatarUrl,
}: Props) {
  const pathname = usePathname();

  return (
    <div className="flex h-14 items-center gap-2 px-4">
      <HouseholdSwitcher households={households} activeId={activeHouseholdId} />

      <nav aria-label="Sekcje" className="ml-4 hidden md:block">
        <ul className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(item.href, pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="ml-auto">
        <UserMenu fullName={fullName} email={email} avatarUrl={avatarUrl} />
      </div>
    </div>
  );
}
