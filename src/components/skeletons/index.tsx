import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "cn";

/**
 * Skeletony są używane w dwóch miejscach: jako `loading.tsx` segmentu
 * i jako fallback `<Suspense>` wewnątrz strony. Dzięki wspólnym komponentom
 * przejście między jednym a drugim nie miga innym kształtem.
 */

function Rows({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("divide-y", className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 py-2.5">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-2.5 w-1/4" />
          </div>
          <Skeleton className="h-3.5 w-20 shrink-0" />
        </div>
      ))}
    </div>
  );
}

function CardShell({
  children,
  titleWidth = "w-40",
}: {
  children: React.ReactNode;
  titleWidth?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className={cn("h-4", titleWidth)} />
        <Skeleton className="h-3 w-3/5" />
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/**
 * Szkielet nagłówka jest ciemny tak samo jak sam nagłówek — inaczej karta
 * zmieniałaby kolor w momencie dojścia danych i całe przejście rzucałoby się
 * w oczy mocniej niż pojawienie się treści.
 */
export function HeroSkeleton() {
  return (
    <Card className="bg-ink">
      <CardContent className="space-y-5">
        <div className="flex items-start justify-between">
          <Skeleton className="bg-ink-track h-7 w-24 rounded-full" />
          <Skeleton className="bg-ink-track h-8 w-32 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="bg-ink-track h-11 w-56" />
          <Skeleton className="bg-ink-track h-4 w-44" />
        </div>
        <div className="space-y-2">
          <Skeleton className="bg-ink-track h-2.5 w-full rounded-full" />
          <div className="flex justify-between">
            <Skeleton className="bg-ink-track h-3 w-36" />
            <Skeleton className="bg-ink-track h-3 w-10" />
          </div>
        </div>
        <div className="flex items-end gap-1.5">
          {[45, 70, 55, 85, 60, 100].map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-24 w-full items-end">
                <Skeleton
                  className="bg-ink-track w-full rounded-t-md"
                  style={{ height: `${h}%` }}
                />
              </div>
              <Skeleton className="bg-ink-track h-3 w-6" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatRowSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <CardContent className="flex flex-col items-center gap-2 px-2">
            <Skeleton className="size-14 rounded-full" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-4 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function BreakdownSkeleton() {
  return (
    <CardShell>
      <div className="space-y-5">
        <div className="flex justify-center">
          <Skeleton className="size-52 rounded-full" />
        </div>
        <Rows count={5} />
      </div>
    </CardShell>
  );
}

export function ChartSkeleton({ height = "h-56" }: { height?: string }) {
  return (
    <CardShell>
      <Skeleton className={cn("w-full rounded-lg", height)} />
    </CardShell>
  );
}

export function ListCardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <CardShell>
      <Rows count={rows} />
    </CardShell>
  );
}

export function QuickActionsSkeleton() {
  return (
    <div className="-mx-4 flex gap-2 overflow-hidden px-4">
      {[132, 108, 112, 128].map((w, i) => (
        <Skeleton
          key={i}
          className="h-11 shrink-0 rounded-full"
          style={{ width: w }}
        />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-3">
      <HeroSkeleton />
      <QuickActionsSkeleton />
      <StatRowSkeleton />
      <BreakdownSkeleton />
      <ChartSkeleton height="h-48" />
      <ListCardSkeleton rows={3} />
      <ListCardSkeleton rows={5} />
    </div>
  );
}

export function MonthHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between gap-2">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-8 w-32 rounded-full" />
    </div>
  );
}

export function ExpensesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[64, 88, 72, 80].map((w, i) => (
          <Skeleton key={i} className="h-8 rounded-full" style={{ width: w }} />
        ))}
      </div>
      <div className="flex items-baseline justify-between">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-5 w-28" />
      </div>
      <ListCardSkeleton rows={4} />
      <ListCardSkeleton rows={3} />
    </div>
  );
}

export function RecurringSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-full rounded-lg" />
      <ListCardSkeleton rows={4} />
    </div>
  );
}

export function CategoriesSkeleton() {
  return <ListCardSkeleton rows={8} />;
}

export function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      <ListCardSkeleton rows={2} />
      <CardShell titleWidth="w-28">
        <div className="max-w-sm space-y-3">
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </CardShell>
      <CardShell titleWidth="w-32">
        <div className="max-w-sm space-y-2">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      </CardShell>
    </div>
  );
}

export function TopBarSkeleton() {
  return (
    <div className="flex h-14 items-center gap-2 px-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="ml-auto size-8 rounded-full" />
    </div>
  );
}
