"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Field } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { useActionForm } from "@/components/forms/use-action-form";
import { leaveHousehold, renameHousehold } from "@/lib/actions/households";

export function HouseholdCard({
  householdId,
  householdName,
  memberCount,
}: {
  householdId: string;
  householdName: string;
  memberCount: number;
}) {
  const [leaving, setLeaving] = useState(false);
  const { formAction, fieldErrors } = useActionForm(renameHousehold);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Przestrzeń</CardTitle>
          <CardDescription>
            Nazwa widoczna dla wszystkich osób w tej przestrzeni.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form action={formAction} className="flex items-end gap-2">
            <input type="hidden" name="id" value={householdId} />
            <Field label="Nazwa" error={fieldErrors.name} className="flex-1">
              {(props) => (
                <Input
                  {...props}
                  name="name"
                  maxLength={60}
                  defaultValue={householdName}
                  required
                />
              )}
            </Field>
            <SubmitButton variant="outline" pendingLabel="Zapisuję…">
              Zapisz
            </SubmitButton>
          </form>

          <div className="border-t pt-4">
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => setLeaving(true)}
            >
              <LogOut className="size-4" aria-hidden />
              Opuść przestrzeń
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={leaving}
        onOpenChange={setLeaving}
        title={`Opuścić „${householdName}”?`}
        description={
          memberCount > 1
            ? "Stracisz dostęp do tych wydatków. Pozostałe osoby zachowają swoje."
            : "Jesteś tu jedyną osobą — przestrzeń zostanie usunięta razem ze " +
              "wszystkimi wydatkami, przychodami i kategoriami. Tego nie da się cofnąć."
        }
        confirmLabel="Opuść"
        action={leaveHousehold}
        hidden={{ id: householdId }}
      />
    </>
  );
}
