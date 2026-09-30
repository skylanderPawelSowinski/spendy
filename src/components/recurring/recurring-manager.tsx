"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Plus,
  Trash2,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { RecurringForm } from "@/components/recurring/recurring-form";
import { useActionForm } from "@/components/forms/use-action-form";
import {
  deleteRecurringExpense,
  deleteRecurringIncome,
  setRecurringExpenseActive,
  setRecurringIncomeActive,
} from "@/lib/actions/recurring";
import { formatMoney } from "@/lib/format";
import { monthLabel } from "@/lib/month";
import { CategoryAvatar } from "@/components/categories/category-avatar";
import type { CategoryRow, RecurringIncomeRow } from "@/lib/supabase/types";
import type { RecurringExpenseWithCategory } from "@/lib/data";
import { cn } from "cn";

type Template = RecurringExpenseWithCategory | RecurringIncomeRow;
type Kind = "expense" | "income";

export function RecurringManager({
  expenses,
  incomes,
  categories,
}: {
  expenses: RecurringExpenseWithCategory[];
  incomes: RecurringIncomeRow[];
  categories: CategoryRow[];
}) {
  const [adding, setAdding] = useState<Kind | null>(null);
  const [editing, setEditing] = useState<{ kind: Kind; item: Template } | null>(
    null,
  );
  const [deleting, setDeleting] = useState<{ kind: Kind; item: Template } | null>(
    null,
  );

  const monthlyExpenses = expenses
    .filter((e) => e.active)
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const monthlyIncomes = incomes
    .filter((i) => i.active)
    .reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <>
      <Tabs defaultValue="expenses">
        <TabsList className="w-full">
          <TabsTrigger value="expenses" className="flex-1">
            Wydatki
          </TabsTrigger>
          <TabsTrigger value="incomes" className="flex-1">
            Przychody
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Stałe wydatki</CardTitle>
              <CardDescription>
                {monthlyExpenses > 0
                  ? `${formatMoney(monthlyExpenses)} miesięcznie`
                  : "Czynsz, abonamenty, raty — dodaj raz, doliczą się same."}
              </CardDescription>
              <CardAction>
                <Button size="sm" onClick={() => setAdding("expense")}>
                  <Plus className="size-4" aria-hidden />
                  Dodaj
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <Empty />
              ) : (
                <ul className="-mx-2">
                  {expenses.map((item) => (
                    <Row
                      key={item.id}
                      kind="expense"
                      item={item}
                      color={item.category?.color ?? "slate"}
                      icon={item.category?.icon}
                      subtitle={item.category?.name ?? "Bez kategorii"}
                      onEdit={() => setEditing({ kind: "expense", item })}
                      onDelete={() => setDeleting({ kind: "expense", item })}
                    />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incomes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Stałe przychody</CardTitle>
              <CardDescription>
                {monthlyIncomes > 0
                  ? `${formatMoney(monthlyIncomes)} miesięcznie`
                  : "Wypłaty i inne regularne wpływy."}
              </CardDescription>
              <CardAction>
                <Button size="sm" onClick={() => setAdding("income")}>
                  <Plus className="size-4" aria-hidden />
                  Dodaj
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              {incomes.length === 0 ? (
                <Empty />
              ) : (
                <ul className="-mx-2">
                  {incomes.map((item) => (
                    <Row
                      key={item.id}
                      kind="income"
                      item={item}
                      onEdit={() => setEditing({ kind: "income", item })}
                      onDelete={() => setDeleting({ kind: "income", item })}
                    />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ResponsiveModal
        open={adding !== null}
        onOpenChange={(open) => !open && setAdding(null)}
        title={
          adding === "income" ? "Nowy stały przychód" : "Nowy wydatek cykliczny"
        }
        description="Pojawi się automatycznie w każdym miesiącu od wskazanej daty."
      >
        {adding ? (
          <RecurringForm
            kind={adding}
            categories={categories}
            onDone={() => setAdding(null)}
          />
        ) : null}
      </ResponsiveModal>

      <ResponsiveModal
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Edytuj szablon"
        description="Zmiana wpłynie na miesiące, które nie zostały jeszcze wygenerowane."
      >
        {editing ? (
          <RecurringForm
            key={editing.item.id}
            kind={editing.kind}
            categories={categories}
            template={editing.item}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </ResponsiveModal>

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Usunąć „${deleting?.item.name}”?`}
        description="Wpisy już dodane do poprzednich miesięcy zostaną — znika tylko szablon na przyszłość."
        action={
          deleting?.kind === "income"
            ? deleteRecurringIncome
            : deleteRecurringExpense
        }
        hidden={{ id: deleting?.item.id ?? "" }}
      />
    </>
  );
}

function Empty() {
  return (
    <p className="text-muted-foreground py-6 text-center text-sm">
      Nic tu jeszcze nie ma.
    </p>
  );
}

function Row({
  kind,
  item,
  color,
  icon,
  subtitle,
  onEdit,
  onDelete,
}: {
  kind: Kind;
  item: Template;
  color?: string;
  icon?: string | null;
  subtitle?: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { formAction } = useActionForm(
    kind === "income" ? setRecurringIncomeActive : setRecurringExpenseActive,
  );

  const range = [
    `${item.day_of_month}. dnia`,
    subtitle,
    item.end_month ? `do ${monthLabel(item.end_month.slice(0, 7))}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li
      className={cn(
        "hover:bg-accent/60 flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors",
        !item.active && "opacity-55",
      )}
    >
      {kind === "income" ? (
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
      ) : (
        <CategoryAvatar color={color ?? "slate"} icon={icon} />
      )}

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-sm font-medium">
          {item.name}
          {!item.active ? (
            <Badge variant="outline" className="shrink-0">
              wstrzymany
            </Badge>
          ) : null}
        </p>
        <p className="text-muted-foreground truncate text-xs">{range}</p>
      </div>

      <span className="shrink-0 text-base font-semibold tabular-nums">
        {formatMoney(item.amount)}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground -mr-1 size-8 shrink-0"
            aria-label={`Akcje dla ${item.name}`}
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil className="size-4" aria-hidden />
            Edytuj
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <form action={formAction}>
              <input type="hidden" name="id" value={item.id} />
              <input
                type="hidden"
                name="active"
                value={item.active ? "false" : "true"}
              />
              <button type="submit" className="w-full cursor-pointer">
                {item.active ? (
                  <>
                    <Pause className="size-4" aria-hidden />
                    Wstrzymaj
                  </>
                ) : (
                  <>
                    <Play className="size-4" aria-hidden />
                    Wznów
                  </>
                )}
              </button>
            </form>
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={onDelete}>
            <Trash2 className="size-4" aria-hidden />
            Usuń
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
