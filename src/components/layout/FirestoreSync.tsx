'use client';

import { useEffect } from 'react';
import { useProductStore } from '@/store/useProductStore';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Componente invisible que:
 * 1. Conecta el store de productos con Firestore (listener en tiempo real)
 * 2. Inicia el listener de Firebase Auth para persistir sesión entre recargas
 */
export function FirestoreSync() {
  const subscribe = useProductStore((s) => s.subscribe);
  const initAuthListener = useAuthStore((s) => s.initAuthListener);

  useEffect(() => {
    const unsubProducts = subscribe();
    const unsubAuth = initAuthListener();
    return () => {
      unsubProducts();
      unsubAuth();
    };
  }, [subscribe, initAuthListener]);

  return null;
}
