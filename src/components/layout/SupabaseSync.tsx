'use client';

import { useEffect } from 'react';
import { useProductStore } from '@/store/useProductStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useConfigStore } from '@/store/useConfigStore';

/**
 * Componente invisible de sincronización en tiempo real que:
 * 1. Suscribe el catálogo de productos y categorías a los canales de Supabase.
 * 2. Mantiene la sesión local activa.
 * 3. Sincroniza la configuración corporativa (Branding) desde Supabase.
 */
export function SupabaseSync() {
  const subscribe = useProductStore((s) => s.subscribe);
  const initAuthListener = useAuthStore((s) => s.initAuthListener);
  const subscribeConfig = useConfigStore((s) => s.subscribeConfig);

  useEffect(() => {
    const unsubProducts = subscribe();
    const unsubAuth = initAuthListener();
    const unsubConfig = subscribeConfig();
    return () => {
      unsubProducts();
      unsubAuth();
      unsubConfig();
    };
  }, [subscribe, initAuthListener, subscribeConfig]);

  return null;
}
