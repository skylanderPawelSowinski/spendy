import { ExpensesSkeleton, MonthHeaderSkeleton } from "@/components/skeletons";

export default function ExpensesLoading() {
  return (
    <div className="space-y-4">
      <MonthHeaderSkeleton />
      <ExpensesSkeleton />
    </div>
  );
}
