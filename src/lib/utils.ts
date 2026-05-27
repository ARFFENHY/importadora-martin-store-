import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(price);
}

/**
 * Comprime una imagen base64 usando Canvas para reducir su tamaño.
 * Firestore tiene un límite de 1MB por documento; esto mantiene cada
 * imagen por debajo de ~150KB (max 800px, calidad 0.7).
 * Las URLs externas (http/https) se devuelven sin modificar.
 */
export function compressBase64Image(
  base64: string,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7
): Promise<string> {
  // SSR Safeguard: si estamos en el servidor, no podemos usar Canvas o Image
  if (typeof window === 'undefined') return Promise.resolve(base64);
  
  // Si es una URL externa o no es base64, no comprimimos
  if (!base64 || !base64.startsWith('data:image')) return Promise.resolve(base64);

  return new Promise((resolve) => {
    // Salvaguarda: si tarda más de 3 segundos, resolvemos con la imagen original para no colgar el guardado
    const timer = setTimeout(() => {
      resolve(base64);
    }, 3000);

    const img = new Image();
    img.onload = () => {
      clearTimeout(timer);
      let { width, height } = img;

      // Reducir proporcionalmente si supera el máximo
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64); // fallback sin cambios
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(base64); // fallback sin cambios
    };
    img.src = base64;
  });
}

/**
 * Comprime un array de imágenes base64.
 */
export async function compressImages(images: string[]): Promise<string[]> {
  if (!images || images.length === 0) return [];
  return Promise.all(images.map((img) => compressBase64Image(img)));
}
