"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Palette, 
  ImageIcon as ImageIconIcon, 
  Type, 
  Sparkles, 
  Layers, 
  Plus, 
  Trash2, 
  Download, 
  Copy, 
  Save, 
  Undo2, 
  Redo2, 
  RotateCw, 
  Maximize2, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Bold, 
  Italic, 
  Upload, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  ChevronUp, 
  ChevronDown, 
  Sparkle,
  BadgeAlert,
  Flame,
  Star,
  FileDown,
  Check,
  ChevronLeft,
  RefreshCw,
  ShoppingBag,
  Grid
} from "lucide-react";
import { useProductStore } from "@/store/useProductStore";
import { useBannerStore, BannerLayer, BannerFormat, BANNER_FORMATS, PRESET_TEMPLATES } from "@/store/useBannerStore";
import { formatPrice } from "@/lib/utils";

// List of Google Fonts to load
const GOOGLE_FONTS = [
  { name: "Montserrat", family: "Montserrat, sans-serif" },
  { name: "Bebas Neue", family: "'Bebas Neue', sans-serif" },
  { name: "Outfit", family: "Outfit, sans-serif" },
  { name: "Playfair Display", family: "'Playfair Display', serif" },
  { name: "Inter", family: "Inter, sans-serif" }
];

export function BannerDesigner() {
  const { products } = useProductStore();
  const {
    savedDesigns,
    currentDesign,
    selectedLayerId,
    history,
    historyIndex,
    saveDesign,
    deleteDesign,
    duplicateDesign,
    createNewDesign,
    loadDesign,
    updateCurrentDesign,
    addLayer,
    updateLayer,
    deleteLayer,
    duplicateLayer,
    changeLayerOrder,
    selectLayer,
    setFormat,
    setBackground,
    undo,
    redo
  } = useBannerStore();

  // Navigation tabs inside the designer sidebar
  const [sidebarTab, setSidebarTab] = useState<"templates" | "products" | "text" | "stickers" | "images" | "layers">("templates");
  
  // Local state
  const [editorScale, setEditorScale] = useState(1);
  const [editorWidth, setEditorWidth] = useState(360);
  const [editorHeight, setEditorHeight] = useState(360);
  const [replacingLayerId, setReplacingLayerId] = useState<string | null>(null);
  
  // Custom font loading hook
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@400;700;900&family=Outfit:wght@400;600;800;900&family=Playfair+Display:ital,wght@0,600;1,400&family=Inter:wght@400;600;800&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // UI state
  const [isExporting, setIsExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  
  // Refs
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop state variables
  const dragInfoRef = useRef<{
    active: boolean;
    mode: 'move' | 'resize' | 'rotate' | null;
    layerId: string | null;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialW: number;
    initialH: number;
    initialRotation: number;
    resizeHandle: 'tl' | 'tr' | 'bl' | 'br' | null;
  }>({
    active: false,
    mode: null,
    layerId: null,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    initialW: 0,
    initialH: 0,
    initialRotation: 0,
    resizeHandle: null
  });

  // Guide snap line states (percentage)
  const [snapX, setSnapX] = useState<number | null>(null);
  const [snapY, setSnapY] = useState<number | null>(null);

  // Initialize a default design if none is active
  useEffect(() => {
    if (!currentDesign) {
      if (savedDesigns.length > 0) {
        loadDesign(savedDesigns[0].id);
      } else {
        // Load first template as starting layout
        loadDesign('tpl-liquidacion');
      }
    }
  }, [currentDesign, savedDesigns, loadDesign]);

  // Adjust canvas size to fit the container workspace responsively
  const handleResize = () => {
    if (!canvasContainerRef.current || !currentDesign) return;
    
    const container = canvasContainerRef.current;
    const padding = 32; // padding in workspace
    const maxW = container.clientWidth - padding;
    const maxH = container.clientHeight - padding;

    const nativeW = currentDesign.width || 1080;
    const nativeH = currentDesign.height || 1080;

    // Calculate scale factor
    let scale = 1;
    if (nativeW / nativeH > maxW / maxH) {
      scale = maxW / nativeW;
    } else {
      scale = maxH / nativeH;
    }

    // Cap scale at 1.2 to avoid overstretching
    scale = Math.min(scale, 1.2);

    setEditorScale(scale);
    setEditorWidth(nativeW * scale);
    setEditorHeight(nativeH * scale);
  };

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentDesign]);

  useEffect(() => {
    // Small delay to ensure render is completed
    setTimeout(handleResize, 100);
  }, [sidebarTab]);

  // Dynamic values helper
  if (!currentDesign) {
    return (
      <div className="flex h-[70vh] items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-200">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-zinc-400" />
          <p className="mt-4 text-sm text-zinc-500 font-medium">Inicializando el Diseñador...</p>
        </div>
      </div>
    );
  }

  const selectedLayer = currentDesign.layers.find(l => l.id === selectedLayerId);

  // Handle layer modification
  const handleUpdateLayer = (layerId: string, updates: Partial<BannerLayer>) => {
    updateLayer(layerId, updates);
  };

  // Drag start handler
  const handleMouseDown = (
    e: React.MouseEvent | React.TouchEvent,
    layerId: string,
    mode: 'move' | 'resize' | 'rotate',
    handle: 'tl' | 'tr' | 'bl' | 'br' | null = null
  ) => {
    e.stopPropagation();
    
    const layer = currentDesign.layers.find(l => l.id === layerId);
    if (!layer || layer.locked) return;

    selectLayer(layerId);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragInfoRef.current = {
      active: true,
      mode,
      layerId,
      startX: clientX,
      startY: clientY,
      initialX: layer.x,
      initialY: layer.y,
      initialW: layer.width,
      initialH: layer.height,
      initialRotation: layer.rotation || 0,
      resizeHandle: handle
    };

    // Attach global window event listeners for smooth canvas-independent movements
    if ('touches' in e) {
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    } else {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
  };

  // Move handler
  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    const drag = dragInfoRef.current;
    if (!drag.active || !drag.layerId || !canvasRef.current) return;

    // Prevent scrolling on mobile during active dragging
    if (e.cancelable) e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const dx = clientX - drag.startX;
    const dy = clientY - drag.startY;

    // Convert pixels to canvas coordinate percentage
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const dxPercent = (dx / canvasRect.width) * 100;
    const dyPercent = (dy / canvasRect.height) * 100;

    const layer = currentDesign.layers.find(l => l.id === drag.layerId);
    if (!layer) return;

    if (drag.mode === 'move') {
      let nextX = drag.initialX + dxPercent;
      let nextY = drag.initialY + dyPercent;

      // Premium Snap Helpers: center snapping
      const layerCenterX = nextX + layer.width / 2;
      const layerCenterY = nextY + layer.height / 2;

      // Snap to vertical center (50%)
      if (Math.abs(layerCenterX - 50) < 2) {
        nextX = 50 - layer.width / 2;
        setSnapX(50);
      } else {
        setSnapX(null);
      }

      // Snap to horizontal center (50%)
      if (Math.abs(layerCenterY - 50) < 2) {
        nextY = 50 - layer.height / 2;
        setSnapY(50);
      } else {
        setSnapY(null);
      }

      handleUpdateLayer(drag.layerId, { x: nextX, y: nextY });
    } 
    else if (drag.mode === 'resize') {
      let nextW = drag.initialW;
      let nextH = drag.initialH;
      let nextX = layer.x;
      let nextY = layer.y;

      const ratio = drag.initialW / drag.initialH;

      if (drag.resizeHandle === 'br') {
        nextW = drag.initialW + dxPercent;
        // For stickers and images, maintain aspect ratio automatically
        if (layer.type === 'image' || layer.type === 'sticker') {
          nextH = nextW / ratio;
        } else {
          nextH = drag.initialH + dyPercent;
        }
      } 
      else if (drag.resizeHandle === 'bl') {
        nextW = drag.initialW - dxPercent;
        if (layer.type === 'image' || layer.type === 'sticker') {
          nextH = nextW / ratio;
        } else {
          nextH = drag.initialH + dyPercent;
        }
        nextX = drag.initialX + dxPercent;
      }
      else if (drag.resizeHandle === 'tr') {
        nextW = drag.initialW + dxPercent;
        if (layer.type === 'image' || layer.type === 'sticker') {
          nextH = nextW / ratio;
        } else {
          nextH = drag.initialH - dyPercent;
        }
        nextY = drag.initialY + dyPercent;
      }
      else if (drag.resizeHandle === 'tl') {
        nextW = drag.initialW - dxPercent;
        if (layer.type === 'image' || layer.type === 'sticker') {
          nextH = nextW / ratio;
        } else {
          nextH = drag.initialH - dyPercent;
        }
        nextX = drag.initialX + dxPercent;
        nextY = drag.initialY + dyPercent;
      }

      // Safeguards: minimum 4% size
      if (nextW > 4 && nextH > 4) {
        handleUpdateLayer(drag.layerId, {
          x: nextX,
          y: nextY,
          width: nextW,
          height: nextH
        });
      }
    }
    else if (drag.mode === 'rotate') {
      const rect = canvasRef.current.getBoundingClientRect();
      const layerElement = canvasRef.current.querySelector(`[data-layer-id="${drag.layerId}"]`);
      if (!layerElement) return;
      
      const layerRect = layerElement.getBoundingClientRect();
      const centerX = layerRect.left + layerRect.width / 2;
      const centerY = layerRect.top + layerRect.height / 2;

      // Calculate angle relative to center in radians then convert to degrees
      const angleRad = Math.atan2(clientY - centerY, clientX - centerX);
      let angleDeg = (angleRad * 180) / Math.PI + 90; // Offset by 90deg to start straight
      
      // Keep inside 0-360 range
      if (angleDeg < 0) angleDeg += 360;
      angleDeg = Math.round(angleDeg);

      // Snap rotation to increments of 45deg if close
      const snapInterval = 45;
      const snapThreshold = 4;
      const snapAngle = Math.round(angleDeg / snapInterval) * snapInterval;
      if (Math.abs(angleDeg - snapAngle) < snapThreshold) {
        angleDeg = snapAngle % 360;
      }

      handleUpdateLayer(drag.layerId, { rotation: angleDeg });
    }
  };

  // Up/End Drag handler
  const handleMouseUp = () => {
    const drag = dragInfoRef.current;
    if (drag.active) {
      drag.active = false;
      drag.mode = null;
      drag.layerId = null;
      setSnapX(null);
      setSnapY(null);

      // Push history state since interaction successfully completed
      updateCurrentDesign(prev => ({ ...prev }));
    }

    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    window.removeEventListener('touchmove', handleMouseMove);
    window.removeEventListener('touchend', handleMouseUp);
  };

  // Preset stickers vector components
  const renderStickerComponent = (type: string, w: number, h: number) => {
    switch (type) {
      case 'oferta':
        return (
          <div className="relative w-full h-full flex items-center justify-center select-none" style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.15))" }}>
            <div className="absolute inset-0 bg-red-600 rounded-full border-4 border-dashed border-yellow-300 animate-pulse flex items-center justify-center">
              <div className="absolute w-[86%] h-[86%] rounded-full bg-red-600 border border-yellow-300 flex items-center justify-center">
                <span className="text-[12%] uppercase tracking-widest font-black text-yellow-300 rotate-[-12deg] text-center" style={{ fontSize: `${h * 0.16}px`, lineHeight: 1.1 }}>
                  ¡OFERTA!
                </span>
              </div>
            </div>
            <Star className="absolute top-2 left-2 text-yellow-300 h-[15%] w-[15%]" />
            <Star className="absolute bottom-2 right-2 text-yellow-300 h-[15%] w-[15%]" />
          </div>
        );
      case 'promo-2x1':
        return (
          <div className="relative w-full h-full flex items-center justify-center select-none" style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.2))" }}>
            <div className="absolute w-[95%] h-[95%] bg-yellow-400 rotate-[45deg] rounded-lg border-2 border-black"></div>
            <div className="absolute w-[95%] h-[95%] bg-yellow-400 rotate-[-45deg] rounded-lg border-2 border-black flex items-center justify-center"></div>
            <div className="absolute w-[80%] h-[80%] rounded-full bg-red-600 border-2 border-white flex flex-col items-center justify-center">
              <span className="text-[24%] leading-none font-black text-white italic rotate-[-5deg] tracking-tighter" style={{ fontSize: `${h * 0.28}px` }}>2X1</span>
              <span className="text-[8%] leading-none font-bold text-yellow-300 tracking-wider rotate-[-5deg]" style={{ fontSize: `${h * 0.08}px` }}>PROMO</span>
            </div>
          </div>
        );
      case 'nuevo':
        return (
          <div className="w-full h-full flex items-center justify-center select-none" style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))" }}>
            <div className="w-[100%] h-[75%] rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 border-2 border-white flex items-center justify-center px-2 py-1 shadow-inner relative overflow-hidden">
              <div className="absolute -inset-1 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] animate-pulse"></div>
              <Sparkle className="h-[25%] w-[25%] text-yellow-300 mr-1 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="text-[12%] font-black uppercase tracking-wider text-white" style={{ fontSize: `${h * 0.16}px` }}>NUEVO</span>
            </div>
          </div>
        );
      case 'ultimas':
        return (
          <div className="w-full h-full flex items-center justify-center select-none" style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.15))" }}>
            <div className="w-[100%] h-[80%] bg-amber-500 rounded-lg border-2 border-black flex items-center justify-center gap-1.5 px-3 relative">
              <Flame className="h-[30%] w-[30%] text-red-600 fill-red-600 animate-bounce" />
              <span className="text-[10%] font-black uppercase text-black italic tracking-wide" style={{ fontSize: `${h * 0.12}px` }}>
                ÚLTIMAS UNIDADES
              </span>
            </div>
          </div>
        );
      default:
        return (
          <div className="w-full h-full bg-zinc-200 border-2 border-zinc-400 rounded flex items-center justify-center">
            <span className="text-zinc-500 text-xs">Sticker</span>
          </div>
        );
    }
  };

  // Add text layer helper
  const handleAddText = (type: 'title' | 'sub' | 'body') => {
    let text = 'Haz doble click para editar';
    let fontSize = 36;
    let fontWeight: 'normal' | 'bold' | '900' = 'normal';

    if (type === 'title') {
      text = 'AÑADIR TÍTULO';
      fontSize = 80;
      fontWeight = '900';
    } else if (type === 'sub') {
      text = 'Subtítulo informativo';
      fontSize = 40;
      fontWeight = 'bold';
    } else {
      text = 'Cuerpo de texto secundario';
      fontSize = 24;
    }

    addLayer({
      type: 'text',
      name: `Texto: ${text.substring(0, 10)}`,
      x: 15,
      y: 45,
      width: 70,
      height: 8,
      rotation: 0,
      opacity: 1,
      text,
      fontSize,
      fontFamily: 'Montserrat',
      color: currentDesign.background.value === '#ffffff' ? '#000000' : '#ffffff',
      align: 'center',
      fontWeight
    });
  };

  // Replace custom image layer helper
  const handleReplaceImage = (layerId: string) => {
    setReplacingLayerId(layerId);
    fileInputRef.current?.click();
  };

  // Add custom image layer helper
  const handleImageUploadClick = () => {
    setReplacingLayerId(null); // Clear replacement state if creating new image
    fileInputRef.current?.click();
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        if (replacingLayerId) {
          handleUpdateLayer(replacingLayerId, {
            src: dataUrl,
            name: `Imagen: ${file.name.substring(0, 10)}`
          });
          const { currentDesign } = useBannerStore.getState();
          if (currentDesign) {
            const updated = {
              ...currentDesign,
              layers: currentDesign.layers.map(l =>
                l.id === replacingLayerId ? { ...l, src: dataUrl, name: `Imagen: ${file.name.substring(0, 10)}` } : l
              )
            };
            useBannerStore.getState().pushHistory(updated);
          }
          setReplacingLayerId(null);
        } else {
          addLayer({
            type: 'image',
            name: `Imagen: ${file.name.substring(0, 10)}`,
            x: 25,
            y: 25,
            width: 50,
            height: 50,
            rotation: 0,
            opacity: 1,
            src: dataUrl
          });
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // Reset
  };

  // Product catalog auto-injector
  const handleInjectProduct = (prod: any) => {
    // 1. Add Product Image Layer
    const imgId = `layer-${Date.now()}-pimg`;
    addLayer({
      type: 'image',
      name: `Foto: ${prod.name.substring(0, 12)}`,
      x: 25,
      y: 32,
      width: 50,
      height: 48,
      rotation: 0,
      opacity: 1,
      src: prod.images[0] || "https://images.unsplash.com/photo-1530124560647-55e12e3f8961?q=80&w=600"
    });

    // 2. Add Product Name Layer
    addLayer({
      type: 'text',
      name: `Nombre: ${prod.name.substring(0, 12)}`,
      x: 10,
      y: 18,
      width: 80,
      height: 6,
      rotation: 0,
      opacity: 1,
      text: prod.name.toUpperCase(),
      fontSize: 48,
      fontFamily: 'Montserrat',
      color: currentDesign.background.value === '#ffffff' ? '#000000' : '#ffffff',
      align: 'center',
      fontWeight: 'bold'
    });

    // 3. Add Product Price Layer
    addLayer({
      type: 'text',
      name: `Precio: ${prod.name.substring(0, 12)}`,
      x: 20,
      y: 81,
      width: 60,
      height: 8,
      rotation: 0,
      opacity: 1,
      text: formatPrice(prod.price),
      fontSize: 78,
      fontFamily: 'Outfit',
      color: '#10B981', // green premium
      align: 'center',
      fontWeight: '900'
    });

    // 4. Check if product has discount, and inject sticker
    if (prod.originalPrice && prod.originalPrice > prod.price) {
      const discountPercent = Math.round((1 - prod.price / prod.originalPrice) * 100);
      addLayer({
        type: 'sticker',
        name: `Promo Descuento`,
        x: 68,
        y: 26,
        width: 18,
        height: 18,
        rotation: 15,
        opacity: 1,
        stickerType: 'oferta'
      });

      // Add a small overlay text inside the sticker if needed, or let the sticker handle it
    }

    // 5. Check if low stock (< 2) and add sticker
    if (prod.stock !== undefined && prod.stock <= 2 && prod.stock > 0) {
      addLayer({
        type: 'sticker',
        name: `Stock Alerta`,
        x: 10,
        y: 68,
        width: 22,
        height: 15,
        rotation: -10,
        opacity: 1,
        stickerType: 'ultimas'
      });
    }

    // Unselect all so layers look cohesive
    setTimeout(() => selectLayer(null), 300);
  };

  // High Resolution Render & Export Core
  const handleExport = async (format: 'png' | 'jpg' | 'pdf') => {
    setIsExporting(true);
    setExportMenuOpen(false);

    try {
      // 1. Create native resolution offscreen Canvas
      const canvas = document.createElement("canvas");
      canvas.width = currentDesign.width || 1080;
      canvas.height = currentDesign.height || 1080;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 2. Draw Background
      if (currentDesign.background.type === 'color') {
        ctx.fillStyle = currentDesign.background.value;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } 
      else if (currentDesign.background.type === 'gradient') {
        // Parse simple CSS linear-gradient e.g. linear-gradient(135deg, #1e0b36 0%, #4c0d6b 100%)
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        
        // Simple regex matches colors in gradient
        const matches = currentDesign.background.value.match(/#[a-fA-F0-9]{6}/g);
        if (matches && matches.length >= 2) {
          gradient.addColorStop(0, matches[0]);
          gradient.addColorStop(1, matches[1]);
        } else {
          // Fallback
          gradient.addColorStop(0, '#1e0b36');
          gradient.addColorStop(1, '#4c0d6b');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } 
      else if (currentDesign.background.type === 'image') {
        // Draw Image background
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise((resolve) => {
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(true);
          };
          img.onerror = () => {
            // Fallback back solid color
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            resolve(false);
          };
          img.src = currentDesign.background.value;
        });
      }

      // 3. Draw each layer (in order)
      for (const layer of currentDesign.layers) {
        if (layer.visible === false) continue;

        ctx.save();
        
        // Calculate absolute pixels
        const x = (layer.x / 100) * canvas.width;
        const y = (layer.y / 100) * canvas.height;
        const w = (layer.width / 100) * canvas.width;
        const h = (layer.height / 100) * canvas.height;
        
        // Translate to element center for rotation
        const centerX = x + w / 2;
        const centerY = y + h / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate(((layer.rotation || 0) * Math.PI) / 180);
        ctx.globalAlpha = layer.opacity !== undefined ? layer.opacity : 1;

        if (layer.type === 'text') {
          // Draw text
          const color = layer.color || "#000000";
          const fontFamily = layer.fontFamily || "Montserrat";
          const fontSize = layer.fontSize || 36;
          const fontWeight = layer.fontWeight || "normal";
          const fontStyle = layer.fontStyle || "normal";
          const align = layer.align || "center";
          
          ctx.fillStyle = color;
          ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
          ctx.textBaseline = "middle";
          ctx.textAlign = align;

          const textX = align === 'center' ? 0 : align === 'left' ? -w / 2 : w / 2;
          const textY = 0;

          // Simple wrap text mechanism
          const words = (layer.text || "").split(' ');
          let line = '';
          const lines = [];
          const maxWidth = w;
          const lineHeight = fontSize * 1.15;

          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
              lines.push(line);
              line = words[n] + ' ';
            } else {
              line = testLine;
            }
          }
          lines.push(line);

          // Draw multiple lines centered vertically
          const startY = textY - ((lines.length - 1) * lineHeight) / 2;
          for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i].trim(), textX, startY + i * lineHeight);
          }
        } 
        else if (layer.type === 'image' && layer.src) {
          // Draw image
          const imgSrc = layer.src;
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise((resolve) => {
            img.onload = () => {
              ctx.drawImage(img, -w / 2, -h / 2, w, h);
              resolve(true);
            };
            img.onerror = () => {
              // Draw placeholder rectangle on fail
              ctx.fillStyle = "#E4E4E7";
              ctx.fillRect(-w / 2, -h / 2, w, h);
              ctx.fillStyle = "#A1A1AA";
              ctx.font = "20px Arial";
              ctx.textAlign = "center";
              ctx.fillText("Error Imagen", 0, 0);
              resolve(false);
            };
            img.src = imgSrc;
          });
        } 
        else if (layer.type === 'shape') {
          // Draw shape
          ctx.fillStyle = layer.fillColor || "transparent";
          ctx.strokeStyle = layer.strokeColor || "transparent";
          ctx.lineWidth = layer.strokeWidth || 1;

          if (layer.shapeType === 'rect') {
            ctx.fillRect(-w / 2, -h / 2, w, h);
            if (layer.strokeColor && layer.strokeColor !== 'transparent') {
              ctx.strokeRect(-w / 2, -h / 2, w, h);
            }
          } 
          else if (layer.shapeType === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, Math.min(w, h) / 2, 0, 2 * Math.PI);
            ctx.fill();
            if (layer.strokeColor && layer.strokeColor !== 'transparent') {
              ctx.stroke();
            }
          }
        }
        else if (layer.type === 'sticker') {
          // Render Vector Stickers on Canvas!
          if (layer.stickerType === 'oferta') {
            // Draw red circular star burst
            ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
            ctx.shadowBlur = 15;
            ctx.fillStyle = "#DC2626"; // Red
            ctx.beginPath();
            ctx.arc(0, 0, w / 2, 0, 2 * Math.PI);
            ctx.fill();

            // Dash border
            ctx.shadowColor = "transparent";
            ctx.strokeStyle = "#FDE047"; // Yellow
            ctx.lineWidth = Math.max(3, w * 0.05);
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.arc(0, 0, (w / 2) - 4, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.setLineDash([]); // Reset

            // Label text tilted
            ctx.rotate((-12 * Math.PI) / 180);
            ctx.fillStyle = "#FDE047";
            ctx.font = `black ${Math.round(h * 0.20)}px Bebas Neue`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("¡OFERTA!", 0, 0);
          } 
          else if (layer.stickerType === 'promo-2x1') {
            // Draw tilted squares burst
            ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
            ctx.shadowBlur = 15;
            
            ctx.fillStyle = "#FACC15"; // Yellow
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 4;

            ctx.rotate((45 * Math.PI) / 180);
            ctx.fillRect(-w / 2, -h / 2, w, h);
            ctx.strokeRect(-w / 2, -h / 2, w, h);

            ctx.rotate((-90 * Math.PI) / 180);
            ctx.fillRect(-w / 2, -h / 2, w, h);
            ctx.strokeRect(-w / 2, -h / 2, w, h);

            ctx.rotate((45 * Math.PI) / 180); // Reset

            // Inner circle
            ctx.shadowColor = "transparent";
            ctx.fillStyle = "#DC2626"; // Red
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, w * 0.4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();

            // Text "2X1"
            ctx.rotate((-5 * Math.PI) / 180);
            ctx.fillStyle = "#FFFFFF";
            ctx.font = `black ${Math.round(h * 0.35)}px Bebas Neue`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("2X1", 0, -h * 0.05);

            ctx.fillStyle = "#FACC15";
            ctx.font = `bold ${Math.round(h * 0.10)}px Montserrat`;
            ctx.fillText("PROMO", 0, h * 0.18);
          } 
          else if (layer.stickerType === 'nuevo') {
            // Pill banner
            ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
            ctx.shadowBlur = 10;
            
            // Rounded rect path
            const rx = -w / 2;
            const ry = -h * 0.35;
            const rw = w;
            const rh = h * 0.7;
            const radius = 24;

            ctx.beginPath();
            ctx.moveTo(rx + radius, ry);
            ctx.lineTo(rx + rw - radius, ry);
            ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
            ctx.lineTo(rx + rw, ry + rh - radius);
            ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
            ctx.lineTo(rx + radius, ry + rh);
            ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
            ctx.lineTo(rx, ry + radius);
            ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
            ctx.closePath();

            // Gradient
            const grad = ctx.createLinearGradient(rx, 0, rx + rw, 0);
            grad.addColorStop(0, "#2563EB");
            grad.addColorStop(1, "#4F46E5");
            ctx.fillStyle = grad;
            ctx.fill();

            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 3;
            ctx.stroke();

            // Text "NUEVO"
            ctx.fillStyle = "#FFFFFF";
            ctx.shadowColor = "transparent";
            ctx.font = `black ${Math.round(h * 0.22)}px Montserrat`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("NUEVO", 0, 0);
          } 
          else if (layer.stickerType === 'ultimas') {
            // Warning capsule
            ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
            ctx.shadowBlur = 10;

            const rx = -w / 2;
            const ry = -h * 0.4;
            const rw = w;
            const rh = h * 0.8;
            const radius = 10;

            ctx.beginPath();
            ctx.moveTo(rx + radius, ry);
            ctx.lineTo(rx + rw - radius, ry);
            ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
            ctx.lineTo(rx + rw, ry + rh - radius);
            ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
            ctx.lineTo(rx + radius, ry + rh);
            ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
            ctx.lineTo(rx, ry + radius);
            ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
            ctx.closePath();

            ctx.fillStyle = "#F59E0B"; // Amber
            ctx.fill();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 3;
            ctx.stroke();

            // Text "ÚLTIMAS UNIDADES"
            ctx.fillStyle = "#000000";
            ctx.shadowColor = "transparent";
            ctx.font = `black italic ${Math.round(h * 0.18)}px Montserrat`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("ÚLTIMAS UNIDADES", 0, 0);
          }
        }

        ctx.restore();
      }

      // 4. Download file or trigger print
      if (format === 'png') {
        const url = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `${currentDesign.name.replace(/\s+/g, "_")}.png`;
        link.href = url;
        link.click();
      } 
      else if (format === 'jpg') {
        const url = canvas.toDataURL("image/jpeg", 0.95);
        const link = document.createElement("a");
        link.download = `${currentDesign.name.replace(/\s+/g, "_")}.jpg`;
        link.href = url;
        link.click();
      }
      else if (format === 'pdf') {
        // High resolution PDF print logic using offscreen image representation
        const url = canvas.toDataURL("image/png");
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Imprimir Banner - Importadora Martin</title>
                <style>
                  @page { size: auto; margin: 0mm; }
                  body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #000; }
                  img { max-width: 100%; max-height: 100%; object-fit: contain; page-break-inside: avoid; }
                  @media print {
                    body { background: #fff; }
                    img { width: 100vw; height: 100vh; object-fit: contain; }
                  }
                </style>
              </head>
              <body>
                <img src="${url}" onload="window.print();window.close();" />
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      }
    } catch (err) {
      console.error("Export failure", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveBtn = () => {
    saveDesign();
    setSaveToast("¡Diseño guardado exitosamente!");
    setTimeout(() => setSaveToast(null), 3000);
  };

  return (
    <div className="flex flex-col xl:flex-row h-[82vh] bg-zinc-50 border border-zinc-200 rounded-3xl overflow-hidden shadow-premium select-none relative">
      
      {/* Dynamic guides overlay lines inside the editor */}
      {snapX !== null && (
        <div 
          className="absolute z-40 bg-pink-500 pointer-events-none"
          style={{
            left: `calc(50% + ${sidebarTab ? '180px' : '0px'} + ${snapX}%)`,
            top: 0,
            bottom: 0,
            width: "1.5px"
          }}
        />
      )}
      {snapY !== null && (
        <div 
          className="absolute z-40 bg-pink-500 pointer-events-none"
          style={{
            top: `calc(50% + ${snapY}%)`,
            left: sidebarTab ? '380px' : 0,
            right: 0,
            height: "1.5px"
          }}
        />
      )}

      {/* 1. LEFT SIDEBAR PANEL (Toolbox & Elements selection) */}
      <div className="w-full xl:w-[380px] bg-white border-b xl:border-b-0 xl:border-r border-zinc-200 flex flex-col shrink-0 z-30">
        
        {/* Horizontal icon bar */}
        <div className="flex border-b border-zinc-200 p-2 overflow-x-auto no-scrollbar gap-1">
          <button
            onClick={() => setSidebarTab("templates")}
            className={`flex-1 flex flex-col items-center gap-1 py-2 px-1.5 rounded-xl transition-all cursor-pointer ${
              sidebarTab === "templates" ? "bg-amber-50 text-amber-600 font-bold" : "text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            <Grid size={18} />
            <span className="text-[10px]">Plantillas</span>
          </button>
          
          <button
            onClick={() => setSidebarTab("products")}
            className={`flex-1 flex flex-col items-center gap-1 py-2 px-1.5 rounded-xl transition-all cursor-pointer ${
              sidebarTab === "products" ? "bg-amber-50 text-amber-600 font-bold" : "text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            <ShoppingBag size={18} />
            <span className="text-[10px]">Productos</span>
          </button>

          <button
            onClick={() => setSidebarTab("text")}
            className={`flex-1 flex flex-col items-center gap-1 py-2 px-1.5 rounded-xl transition-all cursor-pointer ${
              sidebarTab === "text" ? "bg-amber-50 text-amber-600 font-bold" : "text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            <Type size={18} />
            <span className="text-[10px]">Texto</span>
          </button>

          <button
            onClick={() => setSidebarTab("stickers")}
            className={`flex-1 flex flex-col items-center gap-1 py-2 px-1.5 rounded-xl transition-all cursor-pointer ${
              sidebarTab === "stickers" ? "bg-amber-50 text-amber-600 font-bold" : "text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            <Sparkles size={18} />
            <span className="text-[10px]">Etiquetas</span>
          </button>

          <button
            onClick={() => setSidebarTab("images")}
            className={`flex-1 flex flex-col items-center gap-1 py-2 px-1.5 rounded-xl transition-all cursor-pointer ${
              sidebarTab === "images" ? "bg-amber-50 text-amber-600 font-bold" : "text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            <Upload size={18} />
            <span className="text-[10px]">Subidas</span>
          </button>

          <button
            onClick={() => setSidebarTab("layers")}
            className={`flex-1 flex flex-col items-center gap-1 py-2 px-1.5 rounded-xl transition-all cursor-pointer ${
              sidebarTab === "layers" ? "bg-amber-50 text-amber-600 font-bold" : "text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            <Layers size={18} />
            <span className="text-[10px]">Capas</span>
          </button>
        </div>

        {/* Tab Content Drawer */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar max-h-[35vh] xl:max-h-none">
          <AnimatePresence mode="wait">
            
            {/* TAB: TEMPLATES */}
            {sidebarTab === "templates" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider mb-2">Plantillas Base</h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {PRESET_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => {
                          if (window.confirm(`¿Quieres cargar la plantilla "${tpl.name}"? Se perderá tu diseño actual no guardado.`)) {
                            loadDesign(tpl.id);
                          }
                        }}
                        className="group flex items-center justify-between p-3 border border-zinc-200 hover:border-amber-400 rounded-xl hover:bg-zinc-50 transition-all text-left cursor-pointer"
                      >
                        <div>
                          <p className="text-sm font-bold text-zinc-800">{tpl.name}</p>
                          <span className="text-[10px] text-zinc-500 font-medium bg-zinc-100 px-1.5 py-0.5 rounded uppercase">
                            {BANNER_FORMATS[tpl.format].aspectRatio} - {BANNER_FORMATS[tpl.format].name.split('-').join(' ')}
                          </span>
                        </div>
                        <Plus size={16} className="text-zinc-400 group-hover:text-amber-500 group-hover:scale-110 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider mb-2">Mis Diseños Guardados</h3>
                  {savedDesigns.length === 0 ? (
                    <div className="p-4 text-center border border-dashed border-zinc-200 rounded-xl">
                      <p className="text-xs text-zinc-400 font-medium">Aún no tienes diseños guardados</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {savedDesigns.map((dsg) => (
                        <div
                          key={dsg.id}
                          className="flex items-center justify-between p-2.5 border border-zinc-200 rounded-xl hover:border-zinc-300 transition-all"
                        >
                          <button
                            onClick={() => loadDesign(dsg.id)}
                            className="flex-1 text-left font-semibold text-zinc-800 text-xs truncate mr-2 cursor-pointer hover:text-amber-600"
                          >
                            {dsg.name}
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => duplicateDesign(dsg.id)}
                              title="Duplicar"
                              className="p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer transition-all"
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm("¿Seguro que deseas eliminar este diseño?")) {
                                  deleteDesign(dsg.id);
                                }
                              }}
                              className="p-1 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-all"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB: PRODUCTS CATALOG INJECTION */}
            {sidebarTab === "products" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <p className="text-[10px] text-amber-800 leading-relaxed font-semibold">
                    💡 Haz click en cualquier producto para insertar su imagen, título, precio, descuento y alertas de stock de manera inteligente en el canvas.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {products.map((prod) => (
                    <button
                      key={prod.id}
                      onClick={() => handleInjectProduct(prod)}
                      className="group flex items-center gap-3 p-2 border border-zinc-200 hover:border-amber-400 rounded-xl text-left transition-all cursor-pointer bg-white"
                    >
                      <div className="w-12 h-12 rounded-lg bg-zinc-100 overflow-hidden shrink-0 border border-zinc-100">
                        <img 
                          src={prod.images[0]} 
                          alt={prod.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-all"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-zinc-800 truncate leading-none mb-1">{prod.name}</p>
                        <span className="text-[10px] font-black text-amber-500">{formatPrice(prod.price)}</span>
                        {prod.stock !== undefined && (
                          <span className="ml-2 text-[9px] text-zinc-400 font-semibold bg-zinc-100 px-1 rounded">
                            Stock: {prod.stock}
                          </span>
                        )}
                      </div>
                      <Plus size={15} className="text-zinc-400 group-hover:text-amber-500 shrink-0" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* TAB: TEXT DRAWER */}
            {sidebarTab === "text" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Añadir textos</h4>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => handleAddText("title")}
                    className="w-full text-center py-3 border-2 border-zinc-200 hover:border-amber-400 rounded-xl font-black text-base cursor-pointer hover:bg-zinc-50 transition-all"
                  >
                    Añadir Título
                  </button>
                  <button
                    onClick={() => handleAddText("sub")}
                    className="w-full text-center py-2.5 border border-zinc-200 hover:border-amber-400 rounded-xl font-bold text-xs cursor-pointer hover:bg-zinc-50 transition-all text-zinc-700"
                  >
                    Añadir Subtítulo
                  </button>
                  <button
                    onClick={() => handleAddText("body")}
                    className="w-full text-center py-2 border border-dashed border-zinc-200 hover:border-amber-400 rounded-xl font-medium text-2xs cursor-pointer hover:bg-zinc-50 transition-all text-zinc-500"
                  >
                    Cuerpo de texto
                  </button>
                </div>
              </motion.div>
            )}

            {/* TAB: STICKERS & BADGES */}
            {sidebarTab === "stickers" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Etiquetas Publicitarias</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => addLayer({
                      type: 'sticker',
                      name: 'Sticker: Oferta',
                      x: 40,
                      y: 40,
                      width: 20,
                      height: 20,
                      rotation: 12,
                      opacity: 1,
                      stickerType: 'oferta'
                    })}
                    className="flex flex-col items-center gap-2 p-3 border border-zinc-200 hover:border-amber-400 rounded-2xl cursor-pointer hover:bg-zinc-50 transition-all"
                  >
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-red-50">
                      <Star className="text-red-500 fill-red-200 h-8 w-8 animate-pulse" />
                    </div>
                    <span className="text-2xs font-bold text-zinc-600">¡OFERTA!</span>
                  </button>

                  <button
                    onClick={() => addLayer({
                      type: 'sticker',
                      name: 'Sticker: 2X1',
                      x: 40,
                      y: 40,
                      width: 20,
                      height: 20,
                      rotation: -10,
                      opacity: 1,
                      stickerType: 'promo-2x1'
                    })}
                    className="flex flex-col items-center gap-2 p-3 border border-zinc-200 hover:border-amber-400 rounded-2xl cursor-pointer hover:bg-zinc-50 transition-all"
                  >
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-yellow-50">
                      <Sparkles className="text-yellow-600 h-8 w-8" />
                    </div>
                    <span className="text-2xs font-bold text-zinc-600">PROMO 2X1</span>
                  </button>

                  <button
                    onClick={() => addLayer({
                      type: 'sticker',
                      name: 'Sticker: Nuevo',
                      x: 40,
                      y: 40,
                      width: 22,
                      height: 12,
                      rotation: 0,
                      opacity: 1,
                      stickerType: 'nuevo'
                    })}
                    className="flex flex-col items-center gap-2 p-3 border border-zinc-200 hover:border-amber-400 rounded-2xl cursor-pointer hover:bg-zinc-50 transition-all"
                  >
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-blue-50">
                      <Sparkle className="text-blue-500 h-8 w-8" />
                    </div>
                    <span className="text-2xs font-bold text-zinc-600">NUEVO</span>
                  </button>

                  <button
                    onClick={() => addLayer({
                      type: 'sticker',
                      name: 'Sticker: Últimas',
                      x: 35,
                      y: 40,
                      width: 30,
                      height: 12,
                      rotation: 0,
                      opacity: 1,
                      stickerType: 'ultimas'
                    })}
                    className="flex flex-col items-center gap-2 p-3 border border-zinc-200 hover:border-amber-400 rounded-2xl cursor-pointer hover:bg-zinc-50 transition-all"
                  >
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-amber-50">
                      <Flame className="text-amber-500 fill-amber-100 h-8 w-8" />
                    </div>
                    <span className="text-2xs font-bold text-zinc-600">ÚLTIMAS UNIDADES</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* TAB: UPLOAD CUSTOM GRAPHICS */}
            {sidebarTab === "images" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Subir tus logos / imágenes</h4>
                <div 
                  onClick={handleImageUploadClick}
                  className="border-2 border-dashed border-zinc-300 hover:border-amber-400 rounded-2xl p-6 text-center cursor-pointer hover:bg-zinc-50 transition-all flex flex-col items-center justify-center gap-2"
                >
                  <Upload className="h-8 w-8 text-zinc-400 animate-bounce" />
                  <span className="text-xs font-bold text-zinc-600">Cargar Archivo</span>
                  <span className="text-[10px] text-zinc-400 font-medium">Soporta PNG, JPG</span>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </motion.div>
            )}

            {/* TAB: LAYERS MANAGEMENT */}
            {sidebarTab === "layers" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Capas del Lienzo</h4>
                {currentDesign.layers.length === 0 ? (
                  <p className="text-xs text-zinc-400 font-medium text-center py-4">No hay capas en el diseño</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {[...currentDesign.layers].reverse().map((layer) => {
                      const isSel = layer.id === selectedLayerId;
                      return (
                        <div 
                          key={layer.id}
                          onClick={() => selectLayer(layer.id)}
                          className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            isSel ? 'border-amber-500 bg-amber-50/50 font-bold' : 'border-zinc-200 hover:bg-zinc-50'
                          }`}
                        >
                          <span className="truncate max-w-[150px]">{layer.name}</span>
                          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => handleUpdateLayer(layer.id, { visible: layer.visible === false })}
                              className="p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-zinc-600 transition-all"
                            >
                              {layer.visible === false ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                            <button
                              onClick={() => handleUpdateLayer(layer.id, { locked: !layer.locked })}
                              className="p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-zinc-600 transition-all"
                            >
                              {layer.locked ? <Lock size={13} /> : <Unlock size={13} />}
                            </button>
                            <button
                              onClick={() => changeLayerOrder(layer.id, 'up')}
                              className="p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-zinc-600 transition-all"
                              title="Subir nivel"
                            >
                              <ChevronUp size={13} />
                            </button>
                            <button
                              onClick={() => changeLayerOrder(layer.id, 'down')}
                              className="p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-zinc-600 transition-all"
                              title="Bajar nivel"
                            >
                              <ChevronDown size={13} />
                            </button>
                            <button
                              onClick={() => deleteLayer(layer.id)}
                              className="p-1 hover:bg-red-50 rounded text-zinc-400 hover:text-red-500 transition-all"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Saved format indicator / change button */}
        <div className="border-t border-zinc-200 p-4 bg-zinc-50">
          <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">
            Formato y Tamaño del Banner
          </label>
          <select
            value={currentDesign.format}
            onChange={(e) => setFormat(e.target.value as BannerFormat)}
            className="w-full text-xs font-bold bg-white border border-zinc-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-2xs"
          >
            {Object.keys(BANNER_FORMATS).map((f) => (
              <option key={f} value={f}>
                {BANNER_FORMATS[f as BannerFormat].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. CENTER STAGE (Canvas Editor Workspace) */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Top Control Action Bar (Undo, Redo, Duplicate, Save, Export) */}
        <header className="h-14 border-b border-zinc-200 bg-white px-4 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            {/* Design Name text input */}
            <input 
              type="text"
              value={currentDesign.name}
              onChange={(e) => updateCurrentDesign({ name: e.target.value })}
              className="text-sm font-bold text-zinc-800 border-b border-transparent hover:border-zinc-300 focus:border-amber-500 focus:outline-none px-1 py-0.5 max-w-[200px]"
            />
            
            {/* Undo / Redo buttons */}
            <div className="flex items-center border-l border-zinc-200 pl-3 gap-1">
              <button 
                onClick={undo}
                disabled={historyIndex <= 0}
                className="p-1.5 text-zinc-400 hover:text-zinc-800 disabled:opacity-30 disabled:hover:text-zinc-400 rounded-lg hover:bg-zinc-100 transition-all cursor-pointer"
                title="Deshacer"
              >
                <Undo2 size={16} />
              </button>
              <button 
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 text-zinc-400 hover:text-zinc-800 disabled:opacity-30 disabled:hover:text-zinc-400 rounded-lg hover:bg-zinc-100 transition-all cursor-pointer"
                title="Rehacer"
              >
                <Redo2 size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            
            {/* Quick clean design btn */}
            <button
              onClick={() => {
                if (window.confirm("¿Seguro que deseas vaciar todas las capas del diseño actual?")) {
                  updateCurrentDesign({ layers: [] });
                }
              }}
              className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer font-bold border border-zinc-200 shadow-2xs"
            >
              Vaciar
            </button>

            {/* Save Button */}
            <button
              onClick={handleSaveBtn}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-black uppercase text-white shadow-sm hover:shadow active:scale-[0.98] transition-all cursor-pointer"
            >
              <Save size={14} />
              Guardar
            </button>

            {/* Export Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black hover:bg-zinc-800 text-xs font-black uppercase text-white shadow-sm hover:shadow active:scale-[0.98] transition-all cursor-pointer"
              >
                <Download size={14} />
                Exportar
              </button>

              <AnimatePresence>
                {exportMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setExportMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-2xl shadow-xl p-2 z-50 flex flex-col gap-1"
                    >
                      <button
                        onClick={() => handleExport("png")}
                        className="flex items-center gap-2.5 w-full text-left p-2.5 hover:bg-zinc-50 text-xs font-bold text-zinc-700 rounded-xl cursor-pointer transition-all"
                      >
                        <FileDown size={14} className="text-zinc-400" />
                        Descargar PNG
                      </button>
                      <button
                        onClick={() => handleExport("jpg")}
                        className="flex items-center gap-2.5 w-full text-left p-2.5 hover:bg-zinc-50 text-xs font-bold text-zinc-700 rounded-xl cursor-pointer transition-all"
                      >
                        <FileDown size={14} className="text-zinc-400" />
                        Descargar JPG (Ventas)
                      </button>
                      <button
                        onClick={() => handleExport("pdf")}
                        className="flex items-center gap-2.5 w-full text-left p-2.5 hover:bg-zinc-50 text-xs font-bold text-zinc-700 rounded-xl cursor-pointer transition-all border-t border-zinc-100"
                      >
                        <FileDown size={14} className="text-zinc-400" />
                        Imprimir / Guardar PDF
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Dynamic Contextual Toolbar (Shows details ONLY if layer is selected) */}
        <div className="h-12 border-b border-zinc-200 bg-white/70 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20 overflow-x-auto no-scrollbar">
          {selectedLayer ? (
            <div className="flex items-center gap-3.5 w-full">
              
              {/* Type specific context styling buttons */}
              {selectedLayer.type === 'text' && (
                <>
                  {/* Font Family selector */}
                  <select
                    value={selectedLayer.fontFamily || "Montserrat"}
                    onChange={(e) => handleUpdateLayer(selectedLayer.id, { fontFamily: e.target.value })}
                    className="text-xs font-bold border border-zinc-300 rounded-lg px-2 py-1 bg-white focus:outline-none"
                  >
                    {GOOGLE_FONTS.map(f => (
                      <option key={f.name} value={f.name}>{f.name}</option>
                    ))}
                  </select>

                  {/* Font Size input/slider */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-black uppercase text-zinc-400">Tamaño:</span>
                    <input
                      type="number"
                      value={selectedLayer.fontSize || 36}
                      onChange={(e) => handleUpdateLayer(selectedLayer.id, { fontSize: Math.max(12, parseInt(e.target.value) || 12) })}
                      className="w-12 text-xs font-bold border border-zinc-300 rounded-lg px-1.5 py-0.5 bg-white text-center focus:outline-none"
                    />
                  </div>

                  {/* Color Picker input bubble */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-black uppercase text-zinc-400">Color:</span>
                    <input
                      type="color"
                      value={selectedLayer.color || "#000000"}
                      onChange={(e) => handleUpdateLayer(selectedLayer.id, { color: e.target.value })}
                      className="w-6 h-6 border border-zinc-300 rounded-full overflow-hidden cursor-pointer shadow-inner shrink-0"
                    />
                  </div>

                  {/* Text alignment options */}
                  <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden shrink-0">
                    <button
                      onClick={() => handleUpdateLayer(selectedLayer.id, { align: 'left' })}
                      className={`p-1.5 transition-all cursor-pointer ${selectedLayer.align === 'left' ? 'bg-zinc-200 text-zinc-800' : 'text-zinc-400 hover:bg-zinc-50'}`}
                    >
                      <AlignLeft size={13} />
                    </button>
                    <button
                      onClick={() => handleUpdateLayer(selectedLayer.id, { align: 'center' })}
                      className={`p-1.5 transition-all cursor-pointer ${selectedLayer.align === 'center' || !selectedLayer.align ? 'bg-zinc-200 text-zinc-800' : 'text-zinc-400 hover:bg-zinc-50'}`}
                    >
                      <AlignCenter size={13} />
                    </button>
                    <button
                      onClick={() => handleUpdateLayer(selectedLayer.id, { align: 'right' })}
                      className={`p-1.5 transition-all cursor-pointer ${selectedLayer.align === 'right' ? 'bg-zinc-200 text-zinc-800' : 'text-zinc-400 hover:bg-zinc-50'}`}
                    >
                      <AlignRight size={13} />
                    </button>
                  </div>

                  {/* Text styles toggles */}
                  <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden shrink-0">
                    <button
                      onClick={() => handleUpdateLayer(selectedLayer.id, { fontWeight: selectedLayer.fontWeight === 'bold' ? 'normal' : 'bold' })}
                      className={`p-1.5 transition-all cursor-pointer ${selectedLayer.fontWeight === 'bold' || selectedLayer.fontWeight === '900' ? 'bg-zinc-200 text-zinc-800' : 'text-zinc-400 hover:bg-zinc-50'}`}
                    >
                      <Bold size={13} />
                    </button>
                    <button
                      onClick={() => handleUpdateLayer(selectedLayer.id, { fontStyle: selectedLayer.fontStyle === 'italic' ? 'normal' : 'italic' })}
                      className={`p-1.5 transition-all cursor-pointer ${selectedLayer.fontStyle === 'italic' ? 'bg-zinc-200 text-zinc-800' : 'text-zinc-400 hover:bg-zinc-50'}`}
                    >
                      <Italic size={13} />
                    </button>
                  </div>
                </>
              )}

              {selectedLayer.type === 'image' && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-zinc-400">Imagen:</span>
                  <button
                    onClick={() => handleReplaceImage(selectedLayer.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-amber-500 hover:bg-amber-600 text-black rounded-lg cursor-pointer transition-all shadow-sm active:scale-95"
                  >
                    <Upload size={12} />
                    <span>Reemplazar Imagen</span>
                  </button>
                </div>
              )}

              {/* General opacity control slider */}
              <div className="flex items-center gap-1.5 shrink-0 ml-auto mr-4">
                <span className="text-[10px] font-black uppercase text-zinc-400">Opacidad:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={selectedLayer.opacity !== undefined ? selectedLayer.opacity : 1}
                  onChange={(e) => handleUpdateLayer(selectedLayer.id, { opacity: parseFloat(e.target.value) })}
                  className="w-16 h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* Copy & Delete direct actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => duplicateLayer(selectedLayer.id)}
                  title="Duplicar Capa"
                  className="p-1.5 border border-zinc-200 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-lg cursor-pointer transition-all shadow-2xs"
                >
                  <Copy size={13} />
                </button>
                <button
                  onClick={() => deleteLayer(selectedLayer.id)}
                  className="p-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-all shadow-2xs"
                >
                  <Trash2 size={13} />
                </button>
              </div>

            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                Lienzo Fondo:
              </span>
              
              {/* Canvas Background Color Picker */}
              <input
                type="color"
                value={currentDesign.background.type === 'color' ? currentDesign.background.value : "#ffffff"}
                onChange={(e) => setBackground('color', e.target.value)}
                className="w-6 h-6 border border-zinc-300 rounded-full overflow-hidden cursor-pointer shadow-inner"
                title="Cambiar Color de Fondo"
              />

              {/* Quick Preset Gradient background buttons */}
              <button
                onClick={() => setBackground('gradient', 'linear-gradient(135deg, #1e0b36 0%, #4c0d6b 100%)')}
                className="w-6 h-6 rounded-full border border-zinc-200 shadow-2xs shrink-0 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #1e0b36 0%, #4c0d6b 100%)' }}
                title="Fondo Gradiente Oscuro"
              />
              <button
                onClick={() => setBackground('gradient', 'linear-gradient(180deg, #ff416c 0%, #ff4b2b 100%)')}
                className="w-6 h-6 rounded-full border border-zinc-200 shadow-2xs shrink-0 cursor-pointer"
                style={{ background: 'linear-gradient(180deg, #ff416c 0%, #ff4b2b 100%)' }}
                title="Fondo Gradiente Naranja/Coral"
              />
              <button
                onClick={() => setBackground('color', '#080808')}
                className="w-6 h-6 rounded-full border border-zinc-200 shadow-2xs bg-black shrink-0 cursor-pointer"
                title="Fondo Negro Premium"
              />
              <button
                onClick={() => setBackground('color', '#ffffff')}
                className="w-6 h-6 rounded-full border border-zinc-200 shadow-2xs bg-white shrink-0 cursor-pointer"
                title="Fondo Blanco"
              />
            </div>
          )}
        </div>

        {/* Actual Editor Area container (Auto centering and resizing inside viewport) */}
        <div 
          ref={canvasContainerRef}
          onClick={() => selectLayer(null)}
          className="flex-1 p-6 overflow-hidden flex items-center justify-center bg-zinc-100/60 custom-scrollbar relative"
        >
          {/* Canvas Wrapper */}
          <div
            ref={canvasRef}
            className="shadow-2xl border border-zinc-300/40 relative overflow-hidden transition-all duration-300"
            style={{
              width: `${editorWidth}px`,
              height: `${editorHeight}px`,
              background: currentDesign.background.type === 'image' 
                ? `url(${currentDesign.background.value}) center/cover no-repeat` 
                : currentDesign.background.value
            }}
          >
            {/* Draw active background gradient correctly if selected */}
            {currentDesign.background.type === 'gradient' && (
              <div className="absolute inset-0 pointer-events-none" style={{ background: currentDesign.background.value }} />
            )}

            {/* RENDER LAYERS */}
            {currentDesign.layers.map((layer) => {
              if (layer.visible === false) return null;
              
              const isSel = layer.id === selectedLayerId;
              const scale = editorScale;
              
              // Calculate positioning percentages
              const style: React.CSSProperties = {
                position: 'absolute',
                left: `${layer.x}%`,
                top: `${layer.y}%`,
                width: `${layer.width}%`,
                height: `${layer.height}%`,
                transform: `rotate(${layer.rotation || 0}deg)`,
                opacity: layer.opacity !== undefined ? layer.opacity : 1,
                zIndex: isSel ? 30 : 10,
                cursor: layer.locked ? 'default' : 'move'
              };

              return (
                <div
                  key={layer.id}
                  data-layer-id={layer.id}
                  style={style}
                  onMouseDown={(e) => handleMouseDown(e, layer.id, 'move')}
                  onTouchStart={(e) => handleMouseDown(e, layer.id, 'move')}
                  onClick={(e) => {
                    if (!layer.locked) {
                      e.stopPropagation();
                    }
                  }}
                  onDoubleClick={() => {
                    if (layer.type === 'text') {
                      const newText = window.prompt("Editar texto:", layer.text);
                      if (newText !== null) {
                        handleUpdateLayer(layer.id, { text: newText });
                      }
                    } else if (layer.type === 'image') {
                      handleReplaceImage(layer.id);
                    }
                  }}
                  className={`group relative select-none ${
                    isSel ? 'ring-2 ring-pink-500/80 shadow-lg' : 'hover:ring-1 hover:ring-zinc-400'
                  }`}
                >
                  
                  {/* Layer visual elements wrapper */}
                  <div className="w-full h-full pointer-events-none overflow-hidden select-none">
                    
                    {/* Render TEXT layer */}
                    {layer.type === 'text' && (
                      <div
                        className="w-full h-full flex flex-col justify-center text-center select-none"
                        style={{
                          color: layer.color || "#000000",
                          fontFamily: layer.fontFamily || "Montserrat",
                          fontSize: `${(layer.fontSize || 36) * scale}px`,
                          fontWeight: layer.fontWeight || 'normal',
                          fontStyle: layer.fontStyle || 'normal',
                          textAlign: layer.align || 'center',
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.15
                        }}
                      >
                        {layer.text}
                      </div>
                    )}

                    {/* Render IMAGE layer */}
                    {layer.type === 'image' && layer.src && (
                      <img
                        src={layer.src}
                        alt={layer.name}
                        className="w-full h-full object-contain pointer-events-none select-none"
                        draggable={false}
                      />
                    )}

                    {/* Render SHAPE layer */}
                    {layer.type === 'shape' && (
                      <div
                        className="w-full h-full pointer-events-none select-none"
                        style={{
                          backgroundColor: layer.fillColor || "transparent",
                          border: layer.strokeColor && layer.strokeColor !== 'transparent' 
                            ? `${(layer.strokeWidth || 1) * scale}px solid ${layer.strokeColor}` 
                            : 'none',
                          borderRadius: layer.shapeType === 'circle' ? '50%' : '0'
                        }}
                      />
                    )}

                    {/* Render STICKER layer */}
                    {layer.type === 'sticker' && layer.stickerType && (
                      renderStickerComponent(layer.stickerType, editorWidth * (layer.width / 100), editorHeight * (layer.height / 100))
                    )}

                  </div>

                  {/* ACTIVE BOUNDING BOX HANDLES (Visible ONLY when layer is selected & unlocked) */}
                  {isSel && !layer.locked && (
                    <>
                      {/* Top rotate handler handle */}
                      <div
                        onMouseDown={(e) => handleMouseDown(e, layer.id, 'rotate')}
                        onTouchStart={(e) => handleMouseDown(e, layer.id, 'rotate')}
                        className="absolute -top-7 left-1/2 -translate-x-1/2 w-5 h-5 bg-white border-2 border-pink-500 rounded-full flex items-center justify-center cursor-pointer shadow-md z-40 hover:scale-110 active:scale-95 transition-all"
                        title="Rotar"
                      >
                        <RotateCw size={10} className="text-pink-500 pointer-events-none" />
                      </div>

                      {/* Top Left resize corner handle */}
                      <div
                        onMouseDown={(e) => handleMouseDown(e, layer.id, 'resize', 'tl')}
                        onTouchStart={(e) => handleMouseDown(e, layer.id, 'resize', 'tl')}
                        className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-pink-500 rounded-full cursor-nwse-resize z-40 shadow-xs"
                      />

                      {/* Top Right resize corner handle */}
                      <div
                        onMouseDown={(e) => handleMouseDown(e, layer.id, 'resize', 'tr')}
                        onTouchStart={(e) => handleMouseDown(e, layer.id, 'resize', 'tr')}
                        className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-pink-500 rounded-full cursor-nesw-resize z-40 shadow-xs"
                      />

                      {/* Bottom Left resize corner handle */}
                      <div
                        onMouseDown={(e) => handleMouseDown(e, layer.id, 'resize', 'bl')}
                        onTouchStart={(e) => handleMouseDown(e, layer.id, 'resize', 'bl')}
                        className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-pink-500 rounded-full cursor-nesw-resize z-40 shadow-xs"
                      />

                      {/* Bottom Right resize corner handle */}
                      <div
                        onMouseDown={(e) => handleMouseDown(e, layer.id, 'resize', 'br')}
                        onTouchStart={(e) => handleMouseDown(e, layer.id, 'resize', 'br')}
                        className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-pink-500 rounded-full cursor-nwse-resize z-40 shadow-xs"
                      />

                      {/* Canva-like Floating Layer Action Toolbar */}
                      <div 
                        className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-zinc-900 text-white shadow-xl px-2 py-0.5 rounded-lg flex items-center gap-1.5 z-50 pointer-events-auto border border-zinc-700/80 shrink-0"
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => duplicateLayer(layer.id)}
                          title="Duplicar Capa"
                          className="p-1 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white transition-all cursor-pointer"
                        >
                          <Copy size={11} />
                        </button>
                        <div className="w-[1px] h-3 bg-zinc-700" />
                        
                        {layer.type === 'image' && (
                          <>
                            <button
                              onClick={() => handleReplaceImage(layer.id)}
                              title="Reemplazar Imagen"
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-0.5 text-[9px] font-bold"
                            >
                              <Upload size={11} />
                              <span>Reemplazar</span>
                            </button>
                            <div className="w-[1px] h-3 bg-zinc-700" />
                          </>
                        )}
                        
                        <button
                          onClick={() => deleteLayer(layer.id)}
                          title="Eliminar Capa"
                          className="p-1 hover:bg-red-900/40 rounded text-red-400 hover:text-red-300 transition-all cursor-pointer"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </>
                  )}

                  {/* Lock Indicator overlay badge */}
                  {layer.locked && (
                    <div className="absolute top-1 right-1 p-0.5 bg-zinc-900/60 rounded text-white z-40">
                      <Lock size={10} />
                    </div>
                  )}

                </div>
              );
            })}

          </div>
        </div>
      </div>

      {/* Global save toast notification */}
      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-premium z-50 flex items-center gap-2 border border-zinc-800"
          >
            <Check size={14} className="text-green-400" />
            {saveToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Exporting Spinner overlay */}
      <AnimatePresence>
        {isExporting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 rounded-3xl"
          >
            <div className="bg-white rounded-3xl p-6 text-center shadow-2xl max-w-xs border border-zinc-200">
              <RefreshCw className="h-8 w-8 text-amber-500 animate-spin mx-auto" />
              <p className="mt-4 text-xs font-black uppercase text-zinc-800 tracking-wider">Generando Alta Resolución...</p>
              <p className="text-[10px] text-zinc-400 font-medium mt-1 leading-relaxed">
                Por favor espera mientras el motor compila tu diseño publicitario.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
