import { AddExpenseButton } from "@/components/expenses/add-expense-button";
import { getCategories, getSessionContext } from "@/lib/data";

/**
 * Przycisk dodawania wydatku dostępny z każdej strony — siada w wycięciu
 * dolnej nawigacji, więc wycięcie nigdy nie zieje pustką.
 */
export async function GlobalAddExpense() {
  const { household } = await getSessionContext();
  const categories = await getCategories(household.id);

  return <AddExpenseButton categories={categories} variant="fab" />;
}
