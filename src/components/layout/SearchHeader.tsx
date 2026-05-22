"use client";

import React from "react";
import { Search, ShoppingBag, ChevronLeft } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export function SearchHeader() {
  const { getItemCount } = useCartStore();
  const itemCount = getItemCount();

  return (
    <header className="sticky top-0 z-40 bg-white/80 px-6 py-4 backdrop-blur-md">
      <div className="flex items-center gap-4">
        {/* Back Button */}
        <Link href="/" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 border border-border text-foreground transition-all hover:bg-zinc-100 hover:text-black active:scale-95 shadow-sm">
          <ChevronLeft size={24} />
        </Link>

        {/* Cart Icon */}
        <Link href="/cart" className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 border border-border text-foreground transition-all active:scale-95 shadow-sm">
          <ShoppingBag size={24} />
          <AnimatePresence>
            {itemCount > 0 && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black text-[11px] font-black text-white ring-2 ring-white"
              >
                {itemCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* Search Bar */}
        <div className="flex flex-1 items-center gap-3 rounded-2xl bg-zinc-50 border border-border px-4 py-3 shadow-sm transition-all focus-within:border-black focus-within:ring-1 focus-within:ring-black/5">
          <Search size={18} className="text-muted" />
          <input
            type="text"
            placeholder="Buscar en el catálogo..."
            className="w-full bg-transparent text-sm text-foreground placeholder-muted outline-none"
          />
        </div>
      </div>
    </header>
  );
}
