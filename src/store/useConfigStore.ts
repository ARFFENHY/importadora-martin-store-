import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

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
  subscribeConfig: () => () => void;
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
  logoUrl: '/logo.png',
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
    (set, get) => ({
      colors: DEFAULT_COLORS,
      store: DEFAULT_STORE,
      banner: DEFAULT_BANNER,
      bannerPresets: DEFAULT_PRESETS,

      subscribeConfig: () => {
        const docRef = doc(db, 'config', 'branding');
        const unsub = onSnapshot(docRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            set({
              colors: data.colors || DEFAULT_COLORS,
              store: data.store || DEFAULT_STORE,
              banner: data.banner || DEFAULT_BANNER,
            });
          }
        }, (error) => {
          console.error('Error loading branding config from Firestore:', error);
        });
        return unsub;
      },

      updateColors: (newColors) =>
        set((state) => {
          const colors = { ...state.colors, ...newColors };
          try {
            void setDoc(doc(db, 'config', 'branding'), {
              colors,
              store: state.store,
              banner: state.banner,
            });
          } catch (e) {
            console.error('Error syncing colors to Firestore:', e);
          }
          return { colors };
        }),

      updateStoreConfig: (newStore) =>
        set((state) => {
          const store = { ...state.store, ...newStore };
          try {
            void setDoc(doc(db, 'config', 'branding'), {
              colors: state.colors,
              store,
              banner: state.banner,
            });
          } catch (e) {
            console.error('Error syncing store config to Firestore:', e);
          }
          return { store };
        }),

      updateHeroBanner: (newBanner) =>
        set((state) => {
          const banner = { ...state.banner, ...newBanner };
          try {
            void setDoc(doc(db, 'config', 'branding'), {
              colors: state.colors,
              store: state.store,
              banner,
            });
          } catch (e) {
            console.error('Error syncing hero banner to Firestore:', e);
          }
          return { banner };
        }),

      updateBannerPreset: (name, url) =>
        set((state) => ({
          bannerPresets: state.bannerPresets.map((preset) =>
            preset.name === name ? { ...preset, url } : preset
          ),
        })),

      resetToDefault: () => {
        set({
          colors: DEFAULT_COLORS,
          store: DEFAULT_STORE,
          banner: DEFAULT_BANNER,
          bannerPresets: DEFAULT_PRESETS,
        });
        try {
          void setDoc(doc(db, 'config', 'branding'), {
            colors: DEFAULT_COLORS,
            store: DEFAULT_STORE,
            banner: DEFAULT_BANNER,
          });
        } catch (e) {
          console.error('Error resetting Firestore config:', e);
        }
      },
    }),
    {
      name: 'store-config-storage',
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as ConfigState & { store?: { whatsAppNumber?: string } };
        if (version === 0) {
          if (state?.store?.whatsAppNumber === '5491122334455') {
            state.store.whatsAppNumber = '5491172214696';
          }
        }
        return state;
      },
    }
  )
);

