"use client";

import React from "react";
import { X, ShoppingBag, Trash2, Plus, Minus, Send, ShoppingCart, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/useCartStore";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function CartDrawer() {
  const router = useRouter();
  const { isOpen, closeCart, items, updateQuantity, removeItem, getTotal, clearCart } = useCartStore();

  const handleCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer / Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[160] flex w-full max-w-md flex-col bg-white shadow-2xl md:rounded-l-[2rem]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
                  <ShoppingCart size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Mi Pedido</h2>
                  <p className="text-xs text-muted font-bold uppercase tracking-widest">{items.length} Artículos</p>
                </div>
              </div>
              <button
                onClick={closeCart}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-muted hover:text-foreground transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="mb-6 rounded-full bg-zinc-50 p-10 text-zinc-200">
                    <ShoppingBag size={80} strokeWidth={1} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Tu carrito está vacío</h3>
                  <p className="mt-2 text-sm text-muted max-w-[220px]">
                    Parece que aún no has agregado productos a tu pedido.
                  </p>
                  <button
                    onClick={closeCart}
                    className="mt-8 rounded-2xl bg-black px-10 py-4 text-sm font-bold text-white shadow-lg shadow-black/10 active:scale-95 transition-transform"
                  >
                    Empezar a comprar
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-4 rounded-3xl bg-white p-3 border border-border shadow-sm"
                    >
                      {/* Image */}
                      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-zinc-50 border border-border">
                        <Image
                          src={item.images[0]}
                          alt={item.name}
                          fill
                          className="object-contain p-2"
                          unoptimized
                        />
                      </div>

                      {/* Content */}
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="flex items-start justify-between">
                          <h4 className="line-clamp-2 text-sm font-bold text-foreground leading-snug pr-2">
                            {item.name}
                          </h4>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-zinc-300 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-base font-black text-amber-600">
                            {formatPrice(item.price)}
                          </span>
                          
                          {/* Quantity Selector */}
                          <div className="flex items-center gap-3 rounded-xl bg-zinc-50 border border-border p-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-foreground hover:bg-black hover:text-white transition-colors border border-border"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="min-w-[24px] text-center text-sm font-black text-foreground">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-foreground hover:bg-black hover:text-white transition-colors border border-border"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Checkout Footer */}
            {items.length > 0 && (
              <div className="border-t border-border bg-white p-6 shadow-[0_-20px_60px_rgba(0,0,0,0.05)]">
                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-between text-sm text-muted font-bold uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span>{formatPrice(getTotal())}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-green-600 font-bold uppercase tracking-widest">
                    <span>Envío</span>
                    <span>A convenir</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-dashed border-border">
                    <span className="text-lg font-black text-foreground uppercase tracking-tight">Total</span>
                    <span className="text-2xl font-black text-foreground">{formatPrice(getTotal())}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleCheckout}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-black py-5 text-sm font-bold text-white transition-all active:scale-95 hover:bg-zinc-800 shadow-lg shadow-black/10"
                  >
                    Continuar con el Pedido
                    <ArrowRight size={20} />
                  </button>
                  <button
                    onClick={clearCart}
                    className="py-2 text-xs font-bold text-muted hover:text-red-500 transition-colors uppercase tracking-widest"
                  >
                    Vaciar Carrito
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
