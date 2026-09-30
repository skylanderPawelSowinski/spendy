import { AuthShell } from "@/components/auth/auth-shell";
import { ResetRequestForm } from "@/components/auth/reset-request-form";

export const metadata = { title: "Reset hasła" };

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Nie pamiętam hasła"
      description="Wyślemy link do ustawienia nowego hasła."
    >
      <ResetRequestForm />
    </AuthShell>
  );
}
