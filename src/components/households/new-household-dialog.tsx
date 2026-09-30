"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { useActionForm } from "@/components/forms/use-action-form";
import { createHousehold } from "@/lib/actions/households";

export function NewHouseholdDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { formAction, fieldErrors } = useActionForm(createHousehold, {
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Nowa przestrzeń domowa</DialogTitle>
            <DialogDescription>
              Osobny budżet z własnymi kategoriami i osobami. Dostaniesz zestaw
              domyślnych kategorii na start.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Field label="Nazwa" error={fieldErrors.name}>
              {(props) => (
                <Input
                  {...props}
                  name="name"
                  placeholder="np. Mieszkanie na Woli"
                  maxLength={60}
                  autoFocus
                  required
                />
              )}
            </Field>
          </div>

          <DialogFooter>
            <SubmitButton className="w-full sm:w-auto" pendingLabel="Tworzę…">
              Utwórz
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
