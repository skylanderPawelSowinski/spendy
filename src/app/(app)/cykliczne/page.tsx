import { Suspense } from "react";

import { RecurringManager } from "@/components/recurring/recurring-manager";
import { RecurringSkeleton } from "@/components/skeletons";
import { getCategories, getRecurring, getSessionContext } from "@/lib/data";

export const metadata = { title: "Cykliczne" };

export default function RecurringPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cykliczne</h1>
        <p className="text-muted-foreground text-sm">
          Szablony, z których co miesiąc powstają gotowe wpisy. Kwotę w
          konkretnym miesiącu możesz potem poprawić na liście.
        </p>
      </div>

      <Suspense fallback={<RecurringSkeleton />}>
        <RecurringSection />
      </Suspense>
    </div>
  );
}

async function RecurringSection() {
  const { household } = await getSessionContext();
  const [recurring, categories] = await Promise.all([
    getRecurring(household.id),
    getCategories(household.id),
  ]);

  return (
    <RecurringManager
      expenses={recurring.expenses}
      incomes={recurring.incomes}
      categories={categories}
    />
  );
}
