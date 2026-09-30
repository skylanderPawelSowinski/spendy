import Link from "next/link";
import { Wallet } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <Link
          href="/"
          className="flex flex-col items-center gap-3 text-center"
        >
          <span className="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-2xl">
            <Wallet className="size-6" aria-hidden />
          </span>
          <span>
            <span className="block text-2xl font-semibold tracking-tight">
              Budżet domowy
            </span>
            <span className="text-muted-foreground mt-1 block text-sm">
              Wspólne wydatki, przychody i podsumowanie każdego miesiąca.
            </span>
          </span>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>

        {footer}
      </div>
    </main>
  );
}
