"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { IncomeForm } from "@/components/incomes/income-form";
import { deleteIncome } from "@/lib/actions/incomes";
import { formatDayShort, formatMoney } from "@/lib/format";
import type { MonthKey } from "@/lib/month";
import type { IncomeRow } from "@/lib/supabase/types";

export function IncomesCard({
  incomes,
  month,
  total,
}: {
  incomes: IncomeRow[];
  month: MonthKey;
  total: number;
}) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<IncomeRow | null>(null);
  const [deleting, setDeleting] = useState<IncomeRow | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Przychody</CardTitle>
        <CardDescription>
          {incomes.length > 0
            ? `${formatMoney(total)} w tym miesiącu`
            : "Jeszcze nic nie wpłynęło"}
        </CardDescription>
        <CardAction>
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="size-4" aria-hidden />
            Dodaj
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        {incomes.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Stałe wpływy skonfigurujesz raz w zakładce{" "}
            <span className="font-medium">Cykliczne</span> — pojawią się tu
            automatycznie co miesiąc.
          </p>
        ) : (
          <ul className="-mx-2">
            {incomes.map((income) => (
              <li
                key={income.id}
                className="hover:bg-accent/60 flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors"
              >
                <span
                  aria-hidden
                  className="text-positive flex size-10 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor:
                      "color-mix(in oklab, var(--positive) 12%, transparent)",
                  }}
                >
                  <TrendingUp className="size-[1.125rem]" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {income.description ?? "Przychód"}
                  </p>
                  <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <span>{formatDayShort(income.received_on)}</span>
                    {income.recurring_income_id ? (
                      <>
                        <span aria-hidden>·</span>
                        <RefreshCw className="size-3" aria-hidden />
                        <span className="sr-only">Stały przychód</span>
                      </>
                    ) : null}
                  </p>
                </div>

                <span className="text-positive shrink-0 text-base font-semibold tabular-nums">
                  {formatMoney(income.amount)}
                </span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground -mr-1 size-8 shrink-0"
                      aria-label={`Akcje dla przychodu ${formatMoney(income.amount)}`}
                    >
                      <MoreHorizontal className="size-4" aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setEditing(income)}>
                      <Pencil className="size-4" aria-hidden />
                      Edytuj
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setDeleting(income)}
                    >
                      <Trash2 className="size-4" aria-hidden />
                      Usuń
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <ResponsiveModal
        open={adding}
        onOpenChange={setAdding}
        title="Dodatkowy przychód"
        description="Jednorazowy wpływ w tym miesiącu — premia, zwrot, sprzedaż."
      >
        {adding ? (
          <IncomeForm month={month} onDone={() => setAdding(false)} />
        ) : null}
      </ResponsiveModal>

      <ResponsiveModal
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Edytuj przychód"
      >
        {editing ? (
          <IncomeForm
            key={editing.id}
            month={month}
            income={editing}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </ResponsiveModal>

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Usunąć ten przychód?"
        description={
          deleting?.recurring_income_id
            ? "To pozycja ze stałego przychodu. Zniknie tylko z tego miesiąca."
            : "Tej operacji nie da się cofnąć."
        }
        action={deleteIncome}
        hidden={{ id: deleting?.id ?? "" }}
      />
    </Card>
  );
}
