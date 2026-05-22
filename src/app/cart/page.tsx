"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Info, Truck, Building2, ChevronRight } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { formatPrice } from "@/lib/utils";
import { PRODUCTS as STATIC_PRODUCTS } from "@/data/products";
import { ProductCard } from "@/components/features/products/ProductCard";
import { motion } from "framer-motion";
import { useProductStore } from "@/store/useProductStore";
import { useConfigStore } from "@/store/useConfigStore";

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotal, clearCart } = useCartStore();
  const [deliveryMethod, setDeliveryMethod] = React.useState<"delivery" | "pickup">("pickup");
  const { products } = useProductStore();
  const { colors, store } = useConfigStore();
  const [mounted, setMounted] = useState(false);

  // Carousel States
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleItems, setVisibleItems] = useState(4);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayProducts = mounted ? products : STATIC_PRODUCTS;
  const suggestedProducts = displayProducts
    .filter((p) => !items.find((item) => item.id === p.id))
    .slice(0, 10);

  const isLoopable = suggestedProducts.length > visibleItems;
  const extendedProducts = isLoopable
    ? [...suggestedProducts, ...suggestedProducts.slice(0, visibleItems)]
    : suggestedProducts;

  // Responsive Carousel Widths
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setVisibleItems(1);
      } else if (window.innerWidth < 1024) {
        setVisibleItems(2);
      } else if (window.innerWidth < 1280) {
        setVisibleItems(3);
      } else {
        setVisibleItems(4);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Effect to re-enable transitions after an instant snap jump
  useEffect(() => {
    if (!transitionEnabled) {
      const timeout = setTimeout(() => {
        setTransitionEnabled(true);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [transitionEnabled]);

  const handleNext = () => {
    if (!isLoopable) return;
    setTransitionEnabled(true);
    setCurrentIndex((prev) => {
      if (prev >= suggestedProducts.length) {
        return 0;
      }
      return prev + 1;
    });
  };

  const handlePrev = () => {
    if (!isLoopable) return;
    if (currentIndex <= 0) {
      // Snap instantly to the end clone, then animate to N - 1
      setTransitionEnabled(false);
      setCurrentIndex(suggestedProducts.length);
      setTimeout(() => {
        setTransitionEnabled(true);
        setCurrentIndex(suggestedProducts.length - 1);
      }, 50);
    } else {
      setTransitionEnabled(true);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Auto-play Interval
  useEffect(() => {
    if (!mounted || items.length === 0 || !isLoopable) return;

    // Check if the current device is a touch screen (coarse pointer) to prevent sticky hover states
    const isTouchDevice = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
    const shouldPause = isHovered && !isTouchDevice;

    if (shouldPause) return;

    const interval = setInterval(() => {
      handleNext();
    }, 3000); // 3 seconds active pacing

    return () => clearInterval(interval);
  }, [mounted, items.length, isLoopable, isHovered, currentIndex]);

  // Touch Swipe Gesture Handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsHovered(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    setIsHovered(false);
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };


  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-white">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8 rounded-full bg-zinc-50 p-12 text-zinc-200"
        >
          <ShoppingBag size={100} strokeWidth={1} />
        </motion.div>
        <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter">Carrito Vacío</h1>
        <p className="mt-4 text-muted max-w-[280px]">
          Tu carrito está esperando ser llenado con las mejores herramientas.
        </p>
        <button
          onClick={() => router.push("/catalogo")}
          className="mt-10 rounded-2xl bg-black px-12 py-5 font-black text-white uppercase tracking-widest shadow-xl active:scale-95 transition-transform"
        >
          Ir a la Tienda
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-40">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/catalogo")} className="p-2 -ml-2 hover:bg-zinc-100 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-black text-foreground uppercase tracking-tight">Mi Carrito</h1>
        </div>
        <button 
          onClick={clearCart}
          className="text-[10px] font-black text-muted hover:text-red-500 uppercase tracking-[0.2em] transition-colors"
        >
          Vaciar
        </button>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Lista de Productos */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">
                Productos Seleccionados ({items.length})
              </span>
            </div>

            {items.map((item) => (
              <motion.div 
                layout
                key={item.id}
                className="bg-white rounded-[2rem] p-4 border border-border shadow-sm flex items-center gap-5 group"
              >
                {/* Product Image */}
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-zinc-50 border border-border">
                  <Image
                    src={item.images[0]}
                    alt={item.name}
                    fill
                    className="object-contain p-2"
                    unoptimized
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 flex flex-col justify-between py-1 min-h-[96px]">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-tight">
                      {item.name}
                    </h3>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-zinc-300 hover:text-red-500 transition-colors shrink-0"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="flex items-end justify-between mt-auto">
                    <div className="flex flex-col">
                      <span className="text-lg font-black text-foreground">
                        {formatPrice(item.price)}
                      </span>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 border border-border p-1.5">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-foreground hover:bg-black hover:text-white transition-all border border-border shadow-sm active:scale-90"
                      >
                        <Minus size={14} strokeWidth={3} />
                      </button>
                      <span className="min-w-[28px] text-center text-sm font-black text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-foreground hover:bg-black hover:text-white transition-all border border-border shadow-sm active:scale-90"
                      >
                        <Plus size={14} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Selección de Envío / Retiro */}
            <div className="bg-white border border-border rounded-[2.5rem] p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-2 mb-2 text-foreground font-black uppercase tracking-tight">
                <Truck size={22} className="text-primary" />
                <h3>Información de Entrega</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDeliveryMethod("pickup")}
                  className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all ${
                    deliveryMethod === "pickup" 
                      ? "border-black bg-black text-white" 
                      : "border-zinc-100 bg-zinc-50 text-muted hover:border-zinc-200"
                  }`}
                >
                  <Building2 size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Retiro en Local</span>
                </button>
                <button
                  onClick={() => setDeliveryMethod("delivery")}
                  className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all ${
                    deliveryMethod === "delivery" 
                      ? "border-black bg-black text-white" 
                      : "border-zinc-100 bg-zinc-50 text-muted hover:border-zinc-200"
                  }`}
                >
                  <Truck size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Envío a Domicilio</span>
                </button>
              </div>

              {deliveryMethod === "pickup" ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-50 rounded-2xl p-4 border border-dashed border-border"
                >
                  <p className="text-xs text-muted font-medium leading-relaxed">
                    Podés retirar tu pedido de {store.pickupHours || "lunes a viernes de 9:00 a 18:00 hs"} en nuestra sucursal central: <br />
                    <strong className="text-foreground">{store.pickupAddress || "Alvear 2580, Ramos Mejía, Buenos Aires."}</strong>
                  </p>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Nombre y Apellido</label>
                      <input 
                        placeholder="Ej: Juan Pérez"
                        className="w-full bg-zinc-50 border border-border rounded-xl px-4 py-3 text-sm focus:border-black outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Teléfono / WhatsApp</label>
                      <input 
                        placeholder="Ej: 11 2233 4455"
                        className="w-full bg-zinc-50 border border-border rounded-xl px-4 py-3 text-sm focus:border-black outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Calle y Altura</label>
                      <input 
                        placeholder="Ej: Av. Rivadavia 12345"
                        className="w-full bg-zinc-50 border border-border rounded-xl px-4 py-3 text-sm focus:border-black outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Cód. Postal</label>
                      <input 
                        placeholder="Ej: 1704"
                        className="w-full bg-zinc-50 border border-border rounded-xl px-4 py-3 text-sm focus:border-black outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Provincia</label>
                      <input 
                        placeholder="Ej: Buenos Aires"
                        className="w-full bg-zinc-50 border border-border rounded-xl px-4 py-3 text-sm focus:border-black outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Localidad</label>
                      <input 
                        placeholder="Ej: Ramos Mejía"
                        className="w-full bg-zinc-50 border border-border rounded-xl px-4 py-3 text-sm focus:border-black outline-none transition-all"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Resumen de Compra (Sticky) */}
          <div className="lg:col-span-5">
            <div className="bg-black rounded-[2.5rem] p-8 text-white sticky top-28 shadow-2xl overflow-hidden">
              {/* Background Glow */}
              <div className="absolute top-[-50%] right-[-50%] w-[100%] h-[100%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
              
              <div className="relative z-10">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-8">Resumen del Pedido</h2>
                
                <div className="space-y-5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-zinc-400">Subtotal</span>
                    <span className="text-base font-bold text-white">{formatPrice(getTotal())}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-zinc-400">Envío</span>
                    <span className="text-sm font-black text-white uppercase tracking-widest">A convenir</span>
                  </div>
                  
                  <div className="pt-8 mt-4 border-t border-white/10">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Total Final</span>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">IVA Incluido</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black text-white tracking-tighter leading-none">
                        {formatPrice(getTotal())}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => router.push("/checkout")}
                  className="mt-10 w-full flex items-center justify-center gap-3 bg-white text-black py-5 rounded-2xl font-black uppercase tracking-[0.1em] hover:bg-zinc-100 transition-all active:scale-95 shadow-2xl group"
                >
                  Iniciar Pago
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Carrusel de Sugerencias */}
        <section className="mt-20 border-t border-border pt-12">
          <div className="flex items-end justify-between mb-6">
            <div className="flex flex-col">
              <h3 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                <ShoppingBag size={20} style={{ color: colors.primary }} />
                Completa tu compra
              </h3>
              <p className="text-xs text-muted font-bold uppercase tracking-widest mt-1">
                Productos recomendados para vos
              </p>
            </div>
            
            {/* Carousel Navigation Buttons */}
            {suggestedProducts.length > visibleItems && (
              <div className="flex gap-2">
                <button
                  onClick={handlePrev}
                  className="p-2.5 rounded-full bg-white border border-border text-foreground hover:bg-black hover:text-white shadow-sm transition-all duration-300 active:scale-90 flex items-center justify-center"
                  aria-label="Anterior"
                >
                  <ChevronLeft size={16} strokeWidth={3} />
                </button>
                <button
                  onClick={handleNext}
                  className="p-2.5 rounded-full bg-white border border-border text-foreground hover:bg-black hover:text-white shadow-sm transition-all duration-300 active:scale-90 flex items-center justify-center"
                  aria-label="Siguiente"
                >
                  <ChevronRight size={16} strokeWidth={3} />
                </button>
              </div>
            )}
          </div>

          
          <div 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className="relative overflow-hidden -mx-3 px-3 py-2 cursor-grab active:cursor-grabbing"
          >
            <motion.div 
              className="flex animate-drag"
              animate={{ x: `-${currentIndex * (100 / visibleItems)}%` }}
              transition={transitionEnabled ? { type: "spring", stiffness: 200, damping: 26 } : { duration: 0 }}
              onAnimationComplete={() => {
                if (currentIndex === suggestedProducts.length) {
                  setTransitionEnabled(false);
                  setCurrentIndex(0);
                }
              }}
            >
              {extendedProducts.map((product, idx) => (
                <div 
                  key={`${product.id}-${idx}`} 
                  className="w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 shrink-0 px-3"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </motion.div>
          </div>

          {/* Dots Indicator */}
          {suggestedProducts.length > visibleItems && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: suggestedProducts.length }).map((_, idx) => {
                const isActive = (currentIndex % suggestedProducts.length) === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setTransitionEnabled(true);
                      setCurrentIndex(idx);
                    }}
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: isActive ? "24px" : "8px",
                      backgroundColor: isActive ? colors.primary : "#D4D4D8" 
                    }}
                    aria-label={`Ir al slide ${idx + 1}`}
                  />
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
