import { Suspense } from "react";

import { CategoryManager } from "@/components/categories/category-manager";
import { CategoriesSkeleton } from "@/components/skeletons";
import { getCategories, getCategoryUsage, getSessionContext } from "@/lib/data";

export const metadata = { title: "Kategorie" };

export default function CategoriesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kategorie</h1>
        <p className="text-muted-foreground text-sm">
          Wspólne dla całej przestrzeni.
        </p>
      </div>

      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesSection />
      </Suspense>
    </div>
  );
}

async function CategoriesSection() {
  const { household } = await getSessionContext();
  const [categories, usage] = await Promise.all([
    getCategories(household.id),
    getCategoryUsage(household.id),
  ]);

  return <CategoryManager categories={categories} usage={usage} />;
}
