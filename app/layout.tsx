import type { Metadata, Viewport } from "next";
import Script from "next/script";
import TelegramInit from "@/frontend/components/TelegramInit";
import "./globals.css";

export const metadata: Metadata = {
  title: "Дневник БНТУ",
  description: "Электронный дневник БНТУ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className="font-sans">
        <TelegramInit />
        {children}
      </body>
    </html>
  );
}
