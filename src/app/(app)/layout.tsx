import { Suspense } from "react";

import { BottomNav } from "@/components/app-shell/bottom-nav";
import { TopBarData } from "@/components/app-shell/top-bar-data";
import { GlobalAddExpense } from "@/components/expenses/global-add-expense";
import { TopBarSkeleton } from "@/components/skeletons";

/**
 * Layout jest synchroniczny — dzięki temu ramka (pasek, nawigacja dolna)
 * pojawia się natychmiast, a dane paska dociągają się w tle.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="bg-card/95 pt-safe sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto w-full max-w-5xl">
          <Suspense fallback={<TopBarSkeleton />}>
            <TopBarData />
          </Suspense>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-28 md:pb-10">
        {children}
      </main>

      <BottomNav />

      <Suspense fallback={null}>
        <GlobalAddExpense />
      </Suspense>
    </div>
  );
}
