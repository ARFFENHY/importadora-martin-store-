"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Product } from "@/types";
import { useCartStore } from "@/store/useCartStore";
import { useConfigStore } from "@/store/useConfigStore";
import { formatPrice } from "@/lib/utils";

function getContrastColor(hex: string | undefined) {
  if (!hex || hex.length < 6) return "#FFFFFF";
  const cleanHex = hex.replace("#", "");
  if (cleanHex.length !== 6 && cleanHex.length !== 3) return "#FFFFFF";
  const expandedHex = cleanHex.length === 3 
    ? cleanHex.split("").map(c => c + c).join("") 
    : cleanHex;
  const r = parseInt(expandedHex.substring(0, 2), 16);
  const g = parseInt(expandedHex.substring(2, 4), 16);
  const b = parseInt(expandedHex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#FFFFFF";
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, updateQuantity } = useCartStore();
  const { colors } = useConfigStore();
  const cartItem = items.find((item) => item.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const bgNew = colors.badgeNew || "#F59E0B";
  const bgFeatured = colors.badgeFeatured || "#18181B";
  const bgStock = colors.badgeStock || "#71717A";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-border p-3 transition-all duration-300 hover:shadow-premium"
    >
      <Link href={`/product/${product.id}`} className="flex flex-col gap-3">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden rounded-xl bg-white border border-border/50">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className={`object-cover transition-transform duration-500 group-hover:scale-110 ${product.stock === 0 ? "grayscale opacity-60" : ""}`}
            sizes="(max-width: 768px) 50vw, 33vw"
            unoptimized
          />
          
          {/* Badges */}
          <div className="absolute left-2 top-2 flex flex-col gap-1 z-10">
            {product.isNew && (
              <span 
                style={{ backgroundColor: bgNew, color: getContrastColor(bgNew) }}
                className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-sm"
              >
                Nuevo
              </span>
            )}
            {product.isFeatured && (
              <span 
                style={{ backgroundColor: bgFeatured, color: getContrastColor(bgFeatured) }}
                className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-sm"
              >
                Destacado
              </span>
            )}
            {product.discount && (
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-black text-white uppercase tracking-wider shadow-sm">
                -{product.discount}%
              </span>
            )}
            {product.stock === 0 ? (
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-black text-white uppercase tracking-wider shadow-sm">
                Sin Stock
              </span>
            ) : product.stock !== undefined ? (
              <span 
                style={{ backgroundColor: bgStock, color: getContrastColor(bgStock) }}
                className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-sm"
              >
                Stock: {product.stock}
              </span>
            ) : (
              <span 
                style={{ backgroundColor: bgStock, color: getContrastColor(bgStock) }}
                className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-sm"
              >
                Stock: Ilimitado
              </span>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted">
            {product.category}
          </span>
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground transition-colors">
            {product.name}
          </h3>
          
          <div className="mt-auto pt-2">
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-black">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-muted line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            {product.stock !== undefined && product.stock > 0 && product.stock <= 2 && (
              <p className="text-[10px] font-bold text-amber-600 mt-1">
                ¡Últimas {product.stock} unidades!
              </p>
            )}
          </div>
        </div>
      </Link>

      {/* Action Button / Quantity Selector */}
      <div className="mt-4">
        <AnimatePresence mode="wait">
          {product.stock === 0 ? (
            <button
              disabled
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 py-2.5 text-xs font-bold text-zinc-400 border border-zinc-200 cursor-not-allowed"
            >
              Sin Stock
            </button>
          ) : quantity === 0 ? (
            <motion.button
              key="add"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => addItem(product)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-2.5 text-xs font-bold text-white transition-all hover:bg-primary hover:text-black active:scale-95 shadow-sm"
            >
              <ShoppingCart size={16} />
              Agregar
            </motion.button>
          ) : (
            <motion.div
              key="quantity"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center justify-between rounded-xl bg-white border border-primary/20 p-1 shadow-sm"
            >
              <button
                onClick={() => updateQuantity(product.id, quantity - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-black transition-transform active:scale-90"
              >
                <Minus size={14} strokeWidth={3} />
              </button>
              <span className="text-sm font-bold text-foreground w-8 text-center">{quantity}</span>
              <button
                onClick={() => updateQuantity(product.id, quantity + 1)}
                disabled={product.stock !== undefined && quantity >= product.stock}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-black transition-transform active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                <Plus size={14} strokeWidth={3} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
