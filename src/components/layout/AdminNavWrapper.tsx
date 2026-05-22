"use client";

import React from "react";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Aplica padding inferior al contenido de las páginas SOLO cuando el
 * administrador está autenticado (para que el BottomNav no tape el contenido).
 * Los clientes no ven el BottomNav, por lo que no necesitan ese padding.
 */
export function AdminNavWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  return (
    <main className={`flex-1 ${isAuthenticated ? "pb-20 md:pb-0" : ""}`}>
      {children}
    </main>
  );
}
