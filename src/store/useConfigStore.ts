import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

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
        console.log('[Supabase Config] Conectando listener de branding...');

        const channel = supabase
          .channel('realtime-config')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'config', filter: 'id=eq.branding' },
            (payload) => {
              console.log('[Supabase Config] Configuración actualizada vía realtime:', payload);
              if (payload.new) {
                const data = payload.new as any;
                set({
                  colors: data.colors || DEFAULT_COLORS,
                  store: data.store || DEFAULT_STORE,
                  banner: data.banner || DEFAULT_BANNER,
                });
              }
            }
          )
          .subscribe();

        // Carga inicial
        const loadConfig = async () => {
          try {
            const { data, error } = await supabase
              .from('config')
              .select('*')
              .eq('id', 'branding')
              .single();

            if (error) {
              if (error.code === 'PGRST116') {
                console.log('[Supabase Config] Configuración branding no encontrada. Inicializando defaults...');
                const { error: insertErr } = await supabase
                  .from('config')
                  .insert({
                    id: 'branding',
                    colors: DEFAULT_COLORS,
                    store: DEFAULT_STORE,
                    banner: DEFAULT_BANNER,
                  });
                if (insertErr) {
                  console.error('[Supabase Config] Error al insertar defaults:', insertErr);
                }
              } else {
                console.error('[Supabase Config] Error al cargar branding:', error);
              }
            } else if (data) {
              set({
                colors: data.colors || DEFAULT_COLORS,
                store: data.store || DEFAULT_STORE,
                banner: data.banner || DEFAULT_BANNER,
              });
            }
          } catch (err) {
            console.error('[Supabase Config] Excepción en loadConfig:', err);
          }
        };

        void loadConfig();

        return () => {
          console.log('[Supabase Config] Limpiando listener de branding...');
          void supabase.removeChannel(channel);
        };
      },

      updateColors: (newColors) =>
        set((state) => {
          const colors = { ...state.colors, ...newColors };
          const sync = async () => {
            try {
              const { error } = await supabase
                .from('config')
                .upsert({
                  id: 'branding',
                  colors,
                  store: state.store,
                  banner: state.banner,
                  updated_at: new Date().toISOString(),
                });
              if (error) throw error;
            } catch (e) {
              console.error('[Supabase Config] Error al sincronizar colores:', e);
            }
          };
          void sync();
          return { colors };
        }),

      updateStoreConfig: (newStore) =>
        set((state) => {
          const store = { ...state.store, ...newStore };
          const sync = async () => {
            try {
              const { error } = await supabase
                .from('config')
                .upsert({
                  id: 'branding',
                  colors: state.colors,
                  store,
                  banner: state.banner,
                  updated_at: new Date().toISOString(),
                });
              if (error) throw error;
            } catch (e) {
              console.error('[Supabase Config] Error al sincronizar datos de tienda:', e);
            }
          };
          void sync();
          return { store };
        }),

      updateHeroBanner: (newBanner) =>
        set((state) => {
          const banner = { ...state.banner, ...newBanner };
          const sync = async () => {
            try {
              const { error } = await supabase
                .from('config')
                .upsert({
                  id: 'branding',
                  colors: state.colors,
                  store: state.store,
                  banner,
                  updated_at: new Date().toISOString(),
                });
              if (error) throw error;
            } catch (e) {
              console.error('[Supabase Config] Error al sincronizar banner hero:', e);
            }
          };
          void sync();
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
        const sync = async () => {
          try {
            const { error } = await supabase
              .from('config')
              .upsert({
                id: 'branding',
                colors: DEFAULT_COLORS,
                store: DEFAULT_STORE,
                banner: DEFAULT_BANNER,
                updated_at: new Date().toISOString(),
              });
            if (error) throw error;
          } catch (e) {
            console.error('[Supabase Config] Error al restablecer configuración:', e);
          }
        };
        void sync();
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
