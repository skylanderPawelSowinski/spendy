/**
 * Jedyna dozwolona domena adresu e-mail.
 * Ta sama reguła siedzi w triggerze na `auth.users`
 * (supabase/migrations/0002_gmail_only.sql) — tu chodzi o czytelny komunikat,
 * tam o to, żeby nie dało się jej obejść.
 */
export const ALLOWED_EMAIL_DOMAIN = "gmail.com";
