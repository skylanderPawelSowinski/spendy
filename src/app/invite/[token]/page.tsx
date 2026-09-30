import Link from "next/link";
import { redirect } from "next/navigation";
import { Home } from "lucide-react";

import { AcceptInviteForm } from "@/components/households/accept-invite-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Zaproszenie" };

const MESSAGES: Record<string, string> = {
  revoked: "To zaproszenie zostało anulowane. Poproś o nowy link.",
  accepted: "To zaproszenie zostało już wykorzystane.",
  expired: "To zaproszenie wygasło. Poproś o nowy link.",
};

export default async function InvitePage({
  params,
}: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);

  const { data } = await supabase.rpc("invite_preview", { p_token: token });
  const invite = data?.[0];

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="bg-secondary mb-2 flex size-11 items-center justify-center rounded-xl">
            <Home className="size-5" aria-hidden />
          </div>
          <CardTitle>
            {invite ? "Zaproszenie do przestrzeni" : "Nieprawidłowy link"}
          </CardTitle>
          <CardDescription>
            {invite
              ? `${invite.invited_by ?? "Ktoś"} zaprasza Cię do „${invite.household_name}”. ` +
                "Będziecie widzieć i edytować te same wydatki."
              : "Nie znaleźliśmy takiego zaproszenia. Sprawdź, czy link jest kompletny."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {invite?.status === "valid" ? (
            <AcceptInviteForm token={token} />
          ) : invite?.status === "already_member" ? (
            <p className="text-muted-foreground text-sm">
              Już należysz do tej przestrzeni.
            </p>
          ) : invite ? (
            <p className="text-muted-foreground text-sm">
              {MESSAGES[invite.status] ?? "Zaproszenie jest nieaktywne."}
            </p>
          ) : null}

          <Button asChild variant="ghost" className="w-full">
            <Link href="/">Przejdź do aplikacji</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
