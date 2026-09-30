import { TopBar } from "@/components/app-shell/top-bar";
import { getSessionContext } from "@/lib/data";

/** Część paska zależna od danych — trzymana osobno, żeby dało się ją streamować. */
export async function TopBarData() {
  const session = await getSessionContext();

  return (
    <TopBar
      households={session.households}
      activeHouseholdId={session.household.id}
      fullName={session.fullName}
      email={session.email}
      avatarUrl={session.avatarUrl}
    />
  );
}
