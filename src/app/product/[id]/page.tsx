"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, Share2, Heart, ShieldCheck, Truck, ShoppingCart, Plus, Minus } from "lucide-react";
import { PRODUCTS as STATIC_PRODUCTS } from "@/data/products";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { useProductStore } from "@/store/useProductStore";

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { products } = useProductStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayProducts = mounted ? products : STATIC_PRODUCTS;
  const product = displayProducts.find((p) => p.id === params.id);
  
  const { addItem, updateQuantity, items } = useCartStore();
  const cartItem = items.find((item) => item.id === product?.id);
  const quantity = cartItem?.quantity || 0;

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">Producto no encontrado</h1>
        <button
          onClick={() => router.push("/")}
          className="mt-4 rounded-xl bg-black px-6 py-2 font-bold text-white shadow-sm"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-32 md:pb-10">
      {/* Top Navigation */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between p-6">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 backdrop-blur-md text-foreground border border-border shadow-sm"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex gap-2">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 backdrop-blur-md text-foreground border border-border shadow-sm">
            <Share2 size={20} />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 backdrop-blur-md text-foreground border border-border shadow-sm">
            <Heart size={20} />
          </button>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="relative aspect-square w-full overflow-hidden bg-white">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className={`object-contain p-8 ${product.stock === 0 ? "grayscale opacity-60" : ""}`}
          priority
          unoptimized
        />
        {product.isNew && (
          <div className="absolute bottom-6 left-6 rounded-full bg-black px-4 py-1 text-xs font-bold text-white uppercase tracking-wider">
            Nuevo Ingreso
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="relative -mt-8 rounded-t-[2.5rem] bg-white p-8 shadow-[0_-20px_60px_rgba(0,0,0,0.05)] border-t border-border">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
            {product.category}
          </span>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            {product.name}
          </h1>
          
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-3xl font-black text-foreground">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-muted line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            {product.discount && (
              <span className="rounded-lg bg-red-50 px-2 py-1 text-xs font-bold text-red-600">
                {product.discount}% OFF
              </span>
            )}
          </div>

          <div className="mt-3">
            {product.stock === 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600 border border-red-100">
                <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                Sin Stock
              </span>
            ) : product.stock !== undefined && product.stock <= 2 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600 border border-amber-100 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                ¡Últimas {product.stock} unidades disponibles!
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 border border-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Disponible
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mt-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Descripción</h3>
          <p className="mt-3 text-base leading-relaxed text-muted">
            {product.description}
          </p>
        </div>

        {/* Features Chips */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 rounded-2xl bg-white p-4 border border-border shadow-sm">
            <div className="text-black">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground uppercase">Garantía</p>
              <p className="text-[10px] text-muted">Oficial 1 año</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white p-4 border border-border shadow-sm">
            <div className="text-black">
              <Truck size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground uppercase">Envíos</p>
              <p className="text-[10px] text-muted">A todo el país</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar (Fixed on Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 p-6 backdrop-blur-xl border-t border-border md:relative md:bg-transparent md:border-none md:p-8">
        <div className="mx-auto flex max-w-lg items-center gap-4">
          {product.stock === 0 ? (
            <button
              disabled
              className="flex flex-1 items-center justify-center gap-3 rounded-2xl bg-zinc-100 py-4 text-sm font-bold text-zinc-400 border border-zinc-200 cursor-not-allowed"
            >
              Sin Stock
            </button>
          ) : quantity > 0 ? (
            <div className="flex flex-1 items-center justify-between rounded-2xl bg-white border border-border p-1 shadow-sm">
              <button
                onClick={() => updateQuantity(product.id, quantity - 1)}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white transition-transform active:scale-90"
              >
                <Minus size={20} strokeWidth={3} />
              </button>
              <span className="text-lg font-bold text-foreground">{quantity}</span>
              <button
                onClick={() => updateQuantity(product.id, quantity + 1)}
                disabled={product.stock !== undefined && quantity >= product.stock}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white transition-transform active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                <Plus size={20} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addItem(product)}
              className="flex flex-1 items-center justify-center gap-3 rounded-2xl bg-black py-4 text-sm font-bold text-white transition-all hover:bg-zinc-800 active:scale-95 shadow-lg shadow-black/5"
            >
              <ShoppingCart size={20} />
              Agregar al Carrito
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
