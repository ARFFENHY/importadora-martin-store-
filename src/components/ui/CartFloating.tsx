"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";

export function CartFloating() {
  const pathname = usePathname();
  const router = useRouter();
  const { getItemCount } = useCartStore();
  const count = getItemCount();

  // Show Cart floating icon only on storefront catalog and product details pages
  const showCart =
    pathname.startsWith("/catalogo") ||
    pathname.startsWith("/product");

  if (!showCart) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => router.push("/cart")}
        className="fixed bottom-[10.5rem] right-6 z-[100] flex h-16 w-16 items-center justify-center rounded-full bg-black text-white shadow-lg shadow-black/35 md:bottom-28 cursor-pointer"
        aria-label="Ver Carrito"
      >
        <ShoppingCart size={26} className="text-white relative z-10" />
        
        {/* Item count badge */}
        {count > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-white border-2 border-white shadow-md z-20"
          >
            {count}
          </motion.span>
        )}
        
        {/* Glow Ring Effect if cart has items */}
        {count > 0 && (
          <motion.span
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-black pointer-events-none z-0"
          />
        )}
      </motion.button>
    </AnimatePresence>
  );
}
