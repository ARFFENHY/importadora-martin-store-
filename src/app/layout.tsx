import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { CartDrawer } from "@/components/features/cart/CartDrawer";
import { BottomNav } from "@/components/layout/BottomNav";
import { WhatsAppFloating } from "@/components/ui/WhatsAppFloating";
import { CartFloating } from "@/components/ui/CartFloating";
import { ThemeInitializer } from "@/components/layout/ThemeInitializer";
import { AdminNavWrapper } from "@/components/layout/AdminNavWrapper";
import { FirestoreSync } from "@/components/layout/FirestoreSync";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://importadora-martin-store.vercel.app'),
  title: "Importadora Martin Store | Catálogo Digital",
  description: "Encuentra los mejores productos industriales y herramientas en nuestro catálogo digital. Pedidos rápidos por WhatsApp.",
  openGraph: {
    title: "Importadora Martin Store | Catálogo Digital",
    description: "Encuentra los mejores productos industriales y herramientas en nuestro catálogo digital. Pedidos rápidos por WhatsApp.",
    siteName: "Importadora Martin Store",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 1200,
        alt: "Importadora Martin Store Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Importadora Martin Store | Catálogo Digital",
    description: "Encuentra los mejores productos industriales y herramientas en nuestro catálogo digital. Pedidos rápidos por WhatsApp.",
    images: ["/og-image.jpg"],
  },
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
        <FirestoreSync />
        <AdminNavWrapper>
          {children}
        </AdminNavWrapper>
        <CartDrawer />
        <BottomNav />
        <WhatsAppFloating />
        <CartFloating />
      </body>
    </html>
  );
}
