"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  Palette, 
  Image as ImageIcon, 
  Settings, 
  RefreshCw, 
  Save, 
  Sparkles, 
  Check, 
  Flame, 
  Star,
  Trash2,
  Info,
  TrendingUp,
  ShoppingBag,
  Clock,
  Share2,
  Plus,
  Search,
  Edit,
  Copy,
  ExternalLink,
  X,
  Phone,
  MapPin,
  CreditCard,
  User,
  Eye,
  Sliders,
  DollarSign,
  Lock,
  LogOut,
  KeyRound,
  ShieldCheck,
  EyeOff,
  Camera,
  Upload,
  Folder,
  Download
} from "lucide-react";
import { useConfigStore, ColorsConfig } from "@/store/useConfigStore";
import { useProductStore } from "@/store/useProductStore";
import { useOrderStore, Order } from "@/store/useOrderStore";
import { useAuthStore } from "@/store/useAuthStore";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import { BannerDesigner } from "@/components/features/designer/BannerDesigner";
import { StoreQRCode } from "@/components/ui/StoreQRCode";

// Preset Palettes Definition
const PRESET_PALETTES = [
  {
    name: "Total White (Original)",
    colors: {
      primary: "#FFB800",
      secondary: "#FF8A00",
      background: "#FFFFFF",
      foreground: "#000000",
      surface: "#FFFFFF",
      surfaceHover: "#F8F8F8",
      border: "#E5E5E5",
      muted: "#52525B",
    }
  },
  {
    name: "Dark Premium (Elegante)",
    colors: {
      primary: "#FFB800",
      secondary: "#FF8A00",
      background: "#0A0A0A",
      foreground: "#FFFFFF",
      surface: "#121212",
      surfaceHover: "#1C1C1C",
      border: "#262626",
      muted: "#A1A1AA",
    }
  },
  {
    name: "Emerald Pro (Profesional)",
    colors: {
      primary: "#10B981",
      secondary: "#059669",
      background: "#FFFFFF",
      foreground: "#064E3B",
      surface: "#F0FDF4",
      surfaceHover: "#DCFCE7",
      border: "#A7F3D0",
      muted: "#047857",
    }
  },
  {
    name: "Ocean Deep (Futurista)",
    colors: {
      primary: "#0EA5E9",
      secondary: "#0284C7",
      background: "#0F172A",
      foreground: "#F8FAFC",
      surface: "#1E293B",
      surfaceHover: "#334155",
      border: "#334155",
      muted: "#94A3B8",
    }
  },
  {
    name: "Cyberpunk (Neon)",
    colors: {
      primary: "#FF007F",
      secondary: "#00FFFF",
      background: "#0C0813",
      foreground: "#FFFFFF",
      surface: "#1A1126",
      surfaceHover: "#2D1E42",
      border: "#FF007F",
      muted: "#8B5CF6",
    }
  }
];

// Preset Banner Images Definition
const PRESET_IMAGES = [
  {
    name: "Rotomartillo (Fábrica)",
    url: "https://images.unsplash.com/photo-1504148455328-436276d7b218?q=80&w=600"
  },
  {
    name: "Herramientas de Mano",
    url: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=600"
  },
  {
    name: "Taladro Atornillador",
    url: "https://images.unsplash.com/photo-1540103359327-024564c76041?q=80&w=600"
  },
  {
    name: "Taller Profesional",
    url: "https://images.unsplash.com/photo-1530124560647-55e12e3f8961?q=80&w=600"
  }
];

const isValidHex = (hex: string) => /^#[0-9A-Fa-f]{6}$/.test(hex);

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

