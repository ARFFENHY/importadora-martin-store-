'use client';

import { useEffect } from 'react';
import { useProductStore } from '@/store/useProductStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useConfigStore } from '@/store/useConfigStore';

/**
 * Componente invisible que:
 * 1. Conecta el store de productos con Firestore (listener en tiempo real)
 * 2. Inicia el listener de Firebase Auth para persistir sesión entre recargas
 * 3. Conecta el store de configuración estética con Firestore (branding global)
 */
export function FirestoreSync() {
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
