"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { SearchHeader } from "@/components/layout/SearchHeader";
import { CategoryBar } from "@/components/features/categories/CategoryBar";
import { ProductCard } from "@/components/features/products/ProductCard";
import { PRODUCTS as STATIC_PRODUCTS, CATEGORIES as STATIC_CATEGORIES } from "@/data/products";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Star, Flame, Sparkles } from "lucide-react";
import { useConfigStore } from "@/store/useConfigStore";
import { useProductStore } from "@/store/useProductStore";

export default function CatalogoPage() {
  const [activeCategory, setActiveCategory] = useState("todos");
  const { banner, store } = useConfigStore();
  const { products, categories } = useProductStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayProducts = mounted ? products : STATIC_PRODUCTS;
  const displayCategories = mounted ? categories : STATIC_CATEGORIES;

  const filteredProducts = activeCategory === "todos"
    ? displayProducts
    : displayProducts.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase());

  const featuredProducts = displayProducts.filter(p => p.isFeatured);
  const newProducts = displayProducts.filter(p => p.isNew);
  const promotionProducts = displayProducts.filter(p => p.discount);

  return (
    <div className="min-h-screen bg-white">
      <SearchHeader />

      <main className="px-6 pb-32">
        {/* Banner Hero */}
        <section className="mt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-[2.5rem] bg-black p-8 md:p-12 border border-border relative shadow-2xl min-h-[220px] flex items-center"
          >
            {/* Background Image with cover */}
            {banner.imageUrl && (
              <div className="absolute inset-0 w-full h-full z-0">
                <Image
                  src={banner.imageUrl}
                  alt="Banner background"
                  fill
                  className="object-cover object-center"
                  unoptimized
                  priority
                />
                {/* Dark gradient overlay to ensure text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-transparent z-0" />
              </div>
            )}

            <div className="relative z-10 flex flex-col gap-3 max-w-[450px]">
              <div className="flex items-center gap-2 text-primary">
                {store.logoUrl ? (
                  <div className="h-6 w-6 rounded-full overflow-hidden border border-primary bg-white flex items-center justify-center shrink-0">
                    <img src={store.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full overflow-hidden border border-primary bg-white flex items-center justify-center shrink-0">
                    <img src="/icon.jpg" alt="Logo" className="h-full w-full object-cover" />
                  </div>
                )}
                <span className="text-xs font-bold uppercase tracking-widest">
                  {banner.badge || "Súper Ofertas"}
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
                {banner.title}
              </h2>
              <p className="text-xs md:text-sm text-zinc-300">
                {banner.subtitle}
              </p>
              <button className="mt-2 flex w-fit items-center gap-2 rounded-xl bg-white px-6 py-3 text-xs font-bold text-black transition-transform active:scale-95 shadow-xl hover:bg-zinc-100">
                Explorar Ahora
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Background decorative text */}
            <span className="absolute right-8 bottom-[-20px] text-[10rem] font-black text-white/[0.03] select-none pointer-events-none z-0">
              PRO
            </span>
          </motion.div>
        </section>

        {/* Categorías (Horizontal Scroll) */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2">
              <Sparkles size={20} className="text-primary" />
              Categorías
            </h3>
          </div>
          <CategoryBar
            categories={displayCategories}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />
        </section>

        {activeCategory === "todos" ? (
          <>
            {/* Sección: Productos Destacados */}
            <section className="mt-12">
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex flex-col">
                  <h3 className="text-xl font-black text-foreground uppercase tracking-tighter flex items-center gap-2">
                    <Star size={20} fill="#FFB800" className="text-primary" />
                    Destacados
                  </h3>
                  <div className="h-1 w-12 bg-primary rounded-full mt-1" />
                </div>
                <button className="text-xs font-bold text-black border-b-2 border-primary pb-0.5">Ver todo</button>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>

            {/* Sección: Novedades (Scroll Horizontal en Mobile) */}
            <section className="mt-16 bg-zinc-50 -mx-6 px-6 py-12 border-y border-border">
              <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex flex-col">
                  <h3 className="text-xl font-black text-foreground uppercase tracking-tighter flex items-center gap-2">
                    <Zap size={20} fill="#FFB800" className="text-primary" />
                    Novedades
                  </h3>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Recién llegados a la tienda</p>
                </div>
              </div>

              <div className="no-scrollbar flex gap-4 overflow-x-auto pb-4">
                {newProducts.map((product) => (
                  <div key={product.id} className="min-w-[200px] w-[200px]">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </section>

            {/* Sección: Ofertas / Promociones */}
            <section className="mt-16">
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex flex-col">
                  <h3 className="text-xl font-black text-foreground uppercase tracking-tighter flex items-center gap-2">
                    <Flame size={20} fill="#FF8A00" className="text-secondary" />
                    Promociones
                  </h3>
                  <div className="h-1 w-12 bg-secondary rounded-full mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {promotionProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>

            {/* Sección: Todos los Productos */}
            <section className="mt-16">
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex flex-col">
                  <h3 className="text-xl font-black text-foreground uppercase tracking-tighter flex items-center gap-2">
                    <Sparkles size={20} className="text-primary" />
                    Todos los Productos
                  </h3>
                  <div className="h-1 w-12 bg-primary rounded-full mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {displayProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          </>
        ) : (
          /* Vista Filtrada */
          <section className="mt-8 min-h-[400px]">
            <div className="flex items-center justify-between mb-6 px-2">
              <h3 className="text-xl font-black text-foreground uppercase tracking-tighter">
                {activeCategory}
              </h3>
              <span className="text-xs text-muted font-bold">{filteredProducts.length} productos</span>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Footer Info / Beneficios */}
        <section className="mt-20 grid grid-cols-1 gap-6 border-t border-border pt-12 text-center pb-8">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center text-primary">
              <Zap size={24} />
            </div>
            <h4 className="font-bold text-sm">Envíos Rápidos</h4>
            <p className="text-xs text-muted max-w-[200px]">Despachamos tu pedido en menos de 24hs a todo el país.</p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center text-primary">
              <Star size={24} />
            </div>
            <h4 className="font-bold text-sm">Calidad Garantizada</h4>
            <p className="text-xs text-muted max-w-[200px]">Solo trabajamos con las mejores marcas del mercado.</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 border-t border-zinc-100 pt-8 pb-4 flex flex-col items-center gap-4 text-center">
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
            © {new Date().getFullYear()} {mounted ? store.name : "Importadora Martin Store"} - Todos los derechos reservados.
          </p>
        </footer>
      </main>
    </div>
  );
}
