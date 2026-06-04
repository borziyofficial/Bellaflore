import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BellaFlore — Премиальная доставка цветов",
  description: "Премиальная доставка цветов для особых моментов",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
