'use client';

import { useEffect } from 'react';
import { useProductStore } from '@/store/useProductStore';

/**
 * Componente invisible que conecta el store de productos con Firestore.
 * Se monta una vez en el RootLayout y mantiene el listener activo.
 * Cuando Firestore cambia, el store se actualiza en tiempo real en todos los dispositivos.
 */
export function FirestoreSync() {
  const subscribe = useProductStore((s) => s.subscribe);

  useEffect(() => {
    const unsubscribe = subscribe();
    return () => unsubscribe();
  }, [subscribe]);

  return null;
}
