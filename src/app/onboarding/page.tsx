import { Home } from "lucide-react";

import { NewHouseholdForm } from "@/components/households/new-household-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Zaczynamy" };

/**
 * Awaryjne wejście, gdy użytkownik nie ma żadnej przestrzeni — normalnie
 * `bootstrap_user()` tworzy pierwszą automatycznie przy logowaniu.
 */
export default function OnboardingPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="bg-secondary mb-2 flex size-11 items-center justify-center rounded-xl">
            <Home className="size-5" aria-hidden />
          </div>
          <CardTitle>Utwórz przestrzeń domową</CardTitle>
          <CardDescription>
            To wspólny budżet — możesz później zaprosić do niego inne osoby.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewHouseholdForm />
        </CardContent>
      </Card>
    </main>
  );
}
