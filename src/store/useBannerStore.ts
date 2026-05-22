import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BannerLayer {
  id: string;
  type: 'text' | 'image' | 'sticker' | 'shape';
  name: string;
  x: number; // Percentage (0-100) relative to canvas width
  y: number; // Percentage (0-100) relative to canvas height
  width: number; // Percentage (0-100) relative to canvas width
  height: number; // Percentage (0-100) relative to canvas height
  rotation: number; // Degrees (0-360)
  opacity: number; // 0-1
  locked?: boolean;
  visible?: boolean;

  // Text properties
  text?: string;
  fontSize?: number; // Base font size in pixels (scales with canvas resolution)
  fontFamily?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  fontWeight?: 'normal' | 'bold' | '900';
  fontStyle?: 'normal' | 'italic';

  // Image properties
  src?: string; // Data URL or online URL

  // Sticker properties
  stickerType?: 'oferta' | 'promo-2x1' | 'nuevo' | 'ultimas' | 'custom';
  color2?: string; // Secondary color

  // Shape properties
  shapeType?: 'rect' | 'circle' | 'star';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

export type BannerFormat = 'instagram-post' | 'stories' | 'facebook' | 'flyer';

export interface BannerFormatConfig {
  name: string;
  width: number;  // Native resolution width (e.g. 1080)
  height: number; // Native resolution height (e.g. 1080)
  aspectRatio: string;
  label: string;
}

export const BANNER_FORMATS: Record<BannerFormat, BannerFormatConfig> = {
  'instagram-post': {
    name: 'instagram-post',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    label: 'Instagram Post (1:1)'
  },
  'stories': {
    name: 'stories',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    label: 'Stories / WhatsApp / TikTok (9:16)'
  },
  'facebook': {
    name: 'facebook',
    width: 1200,
    height: 630,
    aspectRatio: '1.91:1',
    label: 'Facebook Post (1.91:1)'
  },
  'flyer': {
    name: 'flyer',
    width: 1200,
    height: 1600,
    aspectRatio: '3:4',
    label: 'Flyer Promocional (3:4)'
  }
};

export interface BannerDesign {
  id: string;
  name: string;
  format: BannerFormat;
  width: number;
  height: number;
  background: {
    type: 'color' | 'gradient' | 'image';
    value: string; // solid color, gradient CSS string, or image URL
  };
  layers: BannerLayer[];
  updatedAt: number;
}

interface BannerState {
  savedDesigns: BannerDesign[];
  currentDesign: BannerDesign | null;
  selectedLayerId: string | null;
  
  // History state for premium Undo/Redo
  history: BannerDesign[];
  historyIndex: number;

  // Actions
  saveDesign: () => void;
  deleteDesign: (id: string) => void;
  duplicateDesign: (id: string) => void;
  createNewDesign: (format: BannerFormat, name?: string) => void;
  loadDesign: (id: string) => void;
  updateCurrentDesign: (updates: Partial<BannerDesign> | ((prev: BannerDesign) => BannerDesign)) => void;
  
  // Layers Actions
  addLayer: (layer: Omit<BannerLayer, 'id'>) => void;
  updateLayer: (layerId: string, updates: Partial<BannerLayer>) => void;
  deleteLayer: (layerId: string) => void;
  duplicateLayer: (layerId: string) => void;
  changeLayerOrder: (layerId: string, direction: 'up' | 'down' | 'front' | 'back') => void;
  selectLayer: (layerId: string | null) => void;
  
  // Canvas Configuration Actions
  setFormat: (format: BannerFormat) => void;
  setBackground: (type: 'color' | 'gradient' | 'image', value: string) => void;
  
  // History Actions
  pushHistory: (design: BannerDesign) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
}

// Initial Preset Templates (Loaded when database is clean)
export const PRESET_TEMPLATES: Omit<BannerDesign, 'updatedAt'>[] = [
  {
    id: 'tpl-liquidacion',
    name: 'Super Liquidación',
    format: 'instagram-post',
    width: 1080,
    height: 1080,
    background: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #1e0b36 0%, #4c0d6b 100%)'
    },
    layers: [
      {
        id: 'layer-title-1',
        type: 'text',
        name: 'Título Principal',
        x: 10,
        y: 12,
        width: 80,
        height: 10,
        rotation: -2,
        opacity: 1,
        text: 'GRAN LIQUIDACIÓN',
        fontSize: 105,
        fontFamily: 'Bebas Neue',
        color: '#FFB800',
        align: 'center',
        fontWeight: '900'
      },
      {
        id: 'layer-subtitle-1',
        type: 'text',
        name: 'Subtítulo',
        x: 10,
        y: 23,
        width: 80,
        height: 5,
        rotation: 0,
        opacity: 1,
        text: 'TODO CON 50% DE DESCUENTO',
        fontSize: 34,
        fontFamily: 'Montserrat',
        color: '#FFFFFF',
        align: 'center',
        fontWeight: 'bold'
      },
      {
        id: 'layer-img-placeholder',
        type: 'image',
        name: 'Imagen del Producto',
        x: 22,
        y: 33,
        width: 56,
        height: 50,
        rotation: 0,
        opacity: 1,
        src: 'https://images.unsplash.com/photo-1504148455328-436276d7b218?q=80&w=600'
      },
      {
        id: 'layer-sticker-oferta',
        type: 'sticker',
        name: 'Sticker Oferta',
        x: 70,
        y: 28,
        width: 18,
        height: 18,
        rotation: 12,
        opacity: 1,
        stickerType: 'oferta'
      },
      {
        id: 'layer-price-badge',
        type: 'text',
        name: 'Precio Destacado',
        x: 25,
        y: 84,
        width: 50,
        height: 8,
        rotation: 0,
        opacity: 1,
        text: '$15,999',
        fontSize: 82,
        fontFamily: 'Outfit',
        color: '#10B981',
        align: 'center',
        fontWeight: '900'
      }
    ]
  },
  {
    id: 'tpl-lanzamiento',
    name: 'Lanzamiento Premium',
    format: 'instagram-post',
    width: 1080,
    height: 1080,
    background: {
      type: 'color',
      value: '#080808'
    },
    layers: [
      {
        id: 'layer-gold-frame',
        type: 'shape',
        name: 'Marco Dorado',
        x: 4,
        y: 4,
        width: 92,
        height: 92,
        rotation: 0,
        opacity: 0.8,
        shapeType: 'rect',
        fillColor: 'transparent',
        strokeColor: '#FFB800',
        strokeWidth: 4
      },
      {
        id: 'layer-lanz-title',
        type: 'text',
        name: 'Título Lanzamiento',
        x: 10,
        y: 10,
        width: 80,
        height: 7,
        rotation: 0,
        opacity: 1,
        text: 'NUEVO INGRESO',
        fontSize: 60,
        fontFamily: 'Outfit',
        color: '#FFB800',
        align: 'center',
        fontWeight: 'bold'
      },
      {
        id: 'layer-lanz-sub',
        type: 'text',
        name: 'Detalle de Lanzamiento',
        x: 10,
        y: 17,
        width: 80,
        height: 4,
        rotation: 0,
        opacity: 1,
        text: 'Haciendo tu trabajo más simple y profesional',
        fontSize: 24,
        fontFamily: 'Inter',
        color: '#A1A1AA',
        align: 'center'
      },
      {
        id: 'layer-lanz-img',
        type: 'image',
        name: 'Producto Principal',
        x: 20,
        y: 25,
        width: 60,
        height: 52,
        rotation: 0,
        opacity: 1,
        src: 'https://images.unsplash.com/photo-1540103359327-024564c76041?q=80&w=600'
      },
      {
        id: 'layer-lanz-sticker',
        type: 'sticker',
        name: 'Sticker Nuevo',
        x: 12,
        y: 28,
        width: 14,
        height: 14,
        rotation: -15,
        opacity: 1,
        stickerType: 'nuevo'
      },
      {
        id: 'layer-lanz-price',
        type: 'text',
        name: 'Texto Precio',
        x: 20,
        y: 80,
        width: 60,
        height: 6,
        rotation: 0,
        opacity: 1,
        text: 'PRECIO EXCLUSIVO: $24,900',
        fontSize: 32,
        fontFamily: 'Montserrat',
        color: '#FFFFFF',
        align: 'center',
        fontWeight: 'bold'
      }
    ]
  },
  {
    id: 'tpl-promo2x1',
    name: 'Promo 2x1 WhatsApp',
    format: 'stories',
    width: 1080,
    height: 1920,
    background: {
      type: 'gradient',
      value: 'linear-gradient(180deg, #ff416c 0%, #ff4b2b 100%)'
    },
    layers: [
      {
        id: 'layer-2x1-sup',
        type: 'text',
        name: 'Encabezado',
        x: 10,
        y: 8,
        width: 80,
        height: 4,
        rotation: 0,
        opacity: 1,
        text: 'PROMO IMPERDIBLE',
        fontSize: 38,
        fontFamily: 'Montserrat',
        color: '#FFFFFF',
        align: 'center',
        fontWeight: 'bold'
      },
      {
        id: 'layer-2x1-main',
        type: 'text',
        name: 'Texto 2X1',
        x: 10,
        y: 13,
        width: 80,
        height: 12,
        rotation: 0,
        opacity: 1,
        text: '2 X 1',
        fontSize: 220,
        fontFamily: 'Bebas Neue',
        color: '#FFFF00',
        align: 'center',
        fontWeight: '900'
      },
      {
        id: 'layer-2x1-desc',
        type: 'text',
        name: 'Descripción Promo',
        x: 10,
        y: 25,
        width: 80,
        height: 3,
        rotation: 0,
        opacity: 1,
        text: 'LLEVÁ 2, PAGÁ SOLO 1',
        fontSize: 32,
        fontFamily: 'Montserrat',
        color: '#FFFFFF',
        align: 'center',
        fontWeight: 'bold'
      },
      {
        id: 'layer-2x1-img',
        type: 'image',
        name: 'Imagen Producto',
        x: 15,
        y: 32,
        width: 70,
        height: 46,
        rotation: 0,
        opacity: 1,
        src: 'https://images.unsplash.com/photo-1530124560647-55e12e3f8961?q=80&w=600'
      },
      {
        id: 'layer-2x1-sticker',
        type: 'sticker',
        name: 'Sticker 2x1',
        x: 72,
        y: 28,
        width: 20,
        height: 20,
        rotation: 15,
        opacity: 1,
        stickerType: 'promo-2x1'
      },
      {
        id: 'layer-2x1-prod-name',
        type: 'text',
        name: 'Nombre Producto',
        x: 10,
        y: 80,
        width: 80,
        height: 4,
        rotation: 0,
        opacity: 1,
        text: 'HERRAMIENTAS SELECCIONADAS',
        fontSize: 34,
        fontFamily: 'Outfit',
        color: '#FFFF00',
        align: 'center',
        fontWeight: 'bold'
      },
      {
        id: 'layer-2x1-cta',
        type: 'text',
        name: 'Call to Action',
        x: 10,
        y: 86,
        width: 80,
        height: 3,
        rotation: 0,
        opacity: 0.9,
        text: 'Pedí el tuyo ahora por WhatsApp',
        fontSize: 28,
        fontFamily: 'Inter',
        color: '#FFFFFF',
        align: 'center'
      }
    ]
  }
];

