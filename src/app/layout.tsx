import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

/**
 * Inter — font ekranowy o otwartych kształtach i wysokiej x-height, z pełnym
 * zestawem polskich znaków (latin-ext) i cyframi tabularnymi, których używamy
 * w każdej kolumnie kwot.
 *
 * Zmienna nazywa się `--font-inter`, a nie `--font-sans`: token motywu
 * `--font-sans` w globals.css wskazuje na nią i dokłada stos zapasowy.
 * Nazwanie obu tak samo dawało odwołanie kołowe i font w ogóle się nie stosował.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Budżet domowy",
    template: "%s · Budżet domowy",
  },
  description: "Wspólne śledzenie wydatków i przychodów w budżecie domowym.",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Budżet" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "light",
  themeColor: "#f7f7f5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster position="top-center" richColors theme="light" />
      </body>
    </html>
  );
}
