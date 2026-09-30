"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Home, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NewHouseholdDialog } from "@/components/households/new-household-dialog";
import { switchHousehold } from "@/lib/actions/households";

type Household = { id: string; name: string };

export function HouseholdSwitcher({
  households,
  activeId,
}: {
  households: Household[];
  activeId: string;
}) {
  const [creating, setCreating] = useState(false);
  const active = households.find((h) => h.id === activeId);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="-ml-2 h-9 max-w-[60vw] gap-1.5 px-2 font-semibold"
          >
            <Home className="text-muted-foreground size-4 shrink-0" aria-hidden />
            <span className="truncate">{active?.name ?? "Przestrzeń"}</span>
            <ChevronsUpDown
              className="text-muted-foreground size-3.5 shrink-0"
              aria-hidden
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuLabel>Przestrzenie domowe</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {households.map((household) => (
            <form key={household.id} action={switchHousehold}>
              <input type="hidden" name="id" value={household.id} />
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full cursor-pointer">
                  <span className="truncate">{household.name}</span>
                  {household.id === activeId ? (
                    <Check className="ml-auto size-4" aria-hidden />
                  ) : null}
                </button>
              </DropdownMenuItem>
            </form>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden />
            Nowa przestrzeń
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <NewHouseholdDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}