export const useBannerStore = create<BannerState>()(
  persist(
    (set, get) => ({
      savedDesigns: [],
      currentDesign: null,
      selectedLayerId: null,
      history: [],
      historyIndex: -1,

      saveDesign: () => {
        const { currentDesign, savedDesigns } = get();
        if (!currentDesign) return;

        const updatedDesign = {
          ...currentDesign,
          updatedAt: Date.now()
        };

        const exists = savedDesigns.some(d => d.id === updatedDesign.id);
        const nextSaved = exists
          ? savedDesigns.map(d => d.id === updatedDesign.id ? updatedDesign : d)
          : [updatedDesign, ...savedDesigns];

        set({
          savedDesigns: nextSaved,
          currentDesign: updatedDesign
        });
      },

      deleteDesign: (id) => {
        set((state) => {
          const nextSaved = state.savedDesigns.filter(d => d.id !== id);
          const nextCurrent = state.currentDesign?.id === id ? null : state.currentDesign;
          return {
            savedDesigns: nextSaved,
            currentDesign: nextCurrent,
            selectedLayerId: nextCurrent ? state.selectedLayerId : null
          };
        });
      },

      duplicateDesign: (id) => {
        const { savedDesigns } = get();
        const target = savedDesigns.find(d => d.id === id);
        if (!target) return;

        const duplicated: BannerDesign = {
          ...target,
          id: `design-${Date.now()}`,
          name: `${target.name} (Copia)`,
          updatedAt: Date.now()
        };

        set((state) => ({
          savedDesigns: [duplicated, ...state.savedDesigns]
        }));
      },

      createNewDesign: (format, name = 'Diseño sin título') => {
        const config = BANNER_FORMATS[format];
        const newDesign: BannerDesign = {
          id: `design-${Date.now()}`,
          name,
          format,
          width: config.width,
          height: config.height,
          background: {
            type: 'color',
            value: '#ffffff'
          },
          layers: [
            {
              id: `layer-${Date.now()}-title`,
              type: 'text',
              name: 'Título Principal',
              x: 10,
              y: 40,
              width: 80,
              height: 10,
              rotation: 0,
              opacity: 1,
              text: 'Haz doble click para editar',
              fontSize: 60,
              fontFamily: 'Montserrat',
              color: '#000000',
              align: 'center',
              fontWeight: 'bold'
            }
          ],
          updatedAt: Date.now()
        };

        set({
          currentDesign: newDesign,
          selectedLayerId: null,
          history: [newDesign],
          historyIndex: 0
        });
      },

      loadDesign: (id) => {
        const { savedDesigns } = get();
        let target = savedDesigns.find(d => d.id === id);

        // Fallback: search in presets if not in user saved designs
        if (!target) {
          const preset = PRESET_TEMPLATES.find(p => p.id === id);
          if (preset) {
            target = {
              ...preset,
              id: `design-${Date.now()}`, // Create a clone
              name: `${preset.name}`,
              updatedAt: Date.now()
            };
          }
        }

        if (target) {
          set({
            currentDesign: target,
            selectedLayerId: null,
            history: [target],
            historyIndex: 0
          });
        }
      },

      updateCurrentDesign: (updates) => {
        const { currentDesign } = get();
        if (!currentDesign) return;

        const nextDesign = typeof updates === 'function' ? updates(currentDesign) : { ...currentDesign, ...updates };
        
        set({ currentDesign: nextDesign });
        get().pushHistory(nextDesign);
      },

      addLayer: (layerParams) => {
        const { currentDesign } = get();
        if (!currentDesign) return;

        const newLayer: BannerLayer = {
          ...layerParams,
          id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
        };

        const updatedDesign = {
          ...currentDesign,
          layers: [...currentDesign.layers, newLayer]
        };

        set({
          currentDesign: updatedDesign,
          selectedLayerId: newLayer.id
        });
        get().pushHistory(updatedDesign);
      },

      updateLayer: (layerId, updates) => {
        const { currentDesign } = get();
        if (!currentDesign) return;

        const updatedDesign = {
          ...currentDesign,
          layers: currentDesign.layers.map(l =>
            l.id === layerId ? { ...l, ...updates } : l
          )
        };

        set({ currentDesign: updatedDesign });
        // Don't flood history on minor moves, wait till drag ends (handled inside component mouseUps)
      },

      deleteLayer: (layerId) => {
        const { currentDesign, selectedLayerId } = get();
        if (!currentDesign) return;

        const updatedDesign = {
          ...currentDesign,
          layers: currentDesign.layers.filter(l => l.id !== layerId)
        };

        set({
          currentDesign: updatedDesign,
          selectedLayerId: selectedLayerId === layerId ? null : selectedLayerId
        });
        get().pushHistory(updatedDesign);
      },

      duplicateLayer: (layerId) => {
        const { currentDesign } = get();
        if (!currentDesign) return;

        const target = currentDesign.layers.find(l => l.id === layerId);
        if (!target) return;

        const duplicated: BannerLayer = {
          ...target,
          id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: `${target.name} (Copia)`,
          x: Math.min(target.x + 5, 80), // Offset slightly
          y: Math.min(target.y + 5, 80)
        };

        const updatedDesign = {
          ...currentDesign,
          layers: [...currentDesign.layers, duplicated]
        };

        set({
          currentDesign: updatedDesign,
          selectedLayerId: duplicated.id
        });
        get().pushHistory(updatedDesign);
      },

      changeLayerOrder: (layerId, direction) => {
        const { currentDesign } = get();
        if (!currentDesign) return;

        const layers = [...currentDesign.layers];
        const index = layers.findIndex(l => l.id === layerId);
        if (index === -1) return;

        if (direction === 'up' && index < layers.length - 1) {
          const temp = layers[index];
          layers[index] = layers[index + 1];
          layers[index + 1] = temp;
        } else if (direction === 'down' && index > 0) {
          const temp = layers[index];
          layers[index] = layers[index - 1];
          layers[index - 1] = temp;
        } else if (direction === 'front') {
          const target = layers.splice(index, 1)[0];
          layers.push(target);
        } else if (direction === 'back') {
          const target = layers.splice(index, 1)[0];
          layers.unshift(target);
        }

        const updatedDesign = {
          ...currentDesign,
          layers
        };

        set({ currentDesign: updatedDesign });
        get().pushHistory(updatedDesign);
      },

      selectLayer: (layerId) => {
        set({ selectedLayerId: layerId });
      },

      setFormat: (format) => {
        const { currentDesign } = get();
        if (!currentDesign) return;

        const config = BANNER_FORMATS[format];
        const updatedDesign = {
          ...currentDesign,
          format,
          width: config.width,
          height: config.height
        };

        set({ currentDesign: updatedDesign });
        get().pushHistory(updatedDesign);
      },

      setBackground: (type, value) => {
        const { currentDesign } = get();
        if (!currentDesign) return;

        const updatedDesign = {
          ...currentDesign,
          background: { type, value }
        };

        set({ currentDesign: updatedDesign });
        get().pushHistory(updatedDesign);
      },

      // Undo / Redo core mechanics
      pushHistory: (design) => {
        const { history, historyIndex } = get();
        
        // Truncate future if we performed an action after undos
        const cleanHistory = history.slice(0, historyIndex + 1);
        
        // Limit history to 30 states to preserve memory
        const nextHistory = [...cleanHistory, JSON.parse(JSON.stringify(design))].slice(-30);
        
        set({
          history: nextHistory,
          historyIndex: nextHistory.length - 1
        });
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          const prevIndex = historyIndex - 1;
          const prevDesign = history[prevIndex];
          set({
            currentDesign: JSON.parse(JSON.stringify(prevDesign)),
            historyIndex: prevIndex,
            selectedLayerId: null
          });
        }
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          const nextIndex = historyIndex + 1;
          const nextDesign = history[nextIndex];
          set({
            currentDesign: JSON.parse(JSON.stringify(nextDesign)),
            historyIndex: nextIndex,
            selectedLayerId: null
          });
        }
      },

      clearHistory: () => {
        const { currentDesign } = get();
        if (currentDesign) {
          set({
            history: [currentDesign],
            historyIndex: 0
          });
        }
      }
    }),
    {
      name: 'banners-storage',
      partialize: (state) => ({
        savedDesigns: state.savedDesigns
      })
    }
  )
);
