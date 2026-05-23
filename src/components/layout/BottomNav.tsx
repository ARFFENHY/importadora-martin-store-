"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, ShoppingBag, User, LayoutGrid, X, ArrowRight, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useProductStore } from "@/store/useProductStore";
import { useConfigStore } from "@/store/useConfigStore";

const navItems = [
  { icon: Home, label: "Inicio", href: "/" },
  { icon: LayoutGrid, label: "Categorías", href: "/categorias" },
  { icon: Search, label: "Buscar", href: "/buscar" },
  { icon: ShoppingBag, label: "Carrito", href: "/cart", showBadge: true },
  { icon: User, label: "Perfil", href: "/perfil" },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { getItemCount } = useCartStore();
  const { isAuthenticated, logout, adminUsername } = useAuthStore();
  const { products, categories } = useProductStore();
  const { store } = useConfigStore();
  const itemCount = getItemCount();

  const [activeSheet, setActiveSheet] = useState<"categories" | "search" | "profile" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Reset search query when switching sheets
  useEffect(() => {
    setTimeout(() => {
      setSearchQuery("");
    }, 0);
  }, [activeSheet]);

  // Hide sheets on navigation changes
  useEffect(() => {
    setTimeout(() => {
      setActiveSheet(null);
    }, 0);
  }, [pathname]);

  // Solo visible para el administrador autenticado
  if (!isAuthenticated) return null;

  // Al darle inicio llevarle a la pagina principal y alli debe ocultarse no debe aparecer
  if (pathname === "/") return null;

  const handleSelectCategory = (slug: string) => {
    // Dispatch event in case we are already on /catalogo
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("category-changed", { detail: slug }));
    }
    // Navigate to /catalogo with the category query param
    router.push(`/catalogo?category=${slug}`);
    setActiveSheet(null);
  };

  const filteredSearchProducts = searchQuery.trim() === ""
    ? []
    : products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="glass mx-4 mb-6 rounded-3xl border border-zinc-200/40 px-2 py-3.5 shadow-2xl backdrop-blur-md bg-white/95">
          <ul className="flex items-center justify-around">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.label === "Categorías" && activeSheet === "categories") ||
                (item.label === "Buscar" && activeSheet === "search") ||
                (item.label === "Perfil" && activeSheet === "profile");
              const Icon = item.icon;

              const isInteractive = ["Categorías", "Buscar", "Perfil"].includes(item.label);

              const handleItemClick = (e: React.MouseEvent) => {
                if (isInteractive) {
                  e.preventDefault();
                  if (item.label === "Categorías") {
                    setActiveSheet(activeSheet === "categories" ? null : "categories");
                  } else if (item.label === "Buscar") {
                    setActiveSheet(activeSheet === "search" ? null : "search");
                  } else if (item.label === "Perfil") {
                    setActiveSheet(activeSheet === "profile" ? null : "profile");
                  }
                } else {
                  // Normal link, close active sheets
                  setActiveSheet(null);
                }
              };

              return (
                <li key={item.label} className="flex-1">
                  <Link
                    href={item.href}
                    onClick={handleItemClick}
                    className={cn(
                      "relative flex flex-col items-center gap-1 transition-all duration-300 active:scale-95 cursor-pointer",
                      isActive ? "text-blue-600 font-bold" : "text-zinc-500 hover:text-zinc-800"
                    )}
                  >
                    <div className="relative flex items-center justify-center p-1">
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                      {item.showBadge && itemCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -right-1.5 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[8px] font-black text-white ring-2 ring-white"
                        >
                          {itemCount}
                        </motion.span>
                      )}
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-black">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute -bottom-1.5 h-1 w-5 rounded-full bg-blue-600"
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

      {/* DRAWERS / BOTTOM SHEETS */}
      <AnimatePresence>
        {activeSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveSheet(null)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
            />

            {/* Sheet Content */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[2.5rem] p-6 pb-12 shadow-2xl border-t border-zinc-200 text-zinc-900 max-h-[75vh] overflow-y-auto md:hidden"
            >
              {/* Top notch indicator */}
              <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto mb-5" />

              {/* SHEET: CATEGORIES */}
              {activeSheet === "categories" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight text-zinc-900 flex items-center gap-2">
                        <LayoutGrid size={18} className="text-blue-600" />
                        Categorías de Productos
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Selecciona para filtrar en el catálogo</p>
                    </div>
                    <button onClick={() => setActiveSheet(null)} className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 cursor-pointer">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 max-h-[45vh] overflow-y-auto pr-1">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleSelectCategory(cat.slug)}
                        className="w-full text-left p-4 bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/60 rounded-2xl transition-all font-black text-xs uppercase tracking-wider text-zinc-800 flex items-center justify-between group active:scale-[0.99] cursor-pointer"
                      >
                        <span>{cat.name}</span>
                        <ArrowRight size={14} className="text-zinc-400 group-hover:text-blue-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SHEET: SEARCH */}
              {activeSheet === "search" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight text-zinc-900 flex items-center gap-2">
                        <Search size={18} className="text-blue-600" />
                        Buscar Artículo
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Búsqueda rápida por nombre</p>
                    </div>
                    <button onClick={() => setActiveSheet(null)} className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 cursor-pointer">
                      <X size={18} />
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                      <Search size={16} />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Escribe el nombre del artículo..."
                      className="w-full bg-zinc-50 border border-zinc-200 focus:border-blue-500/50 rounded-2xl py-3.5 pl-10 pr-4 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-bold"
                      autoFocus
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery("")} 
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-700 cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Search Results */}
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                    {searchQuery.trim() === "" ? (
                      <div className="text-center py-8 text-zinc-400 flex flex-col items-center justify-center gap-2">
                        <Search size={32} className="text-zinc-200" />
                        <p className="text-[10px] font-black uppercase tracking-wider">Ingresa un término de búsqueda</p>
                      </div>
                    ) : filteredSearchProducts.length === 0 ? (
                      <div className="text-center py-8 text-zinc-400 flex flex-col items-center justify-center gap-2">
                        <ShoppingBag size={32} className="text-zinc-200" />
                        <p className="text-[10px] font-black uppercase tracking-wider">No se encontraron artículos</p>
                      </div>
                    ) : (
                      filteredSearchProducts.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => {
                            router.push(`/product/${product.id}`);
                            setActiveSheet(null);
                          }}
                          className="w-full text-left p-3 bg-zinc-50 hover:bg-zinc-100/85 border border-zinc-100 rounded-2xl transition-all flex gap-3 items-center active:scale-[0.99] cursor-pointer"
                        >
                          <div className="h-12 w-12 rounded-xl bg-white border border-zinc-200 overflow-hidden shrink-0 relative">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-[10px] text-zinc-400 font-bold">PROD</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] text-blue-600 font-black uppercase tracking-wider leading-none mb-1">{product.category}</p>
                            <h5 className="text-xs font-black text-zinc-900 truncate leading-tight uppercase">{product.name}</h5>
                            <p className="text-xs font-mono font-black text-zinc-700 mt-0.5">${product.price.toLocaleString("es-AR")}</p>
                          </div>
                          <ArrowRight size={14} className="text-zinc-400 shrink-0" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* SHEET: PROFILE */}
              {activeSheet === "profile" && (
                <div className="space-y-5">
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight text-zinc-900 flex items-center gap-2">
                        <User size={18} className="text-blue-600" />
                        Perfil Comercial
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Información general de la empresa</p>
                    </div>
                    <button onClick={() => setActiveSheet(null)} className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 cursor-pointer">
                      <X size={18} />
                    </button>
                  </div>

                  {/* Profile Card */}
                  <div className="bg-gradient-to-br from-[#030A1C] to-[#0A1A3F] border border-blue-900/30 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-[-10%] right-[-10%] w-32 h-32 rounded-full bg-blue-600/10 blur-xl pointer-events-none" />
                    
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="h-16 w-16 rounded-2xl overflow-hidden bg-white border border-white/20 shadow-lg shrink-0 flex items-center justify-center">
                        <img src={store.logoUrl || "/logo.png"} alt="Logo" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-base font-black uppercase tracking-tight truncate leading-tight">{store.name}</h5>
                        <p className="text-[9px] text-blue-400 font-bold uppercase tracking-[0.2em] mt-1">
                          Rol: Administrador
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate">
                          Usuario: @{adminUsername || "admin"}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-white/10 mt-5 pt-4 space-y-2.5 relative z-10">
                      <div className="flex items-center gap-2 text-xs text-zinc-300">
                        <Phone size={14} className="text-blue-400" />
                        <span className="font-mono">+{store.whatsAppNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-300">
                        <Home size={14} className="text-blue-400" />
                        <span>Catálogo Web Digital Activo</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => {
                        router.push("/admin");
                        setActiveSheet(null);
                      }}
                      className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] border border-zinc-200 cursor-pointer"
                    >
                      <User size={15} />
                      Ir al Panel de Control
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("¿Seguro que deseas cerrar sesión?")) {
                          logout();
                          setActiveSheet(null);
                          router.push("/");
                        }
                      }}
                      className="w-full bg-red-50 hover:bg-red-100/80 text-red-600 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] border border-red-100 cursor-pointer"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
