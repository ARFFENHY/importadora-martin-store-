import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ColorsConfig {
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
  surface: string;
  surfaceHover: string;
  border: string;
  muted: string;
  badgeNew?: string;
  badgeFeatured?: string;
  badgeStock?: string;
}

export interface StoreConfig {
  name: string;
  whatsAppNumber: string;
  logoUrl?: string;
  pickupHours?: string;
  pickupAddress?: string;
}

export interface BannerConfig {
  title: string;
  subtitle: string;
  imageUrl: string;
  badge?: string;
}

export interface BannerPreset {
  name: string;
  url: string;
}

interface ConfigState {
  colors: ColorsConfig;
  store: StoreConfig;
  banner: BannerConfig;
  bannerPresets: BannerPreset[];
  updateColors: (colors: Partial<ColorsConfig>) => void;
  updateStoreConfig: (config: Partial<StoreConfig>) => void;
  updateHeroBanner: (banner: Partial<BannerConfig>) => void;
  updateBannerPreset: (name: string, url: string) => void;
  resetToDefault: () => void;
}

const DEFAULT_COLORS: ColorsConfig = {
  primary: '#0F2C59',
  secondary: '#3B82F6',
  background: '#FFFFFF',
  foreground: '#000000',
  surface: '#FFFFFF',
  surfaceHover: '#F8F8F8',
  border: '#E5E5E5',
  muted: '#52525B',
  badgeNew: '#F59E0B',
  badgeFeatured: '#18181B',
  badgeStock: '#71717A',
};

const DEFAULT_STORE: StoreConfig = {
  name: 'Importadora Martin Store',
  whatsAppNumber: '5491172214696',
  logoUrl: '',
  pickupHours: 'lunes a viernes de 9:00 a 18:00 hs',
  pickupAddress: 'Alvear 2580, Ramos Mejía, Buenos Aires.',
};

const DEFAULT_BANNER: BannerConfig = {
  title: 'Llegó lo NUEVO',
  subtitle: 'Herramientas profesionales para expertos.',
  imageUrl: 'https://images.unsplash.com/photo-1504148455328-436276d7b218?q=80&w=600',
  badge: 'Súper Ofertas',
};

const DEFAULT_PRESETS: BannerPreset[] = [
  {
    name: 'Rotomartillo (Fábrica)',
    url: 'https://images.unsplash.com/photo-1504148455328-436276d7b218?q=80&w=600',
  },
  {
    name: 'Herramientas de Mano',
    url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=600',
  },
  {
    name: 'Taladro Atornillador',
    url: 'https://images.unsplash.com/photo-1540103359327-024564c76041?q=80&w=600',
  },
  {
    name: 'Taller Profesional',
    url: 'https://images.unsplash.com/photo-1530124560647-55e12e3f8961?q=80&w=600',
  },
];

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      colors: DEFAULT_COLORS,
      store: DEFAULT_STORE,
      banner: DEFAULT_BANNER,
      bannerPresets: DEFAULT_PRESETS,
      updateColors: (newColors) =>
        set((state) => ({ colors: { ...state.colors, ...newColors } })),
      updateStoreConfig: (newStore) =>
        set((state) => ({ store: { ...state.store, ...newStore } })),
      updateHeroBanner: (newBanner) =>
        set((state) => ({ banner: { ...state.banner, ...newBanner } })),
      updateBannerPreset: (name, url) =>
        set((state) => ({
          bannerPresets: state.bannerPresets.map((preset) =>
            preset.name === name ? { ...preset, url } : preset
          ),
        })),
      resetToDefault: () =>
        set({
          colors: DEFAULT_COLORS,
          store: DEFAULT_STORE,
          banner: DEFAULT_BANNER,
          bannerPresets: DEFAULT_PRESETS,
        }),
    }),
    {
      name: 'store-config-storage',
    }
  )
);

