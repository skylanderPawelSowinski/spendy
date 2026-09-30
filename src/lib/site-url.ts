import "server-only";

import { headers } from "next/headers";

/**
 * Bazowy adres aplikacji dla linków w mailach.
 * Zmienna środowiskowa wygrywa (produkcja), inaczej bierzemy z nagłówków —
 * dzięki temu dev działa niezależnie od portu, na którym wstał serwer.
 */
export async function getSiteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto =
    headerList.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");

  return `${proto}://${host}`;
}