export default function AdminPage() {
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Stores
  const { colors, store, banner, bannerPresets, updateColors, updateStoreConfig, updateHeroBanner, updateBannerPreset, resetToDefault } = useConfigStore();
  const { products, categories, addProduct, updateProduct, deleteProduct, addCategory, deleteCategory, resetProductsToDefault } = useProductStore();
  const { orders, updateOrderStatus, deleteOrder, clearOrders } = useOrderStore();

  const bgNew = colors.badgeNew || "#F59E0B";
  const bgFeatured = colors.badgeFeatured || "#18181B";
  const bgStock = colors.badgeStock || "#71717A";

  // Authentication states
  const { isAuthenticated, login, logout, loginError, clearError, adminUsername, updateCredentials } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shakeError, setShakeError] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    clearError();

    // Pequeña pausa dramática premium de 800ms
    await new Promise(resolve => setTimeout(resolve, 800));

    const success = await login(username, password);
    setIsLoggingIn(false);

    if (!success) {
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
    }
  };

  // Navigation State
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "orders" | "branding" | "share" | "security" | "designer">("overview");
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month" | "all">("all");

  // Hydration state
  const [mounted, setMounted] = useState(false);

  // Dynamic values based on current domain
  const [storeUrl, setStoreUrl] = useState("http://localhost:3000/catalogo");

  // Local state for branding forms
  const [localColors, setLocalColors] = useState<ColorsConfig>({ ...colors });
  const [localStore, setLocalStore] = useState({ ...store });
  const [localBanner, setLocalBanner] = useState({ ...banner });
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Products filtering & search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("Todos");

  // Product Add/Edit Form State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [manageCatName, setManageCatName] = useState("");

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "",
    images: [] as string[],
    isNew: false,
    isFeatured: false,
    stock: ""
  });

  // Copied link toast status
  const [linkCopied, setLinkCopied] = useState(false);
  const [productToast, setProductToast] = useState<string | null>(null);

  // Security / Credentials state
  const [secNewUsername, setSecNewUsername] = useState("");
  const [secCurrentPass, setSecCurrentPass] = useState("");
  const [secNewPass, setSecNewPass] = useState("");
  const [secConfirmPass, setSecConfirmPass] = useState("");
  const [secShowCurrent, setSecShowCurrent] = useState(false);
  const [secShowNew, setSecShowNew] = useState(false);
  const [secShowConfirm, setSecShowConfirm] = useState(false);
  const [secStatus, setSecStatus] = useState<"idle" | "success" | "error">("idle");
  const [secErrorMsg, setSecErrorMsg] = useState("");

  const handleChangeCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setSecStatus("idle");
    setSecErrorMsg("");

    // Validate current password
    const { adminPassword } = useAuthStore.getState();
    if (secCurrentPass !== adminPassword) {
      setSecStatus("error");
      setSecErrorMsg("La contraseña actual es incorrecta.");
      return;
    }

    // Validate new password length
    if (secNewPass.length < 6) {
      setSecStatus("error");
      setSecErrorMsg("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    // Validate confirmation
    if (secNewPass !== secConfirmPass) {
      setSecStatus("error");
      setSecErrorMsg("Las contraseñas nuevas no coinciden.");
      return;
    }

    // Validate new username
    const finalUsername = secNewUsername.trim() || adminUsername;
    if (finalUsername.length < 3) {
      setSecStatus("error");
      setSecErrorMsg("El usuario debe tener al menos 3 caracteres.");
      return;
    }

    updateCredentials(finalUsername, secNewPass);
    setSecStatus("success");
    setSecCurrentPass("");
    setSecNewPass("");
    setSecConfirmPass("");
    setSecNewUsername("");
    setTimeout(() => setSecStatus("idle"), 4000);
  };

  // Sync local states
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setStoreUrl(window.location.origin + "/catalogo");
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      setLocalColors({ ...colors });
      setLocalStore({ ...store });
      setLocalBanner({ ...banner });
    }
  }, [colors, store, banner, mounted]);

  const handleColorChange = (key: keyof ColorsConfig, value: string) => {
    setLocalColors(prev => ({ ...prev, [key]: value }));
  };

  const handleHexInputChange = (key: keyof ColorsConfig, val: string) => {
    let formatted = val;
    if (formatted && !formatted.startsWith("#")) {
      formatted = "#" + formatted;
    }
    if (formatted === "#") {
      setLocalColors(prev => ({ ...prev, [key]: "#" }));
      return;
    }
    if (formatted.length <= 7) {
      setLocalColors(prev => ({ ...prev, [key]: formatted }));
    }
  };

  const handleStoreChange = (key: string, value: string) => {
    setLocalStore(prev => ({ ...prev, [key]: value }));
  };

  const handleBannerChange = (key: string, value: string) => {
    setLocalBanner(prev => ({ ...prev, [key]: value }));
  };

  const handleBannerImageUpload = (presetName: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      updateBannerPreset(presetName, base64);
      handleBannerChange("imageUrl", base64);
      setProductToast("Imagen de banner modificada correctamente");
      setTimeout(() => setProductToast(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleProductCardImageUpload = (productId: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const targetProd = products.find(p => p.id === productId);
      const remainingImages = targetProd && targetProd.images ? targetProd.images.slice(1) : [];
      updateProduct(productId, { images: [base64, ...remainingImages] });
      setProductToast("Imagen del producto actualizada con éxito");
      setTimeout(() => setProductToast(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const applyPresetPalette = (presetColors: ColorsConfig) => {
    setLocalColors({ ...presetColors });
  };

  const handleSaveBranding = () => {
    updateColors(localColors);
    updateStoreConfig(localStore);
    updateHeroBanner(localBanner);
    
    setSaveStatus("success");
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleResetBranding = () => {
    if (window.confirm("¿Estás seguro de que quieres restablecer la configuración estética por defecto?")) {
      resetToDefault();
      setSaveStatus("reset");
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // Products CRUD handlers
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      description: "",
      price: "",
      originalPrice: "",
      category: categories[0]?.name || "Otros",
      images: [],
      isNew: false,
      isFeatured: false,
      stock: ""
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      originalPrice: product.originalPrice ? product.originalPrice.toString() : "",
      category: product.category,
      images: product.images || [],
      isNew: !!product.isNew,
      isFeatured: !!product.isFeatured,
      stock: product.stock !== undefined ? product.stock.toString() : ""
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    const priceNum = parseFloat(productForm.price) || 0;
    const origPriceNum = productForm.originalPrice ? parseFloat(productForm.originalPrice) : undefined;
    
    // Auto-calculate discount if originalPrice is provided
    let discount: number | undefined = undefined;
    if (origPriceNum && origPriceNum > priceNum) {
      discount = Math.round(((origPriceNum - priceNum) / origPriceNum) * 100);
    }

    const payload = {
      name: productForm.name,
      description: productForm.description,
      price: priceNum,
      originalPrice: origPriceNum,
      discount: discount,
      category: productForm.category,
      images: productForm.images.length > 0 ? productForm.images : ['https://images.unsplash.com/photo-1530124560647-55e12e3f8961?q=80&w=600'],
      isNew: productForm.isNew,
      isFeatured: productForm.isFeatured,
      stock: productForm.stock.trim() !== "" ? parseInt(productForm.stock) : undefined
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
    } else {
      addProduct(payload);
    }

    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm("¿Seguro que deseas eliminar este producto?")) {
      deleteProduct(id);
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim());
    setProductForm(prev => ({ ...prev, category: newCatName.trim() }));
    setNewCatName("");
    setNewCatOpen(false);
  };

  const handleAddCategoryFromManage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageCatName.trim()) return;
    addCategory(manageCatName.trim());
    setManageCatName("");
    setProductToast("Categoría agregada con éxito");
    setTimeout(() => setProductToast(null), 3000);
  };

  const handleDeleteCategoryFromManage = (id: string) => {
    if (window.confirm("¿Seguro que deseas eliminar esta categoría? Los productos asociados se moverán a la categoría 'Otros'.")) {
      deleteCategory(id);
      setProductToast("Categoría eliminada");
      setTimeout(() => setProductToast(null), 3000);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleDownloadQR = async () => {
    try {
      if (!qrContainerRef.current) return;
      setProductToast("Preparando descarga del código QR...");
      
      const canvas = await html2canvas(qrContainerRef.current, { backgroundColor: '#18181b', scale: 2 });
      const blobUrl = canvas.toDataURL("image/png");
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `qr_${(localStore.name || store.name || 'catalogo').toLowerCase().replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setProductToast("Código QR descargado con éxito");
      setTimeout(() => setProductToast(null), 3000);
    } catch (error) {
      console.error("Error downloading QR:", error);
      window.open(qrUrl, '_blank');
      setProductToast("QR abierto en nueva pestaña");
      setTimeout(() => setProductToast(null), 3000);
    }
  };

  const handleShareQR = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        if (!qrContainerRef.current) return;
        setProductToast("Preparando código QR para compartir...");
        
        const canvas = await html2canvas(qrContainerRef.current, { backgroundColor: '#18181b', scale: 2 });
        canvas.toBlob(async (blob) => {
          if (!blob) throw new Error("Canvas to Blob failed");
          const file = new File([blob], `qr_${(localStore.name || store.name || 'catalogo').toLowerCase().replace(/\s+/g, '_')}.png`, { type: 'image/png' });
          
          await navigator.share({
            files: [file],
            title: `Catálogo de ${localStore.name || store.name}`,
            text: `¡Hola! Te comparto nuestro catálogo online. Escanea el código QR o ingresa a: ${storeUrl}`,
          });
          setProductToast(null);
        }, "image/png");
      } catch (error) {
        console.error("Error sharing QR:", error);
        handleDownloadQR();
      }
    } else {
      handleDownloadQR();
    }
  };

  const handleResetDemoData = () => {
    if (window.confirm("¿Estás seguro de que quieres restablecer los productos por defecto del catálogo?")) {
      resetProductsToDefault();
    }
  };

  // Navigation tab global pending count (always show unfiltered total pending orders)
  const globalPendingOrders = orders.filter(o => o.status === 'pending');

  // Filtered orders by selected time period (for Overview dashboard stats)
  const getFilteredOrdersByPeriod = () => {
    const now = new Date();
    return orders.filter((order) => {
      if (!order.date) return false;
      const orderDate = new Date(order.date);
      
      if (selectedPeriod === "today") {
        return (
          orderDate.getDate() === now.getDate() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      } else if (selectedPeriod === "week") {
        // Last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return orderDate >= sevenDaysAgo;
      } else if (selectedPeriod === "month") {
        // Last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return orderDate >= thirtyDaysAgo;
      }
      return true; // "all"
    });
  };

  const periodFilteredOrders = getFilteredOrdersByPeriod();
  const totalSales = periodFilteredOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = periodFilteredOrders.filter(o => o.status === 'pending');
  const activeProducts = products.length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  // Filtered Products List
  const filteredProductsList = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === "Todos" || p.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-zinc-400" size={32} />
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Cargando Panel...</p>
        </div>
      </div>
    );
  }

  if (mounted && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
        {/* Luces de fondo difusas / Gradientes premium */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
        
        {/* Botón flotante para volver al inicio */}
        <button 
          onClick={() => router.push("/")}
          className="absolute top-6 left-6 z-20 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all cursor-pointer active:scale-95 shadow-lg"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Tarjeta de Login */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`w-full max-w-md bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-[2.5rem] p-8 shadow-2xl relative z-10 ${shakeError ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
        >
          {/* Detalles azules en los bordes */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
          
          <div className="flex flex-col items-center text-center mb-8">
            {/* Logo o Icono de la mascota de la marca */}
            <div className="h-16 w-16 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 border border-white/10">
              <img src="/icon.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
              {store.name || "Importadora Martin"}
            </h2>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em] mt-1">
              Acceso Administrativo
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {loginError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-medium text-red-400 text-center"
              >
                {loginError}
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider ml-1">Usuario</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="admin"
                  className="w-full bg-zinc-950/50 border border-zinc-800 focus:border-blue-500/50 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider ml-1">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-zinc-950/50 border border-zinc-800 focus:border-blue-500/50 rounded-xl py-3 pl-10 pr-10 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  <Eye size={16} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full mt-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 disabled:from-zinc-800 disabled:to-zinc-800 text-white disabled:text-zinc-600 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 hover:brightness-110 active:brightness-95 cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  Verificando...
                </>
              ) : (
                <>
                  Ingresar al Panel
                </>
              )}
            </button>
          </form>

          {/* Enlace de regreso */}
          <div className="text-center mt-8">
            <button 
              onClick={() => router.push("/")}
              className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-blue-400 transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
            >
              <ChevronLeft size={12} />
              Volver al Catálogo
            </button>
          </div>
        </motion.div>

        {/* CSS para la animación de shake en caso de error */}
        <style jsx global>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
            20%, 40%, 60%, 80% { transform: translateX(6px); }
          }
        `}</style>
      </div>
    );
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&ecc=H&data=${encodeURIComponent(storeUrl)}`;

  return (
    <div className="min-h-screen bg-zinc-50 pb-32 text-zinc-900 font-sans">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-800 transition-all hover:bg-zinc-200 active:scale-90"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-black text-black uppercase tracking-tight flex items-center gap-2">
              <Sliders size={20} className="text-blue-500" />
              {store.name}
            </h1>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Panel Administrativo Central</p>
          </div>
        </div>

        {/* Global Save Indicator / Preset options */}
        <div className="flex items-center gap-2">
          {saveStatus === "success" && (
            <motion.span 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-green-200"
            >
              <Check size={14} strokeWidth={3} />
              Guardado con Éxito
            </motion.span>
          )}
          {saveStatus === "reset" && (
            <motion.span 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-blue-200"
            >
              <RefreshCw className="animate-spin" size={14} />
              Restablecido
            </motion.span>
          )}
          
          {activeTab === "branding" && (
            <button
              onClick={handleSaveBranding}
              className="flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 transition-all active:scale-95 shadow-md shadow-black/10 cursor-pointer"
            >
              <Save size={16} />
              Guardar Cambios
            </button>
          )}

          <button
            onClick={() => {
              if (window.confirm("¿Seguro que deseas cerrar la sesión de administrador?")) {
                logout();
              }
            }}
            className="flex items-center gap-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2.5 text-xs font-bold text-red-600 transition-all active:scale-[0.97] shadow-sm cursor-pointer"
          >
            <LogOut size={15} />
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="flex overflow-x-auto no-scrollbar gap-2 p-1.5 bg-white border border-zinc-200 rounded-2xl shadow-sm">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "overview" ? "bg-black text-white shadow-md" : "text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            <TrendingUp size={16} />
            Resumen
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "products" ? "bg-black text-white shadow-md" : "text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            <ShoppingBag size={16} />
            Productos ({activeProducts})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap relative ${
              activeTab === "orders" ? "bg-black text-white shadow-md" : "text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            <Clock size={16} />
            Pedidos
            {globalPendingOrders.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-amber-500 text-[10px] text-white flex items-center justify-center rounded-full font-black border-2 border-white animate-pulse">
                {globalPendingOrders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("branding")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "branding" ? "bg-black text-white shadow-md" : "text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            <Palette size={16} />
            Personalización
          </button>
          <button
            onClick={() => setActiveTab("share")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "share" ? "bg-black text-white shadow-md" : "text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            <Share2 size={16} />
            Compartir
          </button>
          <button
            onClick={() => setActiveTab("designer")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "designer" ? "bg-black text-white shadow-md" : "text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            <Sparkles size={16} className="text-blue-500" />
            Diseñador
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "security" ? "bg-black text-white shadow-md" : "text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            <KeyRound size={16} />
            Seguridad
          </button>
        </div>
      </div>

      {/* Content Container */}
      <main className="max-w-7xl mx-auto px-6 mt-8">
        <AnimatePresence mode="wait">
          
          {/* TAB: OVERVIEW */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Selector de Período Temporal */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-zinc-200 rounded-[2rem] p-6 shadow-sm">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-black">Resumen del Catálogo</h2>
                  <p className="text-xs text-zinc-500 mt-1">Métricas generales e inventario de la tienda.</p>
                </div>
                <div className="inline-flex p-1 bg-zinc-100 border border-zinc-200/80 rounded-2xl shadow-inner gap-1 self-stretch sm:self-auto">
                  {(["today", "week", "month", "all"] as const).map((period) => {
                    const labelMap = {
                      today: "Día",
                      week: "Semana",
                      month: "Mes",
                      all: "Histórico"
                    };
                    return (
                      <button
                        key={period}
                        type="button"
                        onClick={() => setSelectedPeriod(period)}
                        className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                          selectedPeriod === period
                            ? "bg-white text-black shadow-sm"
                            : "text-zinc-500 hover:text-zinc-800"
                        }`}
                      >
                        {labelMap[period]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm flex items-center gap-5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-zinc-900 group-hover:scale-110 transition-transform">
                    <DollarSign size={80} />
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center border border-green-100">
                    <DollarSign size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Ventas Totales</p>
                    <h3 className="text-2xl font-black mt-1">{formatPrice(totalSales)}</h3>
                    <p className="text-[9px] text-zinc-500 mt-1 font-bold">
                      {selectedPeriod === "today" ? "Hoy (calendario)" : selectedPeriod === "week" ? "Últimos 7 días" : selectedPeriod === "month" ? "Últimos 30 días" : "De pedidos 'Completados'"}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm flex items-center gap-5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-zinc-900 group-hover:scale-110 transition-transform">
                    <Clock size={80} />
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                    <Clock size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Pendientes</p>
                    <h3 className="text-2xl font-black mt-1">{pendingOrders.length} Pedidos</h3>
                    <p className="text-[9px] text-zinc-500 mt-1 font-bold">
                      {selectedPeriod === "today" ? "Cargados hoy" : selectedPeriod === "week" ? "Últimos 7 días" : selectedPeriod === "month" ? "Últimos 30 días" : "Esperando confirmación"}
                    </p>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab("products")}
                  className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm flex items-center gap-5 relative overflow-hidden group cursor-pointer hover:border-blue-300 transition-colors"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-zinc-900 group-hover:scale-110 transition-transform">
                    <ShoppingBag size={80} />
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <ShoppingBag size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Productos</p>
                    <h3 className="text-2xl font-black mt-1">{activeProducts} Activos</h3>
                    <p className="text-[9px] text-zinc-500 mt-1 font-bold">
                      {outOfStockCount > 0 ? (
                        <span className="text-red-500 font-black">⚠️ {outOfStockCount} sin stock</span>
                      ) : (
                        "Cargados en catálogo"
                      )}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm flex items-center gap-5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-zinc-900 group-hover:scale-110 transition-transform">
                    <Sparkles size={80} />
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                    <Sparkles size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Categorías</p>
                    <h3 className="text-2xl font-black mt-1">{categories.length} Activas</h3>
                    <p className="text-[9px] text-zinc-500 mt-1 font-bold">Organización interna</p>
                  </div>
                </div>

              </div>

              {/* Main Panel grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* QR / Sharing Quick Card */}
                <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center justify-between text-center min-h-[480px]">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Compartir Catálogo</span>
                    <h3 className="text-xl font-black uppercase tracking-tight">Tu Tienda Digital</h3>
                    <p className="text-xs text-zinc-500 max-w-[280px]">Los usuarios pueden ver tus ofertas y enviarte pedidos directamente a tu WhatsApp.</p>
                  </div>

                  <div className="my-6 bg-zinc-50 p-4 rounded-3xl border border-zinc-100 shadow-inner flex items-center justify-center aspect-square w-56 relative group">
                    <Image 
                      src={qrUrl}
                      alt="QR Code"
                      width={200}
                      height={200}
                      className="rounded-2xl transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  </div>

                  <div className="w-full space-y-4">
                    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3 font-mono text-[11px] text-zinc-600 select-all overflow-hidden text-ellipsis flex items-center justify-between gap-2">
                      <span className="truncate">{storeUrl}</span>
                      <button 
                        onClick={handleCopyLink}
                        className="shrink-0 p-2 hover:bg-zinc-200 active:scale-95 transition-all text-zinc-800 rounded-xl bg-white border"
                      >
                        {linkCopied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                      </button>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={handleCopyLink}
                        className="flex-1 bg-black text-white hover:bg-zinc-800 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
                      >
                        {linkCopied ? (
                          <>
                            <Check size={16} />
                            Enlace Copiado
                          </>
                        ) : (
                          <>
                            <Copy size={16} />
                            Copiar Enlace
                          </>
                        )}
                      </button>
                      <button 
                        onClick={handleShareQR}
                        className="flex-1 border-2 border-black hover:bg-zinc-50 text-black py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Share2 size={16} />
                        Compartir QR
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dashboard Summary lists / Pending orders */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Pending Orders Card */}
                  <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-8 shadow-sm space-y-6 min-h-[480px] flex flex-col">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-tight">Últimos Pedidos</h3>
                        <p className="text-xs text-zinc-500">Pedidos recientes esperando atención.</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab("orders")}
                        className="text-[10px] font-black text-amber-600 hover:text-black uppercase tracking-[0.25em] transition-colors"
                      >
                        Ver todos
                      </button>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[340px] pr-2">
                      {pendingOrders.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 py-12 gap-3">
                          <Check size={48} className="text-green-500 bg-green-50 rounded-full p-2 border border-green-100" />
                          <div>
                            <p className="text-xs font-bold uppercase text-zinc-800">¡Al día!</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">No hay pedidos pendientes de confirmación.</p>
                          </div>
                        </div>
                      ) : (
                        pendingOrders.slice(0, 4).map((order) => (
                          <div 
                            key={order.id}
                            className="bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-black">{order.customerName}</span>
                                <span className="text-[9px] bg-amber-100 border border-amber-200 text-amber-800 font-bold uppercase px-2 py-0.5 rounded-full">
                                  Pendiente
                                </span>
                              </div>
                              <p className="text-[9px] font-mono text-zinc-500">{order.id} | {new Date(order.date).toLocaleDateString()}</p>
                              <p className="text-[10px] text-zinc-500 font-bold">{order.items.length} productos</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-black">{formatPrice(order.total)}</p>
                              <button 
                                onClick={() => setActiveTab("orders")}
                                className="text-[9px] font-black text-amber-600 hover:underline uppercase tracking-wider mt-1.5 block"
                              >
                                Administrar
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          )}

          {/* TAB: PRODUCTS */}
          {activeTab === "products" && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Product control header */}
              <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-1 items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3">
                  <Search size={18} className="text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar producto por nombre o descripción..."
                    className="w-full bg-transparent border-none text-xs outline-none focus:ring-0"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="text-zinc-400 hover:text-black">
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 overflow-x-auto">
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-xs font-bold text-zinc-700 outline-none"
                  >
                    <option value="Todos">Todas las Categorías</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => setIsManageCategoriesOpen(true)}
                    className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap cursor-pointer"
                  >
                    <Folder size={16} className="text-zinc-600" />
                    Categorías
                  </button>

                  <button
                    onClick={handleOpenAddModal}
                    className="bg-black text-white hover:bg-zinc-800 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
                  >
                    <Plus size={16} />
                    Nuevo Producto
                  </button>
                </div>
              </div>

              {/* Products List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProductsList.length === 0 ? (
                  <div className="col-span-full bg-white border border-dashed border-zinc-300 rounded-[2rem] p-12 text-center text-zinc-400 flex flex-col items-center justify-center gap-4">
                    <ShoppingBag size={48} className="text-zinc-300" />
                    <div>
                      <p className="text-sm font-black text-zinc-800 uppercase">Sin Coincidencias</p>
                      <p className="text-xs text-zinc-500 mt-1">Prueba con otra búsqueda o agrega un nuevo producto al catálogo.</p>
                    </div>
                  </div>
                ) : (
                  filteredProductsList.map((product) => (
                    <div 
                      key={product.id}
                      className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-5 relative group"
                    >
                      <div className="flex gap-4">
                        {/* Img preview with direct upload */}
                        <div className="h-20 w-20 rounded-2xl bg-zinc-50 border border-zinc-100 relative overflow-hidden flex-shrink-0 flex items-center justify-center group/img">
                          {product.images?.[0] ? (
                            <Image 
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <span className="text-xl">🛠️</span>
                          )}
                          
                          {/* Camera overlay uploader */}
                          <label className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white z-10">
                            <Camera size={16} />
                            <span className="text-[7px] font-black uppercase tracking-widest mt-1">Cambiar</span>
                            <input 
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleProductCardImageUpload(product.id, file);
                                }
                              }}
                            />
                          </label>
                        </div>

                        {/* Details */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                            {product.category}
                          </span>
                          <h4 className="text-xs font-bold line-clamp-2 leading-tight text-zinc-900 group-hover:text-black mt-2">
                            {product.name}
                          </h4>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-sm font-black text-black">{formatPrice(product.price)}</span>
                            {product.originalPrice && (
                              <span className="text-[10px] text-zinc-400 line-through">{formatPrice(product.originalPrice)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Info triggers */}
                      <div className="flex gap-2 flex-wrap">
                        {product.isFeatured && (
                          <span 
                            style={{ backgroundColor: bgFeatured, color: getContrastColor(bgFeatured) }}
                            className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md"
                          >
                            Destacado
                          </span>
                        )}
                        {product.isNew && (
                          <span 
                            style={{ backgroundColor: bgNew, color: getContrastColor(bgNew) }}
                            className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md"
                          >
                            Nuevo
                          </span>
                        )}
                        {product.stock !== undefined ? (
                          product.stock === 0 ? (
                            <span className="text-[8px] font-black uppercase tracking-wider bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-md">Sin Stock</span>
                          ) : (
                            <span 
                              style={{ backgroundColor: bgStock, color: getContrastColor(bgStock) }}
                              className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md"
                            >
                              Stock: {product.stock}
                            </span>
                          )
                        ) : (
                          <span 
                            style={{ backgroundColor: bgStock, color: getContrastColor(bgStock) }}
                            className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md"
                          >
                            Stock: Ilimitado
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 border-t border-zinc-100 pt-3">
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[10px] font-black uppercase py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1"
                        >
                          <Edit size={12} />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="px-3 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-black uppercase rounded-xl transition-colors flex items-center justify-center"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </motion.div>
          )}

          {/* TAB: ORDERS */}
          {activeTab === "orders" && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Listado de Pedidos</h3>
                  <p className="text-xs text-zinc-500">Historial completo de órdenes registradas localmente en este navegador.</p>
                </div>
                {orders.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm("¿Seguro que deseas vaciar todo el historial de pedidos?")) {
                        clearOrders();
                      }
                    }}
                    className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                  >
                    Vaciar Pedidos
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="bg-white border border-dashed border-zinc-300 rounded-[2rem] p-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-4">
                    <Clock size={48} className="text-zinc-300" />
                    <div>
                      <p className="text-sm font-black text-zinc-800 uppercase">Sin Pedidos Registrados</p>
                      <p className="text-xs text-zinc-500 mt-1">Los nuevos pedidos realizados por los clientes se guardarán automáticamente aquí.</p>
                    </div>
                  </div>
                ) : (
                  orders.map((order) => {
                    const statusColorMap = {
                      pending: { bg: "bg-amber-50 border-amber-200 text-amber-800", label: "Pendiente" },
                      completed: { bg: "bg-green-50 border-green-200 text-green-800", label: "Completado" },
                      canceled: { bg: "bg-red-50 border-red-200 text-red-800", label: "Cancelado" }
                    };

                    const status = order.status || 'pending';
                    const activeStatus = statusColorMap[status];

                    return (
                      <div 
                        key={order.id}
                        className="bg-white border border-zinc-200 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all flex flex-col gap-6"
                      >
                        {/* Upper row */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-100 pb-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <h4 className="text-sm font-black text-black">Pedido {order.id}</h4>
                              <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${activeStatus.bg}`}>
                                {activeStatus.label}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-500 font-mono mt-1">Cargado el {new Date(order.date).toLocaleString()}</p>
                          </div>

                          <div className="flex items-center gap-2 w-full md:w-auto">
                            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mr-2">Estado:</span>
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                              className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold text-zinc-700 outline-none"
                            >
                              <option value="pending">Pendiente</option>
                              <option value="completed">Completado</option>
                              <option value="canceled">Cancelado</option>
                            </select>
                            
                            <button
                              onClick={() => {
                                if (window.confirm("¿Deseas borrar el registro de este pedido?")) {
                                  deleteOrder(order.id);
                                }
                              }}
                              className="p-2.5 text-zinc-400 hover:text-red-500 rounded-xl hover:bg-zinc-50 transition-all border border-zinc-200"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Customer & Order details grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                          
                          {/* Client Detail */}
                          <div className="lg:col-span-4 space-y-3 bg-zinc-50 p-5 rounded-2xl border border-zinc-100">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                              <User size={12} /> Datos de Contacto
                            </h5>
                            <div className="space-y-2 text-xs">
                              <p><strong className="text-zinc-700">Nombre:</strong> {order.customerName}</p>
                              <p className="flex items-center gap-1.5">
                                <strong className="text-zinc-700">Teléfono:</strong> 
                                <span className="font-mono">{order.customerPhone}</span>
                                <a 
                                  href={`https://wa.me/${order.customerPhone}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] bg-green-500 text-white font-black px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider active:scale-95 transition-transform"
                                >
                                  <Phone size={8} fill="white" /> WhatsApp
                                </a>
                              </p>
                              <p><strong className="text-zinc-700">Pago:</strong> <span className="uppercase font-bold">{order.paymentMethod}</span></p>
                              <p><strong className="text-zinc-700">Entrega:</strong> {order.deliveryMethod === 'delivery' ? 'Envío a Domicilio' : 'Retiro por local'}</p>
                              {order.deliveryMethod === 'delivery' && (
                                <p><strong className="text-zinc-700">Dirección:</strong> {order.address}, {order.city}</p>
                              )}
                            </div>
                            {order.notes && (
                              <div className="mt-3 pt-3 border-t border-zinc-200/50">
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Notas:</p>
                                <p className="text-xs text-zinc-600 mt-1 italic">"{order.notes}"</p>
                              </div>
                            )}
                          </div>

                          {/* Items Purchased */}
                          <div className="lg:col-span-8 space-y-3">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                              <ShoppingBag size={12} /> Detalle del Carrito
                            </h5>
                            
                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
                              {order.items.map((item) => (
                                <div 
                                  key={item.id}
                                  className="bg-white border rounded-xl p-3 flex items-center justify-between gap-4 text-xs"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-zinc-50 rounded-lg border flex items-center justify-center text-lg shrink-0">
                                      🛠️
                                    </div>
                                    <div>
                                      <p className="font-bold text-zinc-800 line-clamp-1">{item.name}</p>
                                      <p className="text-[10px] text-zinc-500 font-bold mt-0.5">{item.quantity} x {formatPrice(item.price)}</p>
                                    </div>
                                  </div>
                                  <span className="font-black text-black">{formatPrice(item.price * item.quantity)}</span>
                                </div>
                              ))}
                            </div>

                            <div className="pt-3 border-t border-zinc-100 flex justify-between items-baseline">
                              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Facturado</span>
                              <span className="text-lg font-black text-black">{formatPrice(order.total)}</span>
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {/* TAB: BRANDING & COLORS */}
          {activeTab === "branding" && (
            <motion.div
              key="branding"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* LEFT COLUMN: Controls */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Section: Paletas Predefinidas */}
                <section className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-1 text-black font-black uppercase tracking-tight">
                    <Sparkles size={20} className="text-amber-500" />
                    <h3>Paletas de Colores Premium</h3>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Cambia la atmósfera de tu catálogo por completo. La previsualización de la derecha te mostrará el resultado al instante.
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    {PRESET_PALETTES.map((preset) => {
                      const isActive = 
                        localColors.primary === preset.colors.primary && 
                        localColors.background === preset.colors.background;

                      return (
                        <button
                          key={preset.name}
                          onClick={() => applyPresetPalette(preset.colors)}
                          className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                            isActive 
                              ? "border-black bg-zinc-50 ring-1 ring-black shadow-sm" 
                              : "border-zinc-200 hover:bg-zinc-50"
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold text-zinc-900">{preset.name}</p>
                            <div className="flex gap-1.5 mt-2">
                              <span className="w-5 h-5 rounded-full border border-zinc-200" style={{ backgroundColor: preset.colors.primary }} />
                              <span className="w-5 h-5 rounded-full border border-zinc-200" style={{ backgroundColor: preset.colors.secondary }} />
                              <span className="w-5 h-5 rounded-full border border-zinc-200" style={{ backgroundColor: preset.colors.background }} />
                              <span className="w-5 h-5 rounded-full border border-zinc-200" style={{ backgroundColor: preset.colors.foreground }} />
                              <span className="w-5 h-5 rounded-full border border-zinc-200" style={{ backgroundColor: preset.colors.surface }} />
                            </div>
                          </div>
                          {isActive && (
                            <span className="h-7 w-7 rounded-full bg-black text-white flex items-center justify-center">
                              <Check size={16} strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Section: Color Picker Detallado */}
                <section className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-1 text-black font-black uppercase tracking-tight">
                    <Palette size={20} className="text-indigo-500" />
                    <h3>Ajuste Cromático Fino</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Color Primario</label>
                      <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl p-2">
                        <div 
                          className="relative w-8 h-8 rounded-lg border border-zinc-200 shadow-2xs overflow-hidden shrink-0" 
                          style={{ backgroundColor: isValidHex(localColors.primary) ? localColors.primary : "#cccccc" }}
                        >
                          <input 
                            type="color" 
                            value={isValidHex(localColors.primary) ? localColors.primary : "#0f2c59"} 
                            onChange={(e) => handleColorChange("primary", e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer scale-150"
                          />
                        </div>
                        <input 
                          type="text"
                          value={localColors.primary}
                          onChange={(e) => handleHexInputChange("primary", e.target.value)}
                          className="w-full bg-transparent text-xs font-mono font-bold text-zinc-800 outline-none uppercase focus:text-black"
                          maxLength={7}
                          placeholder="#0F2C59"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Color Secundario</label>
                      <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl p-2">
                        <div 
                          className="relative w-8 h-8 rounded-lg border border-zinc-200 shadow-2xs overflow-hidden shrink-0" 
                          style={{ backgroundColor: isValidHex(localColors.secondary) ? localColors.secondary : "#cccccc" }}
                        >
                          <input 
                            type="color" 
                            value={isValidHex(localColors.secondary) ? localColors.secondary : "#3b82f6"} 
                            onChange={(e) => handleColorChange("secondary", e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer scale-150"
                          />
                        </div>
                        <input 
                          type="text"
                          value={localColors.secondary}
                          onChange={(e) => handleHexInputChange("secondary", e.target.value)}
                          className="w-full bg-transparent text-xs font-mono font-bold text-zinc-800 outline-none uppercase focus:text-black"
                          maxLength={7}
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Fondo General</label>
                      <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl p-2">
                        <div 
                          className="relative w-8 h-8 rounded-lg border border-zinc-200 shadow-2xs overflow-hidden shrink-0" 
                          style={{ backgroundColor: isValidHex(localColors.background) ? localColors.background : "#cccccc" }}
                        >
                          <input 
                            type="color" 
                            value={isValidHex(localColors.background) ? localColors.background : "#ffffff"} 
                            onChange={(e) => handleColorChange("background", e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer scale-150"
                          />
                        </div>
                        <input 
                          type="text"
                          value={localColors.background}
                          onChange={(e) => handleHexInputChange("background", e.target.value)}
                          className="w-full bg-transparent text-xs font-mono font-bold text-zinc-800 outline-none uppercase focus:text-black"
                          maxLength={7}
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Texto Principal</label>
                      <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl p-2">
                        <div 
                          className="relative w-8 h-8 rounded-lg border border-zinc-200 shadow-2xs overflow-hidden shrink-0" 
                          style={{ backgroundColor: isValidHex(localColors.foreground) ? localColors.foreground : "#cccccc" }}
                        >
                          <input 
                            type="color" 
                            value={isValidHex(localColors.foreground) ? localColors.foreground : "#000000"} 
                            onChange={(e) => handleColorChange("foreground", e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer scale-150"
                          />
                        </div>
                        <input 
                          type="text"
                          value={localColors.foreground}
                          onChange={(e) => handleHexInputChange("foreground", e.target.value)}
                          className="w-full bg-transparent text-xs font-mono font-bold text-zinc-800 outline-none uppercase focus:text-black"
                          maxLength={7}
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Superficie (Cajas)</label>
                      <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl p-2">
                        <div 
                          className="relative w-8 h-8 rounded-lg border border-zinc-200 shadow-2xs overflow-hidden shrink-0" 
                          style={{ backgroundColor: isValidHex(localColors.surface) ? localColors.surface : "#cccccc" }}
                        >
                          <input 
                            type="color" 
                            value={isValidHex(localColors.surface) ? localColors.surface : "#ffffff"} 
                            onChange={(e) => handleColorChange("surface", e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer scale-150"
                          />
                        </div>
                        <input 
                          type="text"
                          value={localColors.surface}
                          onChange={(e) => handleHexInputChange("surface", e.target.value)}
                          className="w-full bg-transparent text-xs font-mono font-bold text-zinc-800 outline-none uppercase focus:text-black"
                          maxLength={7}
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Líneas y Bordes</label>
                      <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl p-2">
                        <div 
                          className="relative w-8 h-8 rounded-lg border border-zinc-200 shadow-2xs overflow-hidden shrink-0" 
                          style={{ backgroundColor: isValidHex(localColors.border) ? localColors.border : "#cccccc" }}
                        >
                          <input 
                            type="color" 
                            value={isValidHex(localColors.border) ? localColors.border : "#e5e5e5"} 
                            onChange={(e) => handleColorChange("border", e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer scale-150"
                          />
                        </div>
                        <input 
                          type="text"
                          value={localColors.border}
                          onChange={(e) => handleHexInputChange("border", e.target.value)}
                          className="w-full bg-transparent text-xs font-mono font-bold text-zinc-800 outline-none uppercase focus:text-black"
                          maxLength={7}
                          placeholder="#E5E5E5"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section: Colores de Etiquetas de Productos */}
                <section className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-1 text-black font-black uppercase tracking-tight">
                    <span className="text-amber-500 text-lg">🏷️</span>
                    <h3>Colores de Etiquetas de Productos</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Badge Nuevo */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Etiqueta "Nuevo"</label>
                        <span 
                          style={{ 
                            backgroundColor: isValidHex(localColors.badgeNew || "") ? localColors.badgeNew : "#F59E0B",
                            color: getContrastColor(localColors.badgeNew || "#F59E0B")
                          }}
                          className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-2xs"
                        >
                          Nuevo
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl p-2">
                        <div 
                          className="relative w-8 h-8 rounded-lg border border-zinc-200 shadow-2xs overflow-hidden shrink-0" 
                          style={{ backgroundColor: isValidHex(localColors.badgeNew || "") ? localColors.badgeNew : "#F59E0B" }}
                        >
                          <input 
                            type="color" 
                            value={isValidHex(localColors.badgeNew || "") ? localColors.badgeNew : "#f59e0b"} 
                            onChange={(e) => handleColorChange("badgeNew", e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer scale-150"
                          />
                        </div>
                        <input 
                          type="text"
                          value={localColors.badgeNew || ""}
                          onChange={(e) => handleHexInputChange("badgeNew", e.target.value)}
                          className="w-full bg-transparent text-xs font-mono font-bold text-zinc-800 outline-none uppercase focus:text-black"
                          maxLength={7}
                          placeholder="#F59E0B"
                        />
                      </div>
                    </div>

                    {/* Badge Destacado */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Etiqueta "Destacado"</label>
                        <span 
                          style={{ 
                            backgroundColor: isValidHex(localColors.badgeFeatured || "") ? localColors.badgeFeatured : "#18181B",
                            color: getContrastColor(localColors.badgeFeatured || "#18181B")
                          }}
                          className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-2xs"
                        >
                          Destacado
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl p-2">
                        <div 
                          className="relative w-8 h-8 rounded-lg border border-zinc-200 shadow-2xs overflow-hidden shrink-0" 
                          style={{ backgroundColor: isValidHex(localColors.badgeFeatured || "") ? localColors.badgeFeatured : "#18181B" }}
                        >
                          <input 
                            type="color" 
                            value={isValidHex(localColors.badgeFeatured || "") ? localColors.badgeFeatured : "#18181b"} 
                            onChange={(e) => handleColorChange("badgeFeatured", e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer scale-150"
                          />
                        </div>
                        <input 
                          type="text"
                          value={localColors.badgeFeatured || ""}
                          onChange={(e) => handleHexInputChange("badgeFeatured", e.target.value)}
                          className="w-full bg-transparent text-xs font-mono font-bold text-zinc-800 outline-none uppercase focus:text-black"
                          maxLength={7}
                          placeholder="#18181B"
                        />
                      </div>
                    </div>

                    {/* Badge Stock */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Etiqueta "Stock"</label>
                        <span 
                          style={{ 
                            backgroundColor: isValidHex(localColors.badgeStock || "") ? localColors.badgeStock : "#71717A",
                            color: getContrastColor(localColors.badgeStock || "#71717A")
                          }}
                          className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-2xs"
                        >
                          Stock: 5
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl p-2">
                        <div 
                          className="relative w-8 h-8 rounded-lg border border-zinc-200 shadow-2xs overflow-hidden shrink-0" 
                          style={{ backgroundColor: isValidHex(localColors.badgeStock || "") ? localColors.badgeStock : "#71717A" }}
                        >
                          <input 
                            type="color" 
                            value={isValidHex(localColors.badgeStock || "") ? localColors.badgeStock : "#71717a"} 
                            onChange={(e) => handleColorChange("badgeStock", e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer scale-150"
                          />
                        </div>
                        <input 
                          type="text"
                          value={localColors.badgeStock || ""}
                          onChange={(e) => handleHexInputChange("badgeStock", e.target.value)}
                          className="w-full bg-transparent text-xs font-mono font-bold text-zinc-800 outline-none uppercase focus:text-black"
                          maxLength={7}
                          placeholder="#71717A"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section: Textos del Banner Hero */}
                <section className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-1 text-black font-black uppercase tracking-tight">
                    <ImageIcon size={20} className="text-teal-500" />
                    <h3>Configuración del Banner</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Título de Campaña</label>
                        <input 
                          type="text" 
                          value={localBanner.title}
                          onChange={(e) => handleBannerChange("title", e.target.value)}
                          placeholder="Ej: Llegó lo NUEVO"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:border-black outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Etiqueta del Banner (Badge)</label>
                        <input 
                          type="text" 
                          value={localBanner.badge || ""}
                          onChange={(e) => handleBannerChange("badge", e.target.value)}
                          placeholder="Ej: Súper Ofertas"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:border-black outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Eslogan / Descripción corta</label>
                      <textarea 
                        value={localBanner.subtitle}
                        onChange={(e) => handleBannerChange("subtitle", e.target.value)}
                        placeholder="Ej: Herramientas profesionales para expertos."
                        rows={2}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:border-black outline-none transition-all resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-400 tracking-wider uppercase">Galería de Imágenes de Banner</label>
                      <div className="grid grid-cols-2 gap-3">
                        {(bannerPresets || PRESET_IMAGES).map((img) => {
                          const isSelected = localBanner.imageUrl === img.url;

                          return (
                            <div
                              key={img.name}
                              className={`group relative aspect-video rounded-2xl overflow-hidden border-2 transition-all ${
                                isSelected ? "border-black shadow-md ring-2 ring-black/10" : "border-transparent opacity-85 hover:opacity-100"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleBannerChange("imageUrl", img.url)}
                                className="absolute inset-0 w-full h-full text-left"
                              >
                                <Image 
                                  src={img.url} 
                                  alt={img.name}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                                <div className="absolute inset-0 bg-black/30 flex items-end p-2 group-hover:bg-black/10 transition-colors">
                                  <span className="text-[9px] font-black text-white uppercase tracking-wider">{img.name}</span>
                                </div>
                                {isSelected && (
                                  <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black text-white flex items-center justify-center border border-white z-10 shadow-sm">
                                    <Check size={12} strokeWidth={3} />
                                  </div>
                                )}
                              </button>

                              {/* Camera quick-upload button for preset banner */}
                              <label className="absolute top-2 left-2 h-6 w-6 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center border border-white/20 cursor-pointer shadow-lg hover:scale-105 active:scale-95 transition-all z-20">
                                <Camera size={11} />
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleBannerImageUpload(img.name, file);
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section: Información Comercial */}
                <section className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-1 text-black font-black uppercase tracking-tight">
                    <Settings size={20} className="text-zinc-500" />
                    <h3>Información Comercial</h3>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-zinc-50/50 rounded-2xl border border-zinc-150">
                    <div className="relative group shrink-0">
                      <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-zinc-200 bg-white flex items-center justify-center shadow-inner relative">
                        {localStore.logoUrl ? (
                          <img src={localStore.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xl font-black text-zinc-300">
                            {localStore.name ? localStore.name.charAt(0).toUpperCase() : "M"}
                          </span>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-black text-white flex items-center justify-center shadow-md cursor-pointer hover:bg-zinc-800 transition-colors active:scale-95">
                        <Camera size={12} />
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                handleStoreChange("logoUrl", reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div className="flex-1 space-y-1 text-center md:text-left">
                      <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Logo de la Empresa</h4>
                      <p className="text-[11px] text-zinc-500">Se mostrará en el catálogo y en la esquina del banner principal. Recomendado formato cuadrado.</p>
                      {localStore.logoUrl && (
                        <button 
                          type="button" 
                          onClick={() => handleStoreChange("logoUrl", "")}
                          className="mt-1 text-[10px] font-black text-red-600 hover:text-red-700 uppercase tracking-wider transition-colors"
                        >
                          Quitar logo
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Nombre del Comercio</label>
                      <input 
                        type="text" 
                        value={localStore.name}
                        onChange={(e) => handleStoreChange("name", e.target.value)}
                        placeholder="Ej: Importadora Martin Store"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:border-black outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Teléfono de Pedidos (WhatsApp)</label>
                      <input 
                        type="text" 
                        value={localStore.whatsAppNumber}
                        onChange={(e) => handleStoreChange("whatsAppNumber", e.target.value)}
                        placeholder="Ej: 5491122334455"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:border-black outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Horarios de Retiro</label>
                      <input 
                        type="text" 
                        value={localStore.pickupHours || ""}
                        onChange={(e) => handleStoreChange("pickupHours", e.target.value)}
                        placeholder="Ej: lunes a viernes de 9:00 a 18:00 hs"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:border-black outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Dirección de Retiro</label>
                      <input 
                        type="text" 
                        value={localStore.pickupAddress || ""}
                        onChange={(e) => handleStoreChange("pickupAddress", e.target.value)}
                        placeholder="Ej: Alvear 2580, Ramos Mejía, Buenos Aires."
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:border-black outline-none transition-all"
                      />
                    </div>
                  </div>
                </section>

                {/* Danger Zone */}
                <section className="bg-red-50/50 rounded-3xl p-6 border border-red-100 shadow-sm flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Info className="text-red-500 mt-0.5 shrink-0" size={20} />
                    <div>
                      <h4 className="text-sm font-bold text-red-950 uppercase tracking-tight">Restablecer Estética</h4>
                      <p className="text-[11px] text-red-700">Vuelve a configurar los colores dorados y fotos de demostración por defecto.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleResetBranding}
                    className="flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 text-xs font-bold transition-all active:scale-95 shadow-md shadow-red-200"
                  >
                    <Trash2 size={14} />
                    Resetear
                  </button>
                </section>

              </div>

              {/* RIGHT COLUMN: Interactive Dynamic Preview */}
              <div className="lg:col-span-5">
                <div className="sticky top-28 space-y-4">
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Previsualización del Tema</h4>
                  
                  {/* Catalog Mobile Frame Preview Mockup */}
                  <div 
                    className="w-full rounded-[2.5rem] border-[8px] border-zinc-950 shadow-2xl overflow-hidden aspect-[9/18] max-h-[680px] relative flex flex-col transition-colors duration-500"
                    style={{ backgroundColor: localColors.background }}
                  >
                    {/* Speaker & camera slot */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-zinc-950 h-5 w-32 rounded-b-2xl z-30" />
                    
                    {/* Mini Header Mock */}
                    <div className="h-16 pt-5 px-4 flex items-center gap-2 border-b transition-colors duration-500 z-10" style={{ backgroundColor: localColors.surface, borderColor: localColors.border }}>
                      <div className="h-8 w-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center text-[10px]">🛒</div>
                      <div className="flex-1 h-8 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center px-2 text-[9px] text-zinc-400">
                        Buscar en el catálogo...
                      </div>
                    </div>

                    {/* Scrollable Catalog Mock */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar">
                      
                      {/* Custom Dynamic Banner Mock */}
                      <div 
                        className="rounded-2xl p-4 border relative overflow-hidden flex items-center min-h-[120px] transition-colors duration-500"
                        style={{ borderColor: localColors.border }}
                      >
                        {/* Background Image with cover */}
                        {localBanner.imageUrl && (
                          <div className="absolute inset-0 w-full h-full z-0">
                            <Image 
                              src={localBanner.imageUrl} 
                              alt="Banner background" 
                              fill 
                              className="object-cover"
                              unoptimized
                            />
                            {/* Dark gradient overlay to ensure text readability */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-transparent z-0" />
                          </div>
                        )}

                        <div className="relative z-10 flex flex-col gap-1 max-w-[140px]">
                          <div className="flex items-center gap-1.5" style={{ color: localColors.primary }}>
                            {localStore.logoUrl ? (
                              <div className="h-4 w-4 rounded-full overflow-hidden border border-current bg-white flex items-center justify-center shrink-0">
                                <img src={localStore.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                              </div>
                            ) : (
                              <div className="h-4 w-4 rounded-full bg-current/25 border border-current flex items-center justify-center text-[7px] font-black shrink-0">
                                {localStore.name ? localStore.name.charAt(0).toUpperCase() : "M"}
                              </div>
                            )}
                            <span className="text-[7px] font-black uppercase tracking-widest leading-none truncate max-w-[90px]">
                              {localBanner.badge || "Súper Ofertas"}
                            </span>
                          </div>
                          <h5 className="text-xs font-black text-white leading-tight">
                            {localBanner.title}
                          </h5>
                          <p className="text-[8px] text-zinc-200 max-w-[125px]">
                            {localBanner.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Categories mock */}
                      <div>
                        <h6 className="text-[9px] font-black uppercase tracking-tight mb-2 flex items-center gap-1" style={{ color: localColors.foreground }}>
                          <span style={{ color: localColors.primary }}>✨</span> Categorías
                        </h6>
                        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                          {["Todos", "Inalámbricas", "Eléctricas"].map((cat, idx) => (
                            <span 
                              key={cat} 
                              className="text-[8px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border transition-all"
                              style={{ 
                                backgroundColor: idx === 0 ? localColors.primary : localColors.surface, 
                                color: idx === 0 ? "#000" : localColors.foreground,
                                borderColor: localColors.border
                              }}
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Product list mock */}
                      <div>
                        <h6 className="text-[9px] font-black uppercase tracking-tight mb-2 flex items-center gap-1" style={{ color: localColors.foreground }}>
                          <span style={{ color: localColors.primary }}>★</span> Destacados
                        </h6>
                        <div className="grid grid-cols-2 gap-3">
                          {[1, 2].map((i) => (
                            <div 
                              key={i} 
                              className="rounded-2xl p-2 border transition-all duration-500"
                              style={{ backgroundColor: localColors.surface, borderColor: localColors.border }}
                            >
                              <div className="aspect-square bg-zinc-50 rounded-xl mb-1.5 relative border border-zinc-100 flex items-center justify-center">
                                <span className="text-[20px]">🛠️</span>
                              </div>
                              <p className="text-[8px] font-bold line-clamp-1 leading-tight" style={{ color: localColors.foreground }}>Herramienta Especial</p>
                              <p className="text-[9px] font-black mt-1" style={{ color: localColors.primary }}>$125.000</p>
                              <button 
                                type="button"
                                className="w-full text-[8px] font-black uppercase py-1.5 rounded-lg mt-2 text-center text-white transition-colors"
                                style={{ backgroundColor: localColors.foreground }}
                              >
                                Comprar
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Mini Bottom Nav Bar Mock */}
                    <div 
                      className="h-14 px-3 flex items-center justify-around border-t transition-colors duration-500"
                      style={{ backgroundColor: localColors.surface, borderColor: localColors.border }}
                    >
                      {["🏠", "📂", "🔍", "🛒", "⚙️"].map((emoji, idx) => (
                        <span 
                          key={idx} 
                          className="text-xs p-1"
                          style={{ 
                            opacity: idx === 4 ? 1 : 0.4,
                            filter: idx === 4 ? `drop-shadow(0 0 5px ${localColors.primary})` : 'none'
                          }}
                        >
                          {emoji}
                        </span>
                      ))}
                    </div>

                    {/* Dynamic Float WhatsApp Floating Badge Mock */}
                    <div 
                      className="absolute bottom-16 right-4 h-10 w-10 rounded-full flex items-center justify-center text-white text-xs shadow-lg transition-transform duration-300"
                      style={{ backgroundColor: "#25D366" }}
                    >
                      💬
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: SOCIAL SHARING & QR */}
          {activeTab === "share" && (
            <motion.div
              key="share"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-10 shadow-sm flex flex-col md:flex-row items-center gap-10">
                <div className="flex-1 space-y-6">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">Campañas de Marketing</span>
                  <h3 className="text-3xl font-black uppercase tracking-tight text-black leading-none">Comparte tu Catálogo con el Mundo</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Hemos diseñado una tarjeta de presentación corporativa y un código QR dinámico de alta definición para que puedas imprimirlos, colocarlos en tu local, o compartirlos por redes sociales de forma instantánea.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">✔</div>
                      <p className="text-xs text-zinc-700 font-bold">Generación instantánea para cualquier dispositivo.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">✔</div>
                      <p className="text-xs text-zinc-700 font-bold">Formatos limpios y optimizados para impresión física en banners.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">✔</div>
                      <p className="text-xs text-zinc-700 font-bold">Botón directo de compartir por WhatsApp Business.</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      onClick={handleCopyLink}
                      className="flex-1 bg-black text-white hover:bg-zinc-800 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md"
                    >
                      {linkCopied ? <Check size={16} /> : <Copy size={16} />}
                      {linkCopied ? "Copiado!" : "Copiar Enlace Público"}
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent("Hola! Te comparto nuestro catálogo de herramientas profesionales online: " + storeUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md text-center"
                    >
                      <Share2 size={16} />
                      Compartir en WhatsApp
                    </a>
                  </div>
                </div>

                <div ref={qrContainerRef} className="w-full md:w-80 bg-zinc-900 rounded-[2rem] p-8 border border-zinc-800 text-white flex flex-col items-center justify-between text-center relative overflow-hidden shadow-xl shadow-zinc-900/10 min-h-[400px]">
                  {/* Background Glow */}
                  <div className="absolute top-[-50%] right-[-50%] w-[100%] h-[100%] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
                  
                  <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 relative z-10">Código QR Oficial</h4>

                  <div className="my-6 bg-white p-4 rounded-2xl relative z-10 shadow-lg flex items-center justify-center">
                    <Image 
                      src={qrUrl}
                      alt="Marketing QR Code"
                      width={180}
                      height={180}
                      className="rounded-lg relative"
                      unoptimized
                    />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md border-[3px] border-white z-20 overflow-hidden">
                      <Image 
                        src={store.logoUrl || "/icon.jpg"}
                        alt="Logo"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </div>

                  <div className="relative z-10 w-full space-y-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-blue-400">{store.name}</p>
                      <p className="text-[10px] text-zinc-400 mt-1">Escanea para explorar el catálogo móvil</p>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={handleShareQR}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10"
                      >
                        <Share2 size={12} />
                        Compartir QR
                      </button>
                      <button 
                        onClick={handleDownloadQR}
                        className="flex-1 border border-zinc-700 hover:bg-zinc-800 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <Upload size={12} className="rotate-180" />
                        Descargar QR
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* PRODUCT CREATION/EDIT MODAL DIALOG */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProductModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <div className="flex min-h-screen items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="relative w-full max-w-2xl rounded-3xl bg-white border border-zinc-200 p-8 shadow-2xl text-zinc-900 z-10 space-y-6"
              >
                {/* Close trigger */}
                <button 
                  onClick={() => setIsProductModalOpen(false)}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 transition-colors"
                >
                  <X size={20} />
                </button>

                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-black">
                    {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Completa los datos técnicos e imágenes del artículo del catálogo.</p>
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nombre Comercial</label>
                      <input 
                        type="text"
                        required
                        value={productForm.name}
                        onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ej: Rotomartillo 800w Daihatsu"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs focus:border-black outline-none transition-all font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Categoría</label>
                      <div className="flex gap-2">
                        <select
                          value={productForm.category}
                          onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                          className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-700 outline-none"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setNewCatOpen(!newCatOpen)}
                          className="px-3 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-800 rounded-xl text-xs font-black"
                        >
                          + Cat
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Add New Category Dropdown form inline */}
                  <AnimatePresence>
                    {newCatOpen && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-2"
                      >
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Crear Nueva Categoría</p>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            placeholder="Nombre de la nueva categoría..."
                            className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-black"
                          />
                          <button
                            type="button"
                            onClick={handleCreateCategory}
                            className="bg-black text-white hover:bg-zinc-800 px-4 py-2.5 rounded-xl text-xs font-black uppercase"
                          >
                            Crear
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Precio ($ ARS)</label>
                      <input 
                        type="number"
                        required
                        value={productForm.price}
                        onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="Ej: 99000"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs focus:border-black outline-none transition-all font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Precio Original (Opcional)</label>
                      <input 
                        type="number"
                        value={productForm.originalPrice}
                        onChange={(e) => setProductForm(prev => ({ ...prev, originalPrice: e.target.value }))}
                        placeholder="Ej: 120000"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs focus:border-black outline-none transition-all font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Stock Disponible (Opcional)</label>
                      <input 
                        type="number"
                        value={productForm.stock}
                        onChange={(e) => setProductForm(prev => ({ ...prev, stock: e.target.value }))}
                        placeholder="Ilimitado"
                        min="0"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs focus:border-black outline-none transition-all font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Descripción Comercial del Producto</label>
                    <textarea 
                      required
                      value={productForm.description}
                      onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Escribe detalles técnicos, garantía, materiales, etc."
                      rows={3}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs focus:border-black outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Fotos del Producto ({productForm.images.length}/5)</label>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase">La primera foto será la Portada</span>
                    </div>

                    {/* Image slots grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {productForm.images.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50 flex items-center justify-center group/imgslot shadow-2xs">
                          <Image 
                            src={img} 
                            alt={`Foto ${idx + 1}`}
                            fill
                            className="object-contain p-2"
                            unoptimized
                          />
                          
                          {/* Top corner Index badge */}
                          <div className="absolute top-2 left-2 bg-black/65 backdrop-blur-xs text-white px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider select-none z-10 flex items-center gap-1">
                            {idx === 0 ? (
                              <span className="text-amber-400">★ Portada</span>
                            ) : (
                              <span>Foto {idx + 1}</span>
                            )}
                          </div>

                          {/* Hover action overlay */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/imgslot:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2 z-10">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  // Set as primary (move to index 0)
                                  setProductForm(prev => {
                                    const nextImages = [...prev.images];
                                    const [target] = nextImages.splice(idx, 1);
                                    return {
                                      ...prev,
                                      images: [target, ...nextImages]
                                    };
                                  });
                                }}
                                className="w-full max-w-[110px] bg-white text-zinc-950 text-[8px] font-black uppercase tracking-wider py-1.5 rounded-lg hover:bg-zinc-100 active:scale-95 transition-all text-center flex items-center justify-center gap-1"
                              >
                                Principal
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                // Delete photo
                                setProductForm(prev => ({
                                  ...prev,
                                  images: prev.images.filter((_, i) => i !== idx)
                                }));
                              }}
                              className="w-full max-w-[110px] bg-red-600 text-white text-[8px] font-black uppercase tracking-wider py-1.5 rounded-lg hover:bg-red-700 active:scale-95 transition-all text-center flex items-center justify-center gap-1"
                            >
                              <Trash2 size={10} />
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Dropzone upload button slot if < 5 */}
                      {productForm.images.length < 5 && (
                        <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-zinc-300 hover:border-black bg-zinc-50 hover:bg-zinc-100/30 rounded-2xl cursor-pointer transition-all duration-300 p-4 text-center group">
                          <div className="flex flex-col items-center justify-center space-y-1.5">
                            <div className="p-2.5 bg-zinc-100 rounded-full text-zinc-400 group-hover:text-black group-hover:bg-white shadow-xs transition-all duration-300">
                              <Upload size={16} strokeWidth={2.5} />
                            </div>
                            <div>
                              <p className="text-[8px] font-black uppercase text-zinc-700 tracking-wider">Subir Foto</p>
                              <p className="text-[7px] text-zinc-400 mt-0.5 uppercase tracking-wide">Hasta 5 máx.</p>
                            </div>
                          </div>
                          <input 
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files) {
                                const newImages = [...productForm.images];
                                const remainingSlots = 5 - newImages.length;
                                const filesToProcess = Array.from(files).slice(0, remainingSlots);

                                filesToProcess.forEach((file) => {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    const base64 = reader.result as string;
                                    setProductForm(prev => {
                                      if (prev.images.length >= 5) return prev;
                                      return {
                                        ...prev,
                                        images: [...prev.images, base64]
                                      };
                                    });
                                  };
                                  reader.readAsDataURL(file);
                                });
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={productForm.isNew}
                        onChange={(e) => setProductForm(prev => ({ ...prev, isNew: e.target.checked }))}
                        className="w-4 h-4 accent-black rounded border-zinc-300"
                      />
                      <span className="text-xs font-bold text-zinc-700 uppercase tracking-wide">Marcar como "Nuevo" (Badge)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={productForm.isFeatured}
                        onChange={(e) => setProductForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                        className="w-4 h-4 accent-black rounded border-zinc-300"
                      />
                      <span className="text-xs font-bold text-zinc-700 uppercase tracking-wide">Destacar Producto (Carrusel)</span>
                    </label>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setIsProductModalOpen(false)}
                      className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-black text-white hover:bg-zinc-800 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-md"
                    >
                      {editingProduct ? "Guardar Cambios" : "Crear Producto"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>

          </div>
        )}

          {/* TAB: SECURITY */}
          {activeTab === "security" && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-xl mx-auto space-y-6"
            >
              {/* Current credentials info */}
              <div className="bg-white border border-zinc-200 rounded-[2rem] p-6 shadow-sm flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Credenciales Activas</p>
                  <p className="text-sm font-black text-zinc-900 mt-0.5">Usuario: <span className="font-mono text-blue-600">{adminUsername}</span></p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Contraseña: <span className="font-mono tracking-widest">••••••••</span></p>
                </div>
              </div>

              {/* Change credentials form */}
              <div className="bg-white border border-zinc-200 rounded-[2rem] p-8 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900 flex items-center gap-2">
                    <KeyRound size={18} className="text-blue-500" />
                    Cambiar Credenciales
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">Actualizá el usuario y/o la contraseña de acceso al panel administrativo.</p>
                </div>

                {/* Status messages */}
                <AnimatePresence>
                  {secStatus === "success" && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mb-5 p-3.5 bg-green-500/10 border border-green-500/30 rounded-xl text-xs font-bold text-green-700 flex items-center gap-2"
                    >
                      <Check size={14} strokeWidth={3} />
                      ¡Credenciales actualizadas exitosamente!
                    </motion.div>
                  )}
                  {secStatus === "error" && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-bold text-red-600 flex items-center gap-2"
                    >
                      <X size={14} />
                      {secErrorMsg}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleChangeCredentials} className="space-y-5">

                  {/* New Username */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider ml-1">
                      Nuevo Usuario <span className="text-zinc-400 normal-case font-normal">(dejá en blanco para mantener el actual)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                        <User size={16} />
                      </div>
                      <input
                        type="text"
                        value={secNewUsername}
                        onChange={(e) => setSecNewUsername(e.target.value)}
                        placeholder={adminUsername}
                        className="w-full bg-zinc-50 border border-zinc-200 focus:border-blue-400 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-400/40 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="border-t border-zinc-100 pt-5 space-y-4">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Cambio de Contraseña</p>

                    {/* Current Password */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider ml-1">Contraseña Actual <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                          <Lock size={16} />
                        </div>
                        <input
                          type={secShowCurrent ? "text" : "password"}
                          value={secCurrentPass}
                          onChange={(e) => setSecCurrentPass(e.target.value)}
                          required
                          placeholder="Contraseña actual"
                          className="w-full bg-zinc-50 border border-zinc-200 focus:border-blue-400 rounded-xl py-3 pl-10 pr-10 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-400/40 transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setSecShowCurrent(!secShowCurrent)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-700 transition-colors"
                        >
                          {secShowCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider ml-1">Nueva Contraseña <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                          <KeyRound size={16} />
                        </div>
                        <input
                          type={secShowNew ? "text" : "password"}
                          value={secNewPass}
                          onChange={(e) => setSecNewPass(e.target.value)}
                          required
                          minLength={6}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full bg-zinc-50 border border-zinc-200 focus:border-blue-400 rounded-xl py-3 pl-10 pr-10 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-400/40 transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setSecShowNew(!secShowNew)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-700 transition-colors"
                        >
                          {secShowNew ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {secNewPass.length > 0 && secNewPass.length < 6 && (
                        <p className="text-[10px] text-red-500 ml-1 font-medium">Debe tener al menos 6 caracteres</p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider ml-1">Confirmar Nueva Contraseña <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                          <KeyRound size={16} />
                        </div>
                        <input
                          type={secShowConfirm ? "text" : "password"}
                          value={secConfirmPass}
                          onChange={(e) => setSecConfirmPass(e.target.value)}
                          required
                          placeholder="Repetir nueva contraseña"
                          className={`w-full bg-zinc-50 border focus:border-blue-400 rounded-xl py-3 pl-10 pr-10 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-400/40 transition-all font-mono ${
                            secConfirmPass.length > 0 && secConfirmPass !== secNewPass
                              ? "border-red-300 bg-red-50"
                              : "border-zinc-200"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setSecShowConfirm(!secShowConfirm)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-700 transition-colors"
                        >
                          {secShowConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {secConfirmPass.length > 0 && secConfirmPass !== secNewPass && (
                        <p className="text-[10px] text-red-500 ml-1 font-medium">Las contraseñas no coinciden</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98] shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 hover:brightness-110 cursor-pointer"
                  >
                    <ShieldCheck size={15} />
                    Guardar Nuevas Credenciales
                  </button>
                </form>
              </div>

              {/* Warning note */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
                <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                  Las credenciales se guardan localmente en este navegador. Si limpiás el almacenamiento del navegador, deberás usar las credenciales por defecto: <span className="font-mono font-black">admin</span> / <span className="font-mono font-black">martin2026</span>.
                </p>
              </div>
            </motion.div>
          )}

          {/* TAB: DESIGNER */}
          {activeTab === "designer" && (
            <motion.div
              key="designer"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <BannerDesigner />
            </motion.div>
          )}

      </AnimatePresence>

      {/* CATEGORIES MANAGEMENT MODAL DIALOG */}
      <AnimatePresence>
        {isManageCategoriesOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsManageCategoriesOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <div className="flex min-h-screen items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="relative w-full max-w-lg rounded-3xl bg-white border border-zinc-200 p-8 shadow-2xl text-zinc-900 z-10 space-y-6"
              >
                {/* Close trigger */}
                <button 
                  onClick={() => setIsManageCategoriesOpen(false)}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>

                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2">
                    <Folder className="text-blue-600" size={22} />
                    Gestionar Categorías
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Agrega nuevas categorías o elimina las que ya no necesites para tus productos.</p>
                </div>

                {/* Add Category Form */}
                <form onSubmit={handleAddCategoryFromManage} className="flex gap-2">
                  <input
                    type="text"
                    value={manageCatName}
                    onChange={(e) => setManageCatName(e.target.value)}
                    placeholder="Nueva categoría (ej: Rotomartillos)..."
                    className="flex-1 bg-zinc-50 border border-zinc-200 focus:border-blue-500/50 rounded-2xl py-3 px-4 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-bold"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-black text-white hover:bg-zinc-800 px-5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-md flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={16} />
                    Agregar
                  </button>
                </form>

                {/* Categories List */}
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block ml-1">
                    Categorías Activas ({categories.length})
                  </label>
                  {categories.length === 0 ? (
                    <p className="text-xs text-zinc-400 text-center py-4 italic">No hay categorías registradas.</p>
                  ) : (
                    categories.map((cat) => {
                      const isDefault = cat.name.toLowerCase() === "otros" || cat.slug === "otros";
                      return (
                        <div 
                          key={cat.id} 
                          className="flex items-center justify-between p-3.5 bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/80 rounded-2xl transition-all"
                        >
                          <span className="text-xs font-black text-zinc-800 tracking-wide">{cat.name}</span>
                          {isDefault ? (
                            <span className="text-[9px] bg-zinc-200 text-zinc-600 font-black px-2.5 py-1 rounded-full uppercase tracking-wider select-none">
                              Por Defecto
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeleteCategoryFromManage(cat.id)}
                              className="text-zinc-400 hover:text-red-600 p-1.5 rounded-xl hover:bg-red-50 transition-colors cursor-pointer active:scale-90"
                              title="Eliminar Categoría"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="pt-4 border-t border-zinc-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsManageCategoriesOpen(false)}
                    className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>

              </motion.div>
            </div>

          </div>
        )}
      </AnimatePresence>

      {/* Floating Success Toast Notification */}
      <AnimatePresence>
        {productToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-black/90 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-xl border border-zinc-800 flex items-center gap-2.5 text-xs font-black uppercase tracking-wider shadow-amber-500/5"
          >
            <Check size={14} className="text-amber-400" strokeWidth={3} />
            <span>{productToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
