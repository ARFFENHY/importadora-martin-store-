"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Wrench,
  Zap,
  Star,
  Package,
  Flame,
  Lock,
  User,
  Eye,
  EyeOff,
  RefreshCw,
  X,
} from "lucide-react";
import { useConfigStore } from "@/store/useConfigStore";
import { useAuthStore } from "@/store/useAuthStore";

export default function LandingPage() {
  const router = useRouter();
  const { store } = useConfigStore();
  const { login, isAuthenticated, loginError, clearError } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [shakeError, setShakeError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Si ya está autenticado y abre el modal, redirigir al admin
  useEffect(() => {
    if (isAuthenticated && showLoginModal) {
      router.push("/admin");
    }
  }, [isAuthenticated, showLoginModal, router]);

  const storeName = mounted ? store.name : "Importadora Martin Store";

  const handleOpenLogin = () => {
    clearError();
    setUsername("");
    setPassword("");
    setShowLoginModal(true);
  };

  const handleCloseLogin = () => {
    clearError();
    setShowLoginModal(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    clearError();

    await new Promise((resolve) => setTimeout(resolve, 800));

    const success = login(username, password);
    setIsLoggingIn(false);

    if (success) {
      router.push("/admin");
    } else {
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
    }
  };

  const features = [
    { icon: Wrench, label: "Herramientas", desc: "Profesionales y de alta calidad" },
    { icon: Zap, label: "Envío Rápido", desc: "Despacho en menos de 24hs" },
    { icon: Star, label: "Garantía", desc: "Respaldo en todos los productos" },
    { icon: Package, label: "Stock Real", desc: "Catálogo actualizado al día" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden relative flex flex-col">

      {/* ── Luces de fondo difusas ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-amber-500/8 blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-amber-600/6 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-amber-500/3 blur-[180px]" />
      </div>

      {/* ── Grid overlay sutil ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,184,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,184,0,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Header ── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12 border-b border-white/5">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Flame size={18} className="text-black" fill="currentColor" />
          </div>
          <span className="text-sm font-black uppercase tracking-widest text-white">
            {storeName}
          </span>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={handleOpenLogin}
          className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all cursor-pointer"
        >
          <Lock size={13} />
          Ingresar como Admin
        </motion.button>
      </header>

      {/* ── Hero ── */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-6 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col items-center gap-6 max-w-2xl"
        >
          {/* Badge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-amber-400"
          >
            <Flame size={11} fill="currentColor" />
            Importadora de Herramientas
          </motion.div>

          {/* Título */}
          <h1 className="text-5xl md:text-7xl font-black leading-none tracking-tight">
            <span className="text-white">{storeName.split(" ")[0]}</span>{" "}
            <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
              {storeName.split(" ").slice(1).join(" ")}
            </span>
          </h1>

          {/* Subtítulo */}
          <p className="text-base md:text-lg text-zinc-400 max-w-md leading-relaxed">
            Herramientas profesionales, eléctricas y de mano. Calidad garantizada
            con envíos rápidos a todo el país.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/catalogo")}
              className="group w-full sm:w-auto flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-8 py-4 text-sm font-black uppercase tracking-widest text-black shadow-xl shadow-amber-500/20 hover:from-amber-300 hover:to-amber-400 transition-all cursor-pointer"
            >
              Ver Catálogo
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleOpenLogin}
              className="group w-full sm:w-auto flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-black uppercase tracking-widest text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all cursor-pointer"
            >
              <ShieldCheck size={16} className="text-amber-400" />
              Panel Admin
            </motion.button>
          </div>
        </motion.div>

        {/* ── Feature Cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl"
        >
          {features.map(({ icon: Icon, label, desc }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex flex-col items-center gap-3 rounded-2xl border border-white/5 bg-white/3 p-5 text-center hover:border-amber-500/20 hover:bg-amber-500/5 transition-all"
            >
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Icon size={20} className="text-amber-400" />
              </div>
              <p className="text-xs font-black uppercase tracking-wider text-white">{label}</p>
              <p className="text-[10px] text-zinc-500 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/5 py-5 text-center">
        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} {storeName} — Todos los derechos reservados.
        </p>
      </footer>

      {/* ══════════════════════════════════════════════
          MODAL DE LOGIN ADMIN
      ══════════════════════════════════════════════ */}
      {showLoginModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={(e) => e.target === e.currentTarget && handleCloseLogin()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className={`relative w-full max-w-sm bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-[2rem] p-8 shadow-2xl ${
              shakeError ? "animate-[shake_0.5s_ease-in-out]" : ""
            }`}
          >
            {/* Línea dorada superior */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[2px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent rounded-full" />

            {/* Botón cerrar */}
            <button
              onClick={handleCloseLogin}
              className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white transition-all cursor-pointer"
            >
              <X size={14} />
            </button>

            {/* Icono y título */}
            <div className="flex flex-col items-center text-center mb-7">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25 mb-4">
                <ShieldCheck size={28} className="text-black" />
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                Acceso Administrativo
              </h2>
              <p className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.2em] mt-1">
                {storeName}
              </p>
            </div>

            {/* Error */}
            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-medium text-red-400 text-center"
              >
                {loginError}
              </motion.div>
            )}

            {/* Formulario */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Usuario */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider ml-1">
                  Usuario
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <User size={15} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
                    placeholder="admin"
                    className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-amber-500/60 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider ml-1">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Lock size={15} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-amber-500/60 rounded-xl py-3 pl-10 pr-10 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full mt-2 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 disabled:from-zinc-800 disabled:to-zinc-800 text-black disabled:text-zinc-600 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-amber-500/15 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="animate-spin" size={15} />
                    Verificando...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={15} />
                    Ingresar al Panel
                  </>
                )}
              </button>
            </form>

            {/* Link al catálogo */}
            <div className="text-center mt-6">
              <button
                onClick={() => { handleCloseLogin(); router.push("/catalogo"); }}
                className="text-[10px] font-bold text-zinc-500 hover:text-amber-400 uppercase tracking-widest transition-colors cursor-pointer"
              >
                Ver catálogo sin iniciar sesión →
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Keyframe para shake */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
          20%, 40%, 60%, 80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
