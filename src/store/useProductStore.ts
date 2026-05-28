import { create } from 'zustand';
import { Product, Category } from '@/types';
import { PRODUCTS as INITIAL_PRODUCTS, CATEGORIES as INITIAL_CATEGORIES } from '@/data/products';
import { db, storage } from '@/lib/firebase';
import { compressImages } from '@/lib/utils';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';

interface ProductState {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  resetProductsToDefault: () => Promise<void>;
  subscribe: () => () => void;
}

/**
 * Sube imágenes Base64 a Firebase Storage en paralelo.
 * Si la imagen ya es una URL externa (http/https), la devuelve intacta.
 */
async function uploadProductImages(productId: string, images: string[]): Promise<string[]> {
  console.log(`[Storage] Iniciando compresión de ${images.length} imágenes...`);
  // Comprimir para ahorrar ancho de banda y espacio
  const compressed = await compressImages(images);
  console.log(`[Storage] Compresión completada.`);

  const uploadPromises = compressed.map(async (image, index) => {
    if (!image.startsWith('data:image')) {
      return image; // Ya es una URL pública
    }

    const uniqueId = `${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    console.log(`[Storage] Subiendo imagen ${index + 1}/${compressed.length} a Storage...`);
    const imageRef = ref(storage, `products/${productId}/image_${index}_${uniqueId}.jpg`);
    
    // Subir usando formato 'data_url' de Firebase
    await uploadString(imageRef, image, 'data_url');
    const downloadURL = await getDownloadURL(imageRef);
    
    console.log(`[Storage] Imagen ${index + 1} subida con éxito. URL: ${downloadURL}`);
    return downloadURL;
  });

  return Promise.all(uploadPromises);
}

/**
 * Elimina un array de imágenes de Firebase Storage (utilizado para rollbacks y limpieza).
 */
async function deleteProductImages(productId: string, imageUrls: string[]) {
  const deletePromises = imageUrls.map(async (url) => {
    if (url.includes('firebasestorage.googleapis.com')) {
      try {
        console.log(`[Storage] Eliminando imagen en desuso de Storage: ${url}`);
        const fileRef = ref(storage, url);
        await deleteObject(fileRef);
      } catch (err) {
        console.error(`[Storage] Error al eliminar imagen de Storage: ${url}`, err);
      }
    }
  });
  await Promise.all(deletePromises);
}

export const useProductStore = create<ProductState>()((set, get) => ({
  products: INITIAL_PRODUCTS,
  categories: INITIAL_CATEGORIES,
  isLoading: true,

  subscribe: () => {
    const productsRef = collection(db, 'products');
    const categoriesRef = collection(db, 'categories');

    // Listener de Productos en Tiempo Real
    const unsubProducts = onSnapshot(
      productsRef,
      (snapshot) => {
        if (snapshot.empty) {
          console.log('[Firestore] Colección de productos vacía en Firestore. Cargando estáticos en interfaz.');
          set({ products: INITIAL_PRODUCTS, isLoading: false });
        } else {
          const products = snapshot.docs.map((d) => ({
            ...d.data(),
            id: d.id,
          }) as Product);

          // Ordenar por fecha de creación (createdAt) si existe
          products.sort((a: any, b: any) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA; // Más nuevos primero
          });

          console.log(`[Firestore] Recibidos ${products.length} productos de Firestore.`);
          set({ products, isLoading: false });
        }
      },
      (error) => {
        console.error('[Firestore] Error en listener de productos:', error);
        set({ products: INITIAL_PRODUCTS, isLoading: false });
      }
    );

    // Listener de Categorías en Tiempo Real
    const unsubCategories = onSnapshot(
      categoriesRef,
      (snapshot) => {
        if (snapshot.empty) {
          console.log('[Firestore] Colección de categorías vacía. Cargando estáticos.');
          set({ categories: INITIAL_CATEGORIES });
        } else {
          const categories = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Category));
          console.log(`[Firestore] Recibidas ${categories.length} categorías de Firestore.`);
          set({ categories });
        }
      },
      (error) => {
        console.error('[Firestore] Error en listener de categorías:', error);
        set({ categories: INITIAL_CATEGORIES });
      }
    );

    return () => {
      unsubProducts();
      unsubCategories();
    };
  },

  addProduct: async (newProduct) => {
    const id = `prod-${Date.now()}`;
    console.log(`[Zustand] Iniciando creación de producto con ID: ${id}`, newProduct);

    // 1. Subir imágenes a Firebase Storage
    let imageUrls: string[] = [];
    try {
      if (newProduct.images && newProduct.images.length > 0) {
        imageUrls = await uploadProductImages(id, newProduct.images);
      } else {
        imageUrls = ['https://images.unsplash.com/photo-1530124560647-55e12e3f8961?q=80&w=600'];
      }
    } catch (error) {
      console.error('[Storage] Error al procesar/subir imágenes:', error);
      throw new Error(`Error en Firebase Storage al subir fotos: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 2. Armar documento final
    const product: Product & { createdAt: string } = {
      ...newProduct,
      id,
      images: imageUrls,
      createdAt: new Date().toISOString(),
    };
    const clean = JSON.parse(JSON.stringify(product));

    console.log(`[Firestore] Escribiendo documento en colección 'products/${id}':`, clean);

    // 3. Escribir en Firestore
    try {
      await setDoc(doc(db, 'products', id), clean);
      console.log(`[Firestore] Producto guardado con éxito. ID: ${id}`);
    } catch (error) {
      console.error('[Firestore] Error al guardar producto:', error);
      // Rollback de imágenes subidas para no dejar basura en Storage
      try {
        await deleteProductImages(id, imageUrls);
      } catch (delErr) {
        console.error('[Storage] Falló rollback de fotos tras error de Firestore:', delErr);
      }
      throw error;
    }
  },

  updateProduct: async (id, updates) => {
    console.log(`[Zustand] Iniciando actualización de producto ID: ${id}`, updates);
    const { products } = get();
    const originalProduct = products.find((p) => p.id === id);

    if (!originalProduct) {
      throw new Error(`Producto con ID ${id} no encontrado.`);
    }

    // 1. Subir imágenes nuevas (si hay) y recuperar las existentes
    let imageUrls: string[] = [];
    if (updates.images) {
      try {
        imageUrls = await uploadProductImages(id, updates.images);
      } catch (error) {
        console.error('[Storage] Error al actualizar imágenes:', error);
        throw new Error(`Error en Firebase Storage al subir fotos nuevas: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // 2. Preparar el payload limpio
    const clean = JSON.parse(JSON.stringify(updates));
    if (updates.images) {
      clean.images = imageUrls;
    }

    console.log(`[Firestore] Actualizando documento 'products/${id}':`, clean);

    // 3. Actualizar en Firestore
    try {
      await updateDoc(doc(db, 'products', id), clean);
      console.log(`[Firestore] Producto actualizado con éxito. ID: ${id}`);

      // 4. Limpiar imágenes viejas que ya no se usan
      if (originalProduct.images && updates.images) {
        const unusedUrls = originalProduct.images.filter((url) => !imageUrls.includes(url));
        if (unusedUrls.length > 0) {
          console.log(`[Storage] Limpiando ${unusedUrls.length} imágenes obsoletas de Storage...`);
          await deleteProductImages(id, unusedUrls);
        }
      }
    } catch (error) {
      console.error('[Firestore] Error al actualizar producto:', error);
      // Rollback si subimos imágenes nuevas pero falló Firestore
      if (updates.images) {
        try {
          const newlyAdded = imageUrls.filter((url) => !originalProduct.images.includes(url));
          await deleteProductImages(id, newlyAdded);
        } catch (delErr) {
          console.error('[Storage] Falló rollback de fotos nuevas tras error de Firestore:', delErr);
        }
      }
      throw error;
    }
  },

  deleteProduct: async (id) => {
    console.log(`[Zustand] Iniciando eliminación de producto ID: ${id}`);
    const { products } = get();
    const originalProduct = products.find((p) => p.id === id);

    // 1. Eliminar de Firestore
    try {
      await deleteDoc(doc(db, 'products', id));
      console.log(`[Firestore] Producto eliminado con éxito de Firestore. ID: ${id}`);

      // 2. Eliminar todas sus fotos de Storage
      if (originalProduct && originalProduct.images) {
        console.log(`[Storage] Eliminando todas las fotos asociadas a ${id}...`);
        await deleteProductImages(id, originalProduct.images);
      }
    } catch (error) {
      console.error('[Firestore] Error al eliminar producto:', error);
      throw error;
    }
  },

  addCategory: async (name) => {
    const { categories } = get();
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    if (categories.some((c) => c.slug === slug)) return;

    const id = `cat-${Date.now()}`;
    const category: Category = { id, name, slug };

    set({ categories: [...categories, category] });

    try {
      await setDoc(doc(db, 'categories', id), category);
      console.log(`[Firestore] Categoría agregada con éxito. ID: ${id}`);
    } catch (error) {
      console.error('[Firestore] Error al guardar categoría:', error);
      throw error;
    }
  },

  deleteCategory: async (id) => {
    const { categories, products } = get();
    const categoryToDelete = categories.find((c) => c.id === id);
    if (!categoryToDelete) return;

    const remainingCategories = categories.filter((c) => c.id !== id);
    const updatedProducts = products.map((p) =>
      p.category === categoryToDelete.name ? { ...p, category: 'Otros' } : p
    );
    set({ categories: remainingCategories, products: updatedProducts });

    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'categories', id));

      products
        .filter((p) => p.category === categoryToDelete.name)
        .forEach((p) => {
          batch.update(doc(db, 'products', p.id), { category: 'Otros' });
        });

      await batch.commit();
      console.log(`[Firestore] Categoría eliminada con éxito y productos redirigidos. ID: ${id}`);
    } catch (error) {
      console.error('[Firestore] Error al eliminar categoría:', error);
      throw error;
    }
  },

  resetProductsToDefault: async () => {
    console.log('[Zustand] Restableciendo base de datos a valores de demostración...');
    set({ products: INITIAL_PRODUCTS, categories: INITIAL_CATEGORIES });

    try {
      const { products: currentProducts, categories: currentCategories } = get();
      const batch = writeBatch(db);

      // Eliminar productos actuales en lote
      currentProducts.forEach((p) => {
        batch.delete(doc(db, 'products', p.id));
      });

      // Agregar productos por defecto
      INITIAL_PRODUCTS.forEach((p) => {
        batch.set(doc(db, 'products', p.id), p);
      });

      // Eliminar categorías actuales
      currentCategories.forEach((c) => {
        batch.delete(doc(db, 'categories', c.id));
      });

      // Agregar categorías por defecto
      INITIAL_CATEGORIES.forEach((c) => {
        batch.set(doc(db, 'categories', c.id), c);
      });

      await batch.commit();
      console.log('[Firestore] Base de datos restablecida con éxito a valores de demostración.');
    } catch (error) {
      console.error('[Firestore] Error al restablecer base de datos:', error);
      throw error;
    }
  },
}));
