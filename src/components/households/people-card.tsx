"use client";

import { useState } from "react";
import { Check, Copy, Link2, UserMinus, X } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { createInvite, removeMember, revokeInvite } from "@/lib/actions/households";
import { ALLOWED_EMAIL_DOMAIN } from "@/lib/auth-config";
import type {
  HouseholdInviteRow,
  HouseholdMemberView,
} from "@/lib/supabase/types";

type Props = {
  householdId: string;
  householdName: string;
  currentUserId: string;
  members: HouseholdMemberView[];
  invites: HouseholdInviteRow[];
};

export function PeopleCard({
  householdId,
  householdName,
  currentUserId,
  members,
  invites,
}: Props) {
  const [removing, setRemoving] = useState<HouseholdMemberView | null>(null);
  const { formAction, fieldErrors } = useActionForm(createInvite);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Osoby w przestrzeni</CardTitle>
          <CardDescription>
            Każdy widzi i edytuje wszystko w {householdName} — nie ma osobnych
            uprawnień.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <ul className="divide-y">
            {members.map((member) => (
              <li key={member.user_id} className="flex items-center gap-3 py-2.5">
                <Avatar className="size-8">
                  {member.avatar_url ? (
                    <AvatarImage src={member.avatar_url} alt="" />
                  ) : null}
                  <AvatarFallback className="text-xs">
                    {(member.full_name ?? member.email ?? "?")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {member.full_name ?? member.email ?? "Użytkownik"}
                  </p>
                  {member.email && member.full_name ? (
                    <p className="text-muted-foreground truncate text-xs">
                      {member.email}
                    </p>
                  ) : null}
                </div>

                {member.user_id === currentUserId ? (
                  <Badge variant="secondary">to Ty</Badge>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground size-8"
                    aria-label={`Usuń ${member.full_name ?? member.email ?? "osobę"}`}
                    onClick={() => setRemoving(member)}
                  >
                    <UserMinus className="size-4" aria-hidden />
                  </Button>
                )}
              </li>
            ))}
          </ul>

          <div className="space-y-3 border-t pt-4">
            <div>
              <h3 className="text-sm font-medium">Zaproś kogoś</h3>
              <p className="text-muted-foreground text-xs">
                Wygenerujemy link ważny 14 dni. Osoba zakłada konto na adres
                @{ALLOWED_EMAIL_DOMAIN} i od razu ma pełny dostęp.
              </p>
            </div>

            <form action={formAction} className="flex items-end gap-2">
              <Field
                label="E-mail (opcjonalnie)"
                error={fieldErrors.email}
                className="flex-1"
              >
                {(props) => (
                  <Input
                    {...props}
                    name="email"
                    type="email"
                    autoComplete="off"
                    placeholder={`ktos@${ALLOWED_EMAIL_DOMAIN}`}
                  />
                )}
              </Field>
              <SubmitButton variant="outline" pendingLabel="Tworzę…">
                <Link2 className="size-4" aria-hidden />
                Utwórz link
              </SubmitButton>
            </form>

            {invites.length > 0 ? (
              <ul className="space-y-2">
                {invites.map((invite) => (
                  <InviteRow key={invite.id} invite={invite} />
                ))}
              </ul>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Usunąć ${removing?.full_name ?? removing?.email ?? "tę osobę"}?`}
        description="Straci dostęp do tej przestrzeni. Dodane przez nią wpisy zostaną."
        confirmLabel="Usuń z przestrzeni"
        action={removeMember}
        hidden={{
          household_id: householdId,
          user_id: removing?.user_id ?? "",
        }}
      />
    </>
  );
}

function InviteRow({ invite }: { invite: HouseholdInviteRow }) {
  const [copied, setCopied] = useState(false);
  const { formAction } = useActionForm(revokeInvite);

  async function copy() {
    const url = `${window.location.origin}/invite/${invite.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Skopiowano link zaproszenia");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Nie udało się skopiować", { description: url });
    }
  }

  return (
    <li className="bg-muted/50 flex items-center gap-2 rounded-lg px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">
          {invite.email ?? "Link zaproszenia"}
        </p>
        <p className="text-muted-foreground text-xs">
          Ważny do{" "}
          {new Intl.DateTimeFormat("pl-PL", {
            day: "numeric",
            month: "long",
          }).format(new Date(invite.expires_at))}
        </p>
      </div>

      <Button variant="ghost" size="sm" onClick={copy}>
        {copied ? (
          <Check className="size-4" aria-hidden />
        ) : (
          <Copy className="size-4" aria-hidden />
        )}
        Kopiuj
      </Button>

      <form action={formAction}>
        <input type="hidden" name="id" value={invite.id} />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="text-muted-foreground size-8"
          aria-label="Anuluj zaproszenie"
        >
          <X className="size-4" aria-hidden />
        </Button>
      </form>
    </li>
  );
}
