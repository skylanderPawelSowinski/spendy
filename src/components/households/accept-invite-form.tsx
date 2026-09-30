"use client";

import { SubmitButton } from "@/components/forms/submit-button";
import { useActionForm } from "@/components/forms/use-action-form";
import { acceptInvite } from "@/lib/actions/households";

export function AcceptInviteForm({ token }: { token: string }) {
  const { formAction } = useActionForm(acceptInvite);

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />
      <SubmitButton size="lg" className="w-full" pendingLabel="Dołączam…">
        Dołącz do przestrzeni
      </SubmitButton>
    </form>
  );
}
