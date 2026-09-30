import { Suspense } from "react";

import { ChangePasswordCard } from "@/components/auth/change-password-card";
import { HouseholdCard } from "@/components/households/household-card";
import { PeopleCard } from "@/components/households/people-card";
import { SpendingLimitCard } from "@/components/households/spending-limit-card";
import { SettingsSkeleton } from "@/components/skeletons";
import { Reveal, STAGGER } from "@/components/motion/reveal";
import { getHouseholdPeople, getSessionContext } from "@/lib/data";

export const metadata = { title: "Ustawienia" };

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <Reveal>
        <h1 className="text-2xl font-semibold tracking-tight">Ustawienia</h1>
        <p className="text-muted-foreground text-sm">
          Osoby, próg wydatków i dane konta.
        </p>
      </Reveal>

      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsSection />
      </Suspense>
    </div>
  );
}

async function SettingsSection() {
  const session = await getSessionContext();
  const { members, invites } = await getHouseholdPeople(session.household.id);

  return (
    <>
      <Reveal delay={STAGGER}>
        <PeopleCard
          householdId={session.household.id}
          householdName={session.household.name}
          currentUserId={session.userId}
          members={members}
          invites={invites}
        />
      </Reveal>

      <Reveal delay={STAGGER * 2}>
        <SpendingLimitCard
          kind={session.household.spending_limit_kind}
          value={session.household.spending_limit_value}
        />
      </Reveal>

      <Reveal delay={STAGGER * 3}>
        <HouseholdCard
          householdId={session.household.id}
          householdName={session.household.name}
          memberCount={members.length}
        />
      </Reveal>

      <Reveal delay={STAGGER * 4}>
        <ChangePasswordCard email={session.email} />
      </Reveal>
    </>
  );
}
