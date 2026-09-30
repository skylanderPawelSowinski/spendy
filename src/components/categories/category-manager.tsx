"use client";

import { useState } from "react";
import { Eye, EyeOff, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { ColorPicker } from "@/components/categories/color-picker";
import { Field } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { useActionForm } from "@/components/forms/use-action-form";
import {
  createCategory,
  deleteCategory,
  setCategoryArchived,
  updateCategory,
} from "@/lib/actions/categories";
import { CategoryAvatar } from "@/components/categories/category-avatar";
import type { CategoryRow } from "@/lib/supabase/types";

export function CategoryManager({
  categories,
  usage,
}: {
  categories: CategoryRow[];
  usage: Record<string, number>;
}) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [deleting, setDeleting] = useState<CategoryRow | null>(null);

  const visible = categories.filter((c) => !c.archived);
  const archived = categories.filter((c) => c.archived);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Kategorie</CardTitle>
          <CardDescription>
            Przypisujesz je do wydatków — z nich powstaje podział na pulpicie.
          </CardDescription>
          <CardAction>
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus className="size-4" aria-hidden />
              Dodaj
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          <ul className="-mx-2">
            {visible.map((category) => (
              <Row
                key={category.id}
                category={category}
                used={usage[category.id] ?? 0}
                onEdit={() => setEditing(category)}
                onDelete={() => setDeleting(category)}
              />
            ))}
          </ul>
        </CardContent>
      </Card>

      {archived.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ukryte</CardTitle>
            <CardDescription>
              Nie pojawiają się przy dodawaniu wydatku, ale stare wpisy je
              zachowują.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="-mx-2">
              {archived.map((category) => (
                <Row
                  key={category.id}
                  category={category}
                  used={usage[category.id] ?? 0}
                  onEdit={() => setEditing(category)}
                  onDelete={() => setDeleting(category)}
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <ResponsiveModal
        open={adding}
        onOpenChange={setAdding}
        title="Nowa kategoria"
      >
        {adding ? <CategoryForm onDone={() => setAdding(false)} /> : null}
      </ResponsiveModal>

      <ResponsiveModal
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Edytuj kategorię"
      >
        {editing ? (
          <CategoryForm
            key={editing.id}
            category={editing}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </ResponsiveModal>

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Usunąć kategorię „${deleting?.name}”?`}
        description={
          (usage[deleting?.id ?? ""] ?? 0) > 0
            ? `${usage[deleting!.id]} wydatków straci przypisanie, ale zostanie ` +
              "na liście i w sumach. Jeśli chcesz zachować historię, ukryj " +
              "kategorię zamiast usuwać."
            : "Tej operacji nie da się cofnąć."
        }
        action={deleteCategory}
        hidden={{ id: deleting?.id ?? "" }}
      />
    </>
  );
}

function Row({
  category,
  used,
  onEdit,
  onDelete,
}: {
  category: CategoryRow;
  used: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { formAction } = useActionForm(setCategoryArchived);

  return (
    <li className="hover:bg-accent/60 flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors">
      <CategoryAvatar color={category.color} icon={category.icon} />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {category.name}
      </span>
      {used > 0 ? (
        <Badge variant="secondary" className="tabular-nums">
          {used}
        </Badge>
      ) : null}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground -mr-1 size-8 shrink-0"
            aria-label={`Akcje dla kategorii ${category.name}`}
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
              <input type="hidden" name="id" value={category.id} />
              <input
                type="hidden"
                name="archived"
                value={category.archived ? "false" : "true"}
              />
              <button type="submit" className="w-full cursor-pointer">
                {category.archived ? (
                  <>
                    <Eye className="size-4" aria-hidden />
                    Przywróć
                  </>
                ) : (
                  <>
                    <EyeOff className="size-4" aria-hidden />
                    Ukryj
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

function CategoryForm({
  category,
  onDone,
}: {
  category?: CategoryRow;
  onDone: () => void;
}) {
  const { formAction, fieldErrors } = useActionForm(
    category ? updateCategory : createCategory,
    { onSuccess: onDone },
  );

  return (
    <form action={formAction} className="space-y-4">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}

      <Field label="Nazwa" error={fieldErrors.name}>
        {(props) => (
          <Input
            {...props}
            name="name"
            maxLength={40}
            autoComplete="off"
            placeholder="np. Zwierzaki"
            defaultValue={category?.name ?? ""}
            autoFocus
            required
          />
        )}
      </Field>

      <ColorPicker defaultValue={category?.color ?? "slate"} />

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onDone}
        >
          Anuluj
        </Button>
        <SubmitButton className="flex-1" pendingLabel="Zapisuję…">
          {category ? "Zapisz" : "Dodaj"}
        </SubmitButton>
      </div>
    </form>
  );
}
