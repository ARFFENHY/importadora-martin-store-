"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, User, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";

const navItems = [
  { icon: Home, label: "Inicio", href: "/" },
  { icon: LayoutGrid, label: "Categorías", href: "/categorias" },
  { icon: Search, label: "Buscar", href: "/buscar" },
  { icon: ShoppingBag, label: "Carrito", href: "/cart", showBadge: true },
  { icon: User, label: "Perfil", href: "/perfil" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { getItemCount } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const itemCount = getItemCount();

  // Solo visible para el administrador autenticado
  if (!isAuthenticated) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="glass mx-4 mb-6 rounded-2xl px-2 py-3 shadow-premium">
        <ul className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex flex-col items-center gap-1 transition-colors duration-300",
                    isActive ? "text-black" : "text-muted hover:text-foreground"
                  )}
                >
                  <div className="relative">
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                    {item.showBadge && itemCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-black ring-2 ring-background"
                      >
                        {itemCount}
                      </motion.span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute -bottom-1 h-1 w-5 rounded-full bg-black"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
