import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { CartDrawer } from "@/components/features/cart/CartDrawer";
import { BottomNav } from "@/components/layout/BottomNav";
import { WhatsAppFloating } from "@/components/ui/WhatsAppFloating";
import { ThemeInitializer } from "@/components/layout/ThemeInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Importadora Martin Store | Catálogo Digital",
  description: "Encuentra los mejores productos industriales y herramientas en nuestro catálogo digital. Pedidos rápidos por WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground custom-scrollbar">
        <ThemeInitializer />
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
        <CartDrawer />
        <BottomNav />
        <WhatsAppFloating />
      </body>
    </html>
  );
}
