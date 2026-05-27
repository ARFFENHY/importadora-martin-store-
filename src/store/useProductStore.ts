import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, Category } from '@/types';
import { PRODUCTS as INITIAL_PRODUCTS, CATEGORIES as INITIAL_CATEGORIES } from '@/data/products';
import { db } from '@/lib/firebase';
import { compressImages } from '@/lib/utils';
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

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: INITIAL_PRODUCTS,
      categories: INITIAL_CATEGORIES,
      isLoading: true,

      subscribe: () => {
        const productsRef = collection(db, 'products');
        const categoriesRef = collection(db, 'categories');

        // Products listener
        const unsubProducts = onSnapshot(
          productsRef,
          (snapshot) => {
            if (snapshot.empty) {
              // Si Firestore está vacío, mantenemos o cargamos los locales/estáticos
              set((state) => ({
                products: state.products.length > 0 ? state.products : INITIAL_PRODUCTS,
                isLoading: false,
              }));
            } else {
              // Fusionar datos de Firestore con imágenes locales de alta calidad
              // Las imágenes en Firestore pueden estar comprimidas; el localStorage
              // puede tener la versión original. Usamos los metadatos de Firestore
              // pero preservamos las imágenes locales si existen.
              set((state) => {
                const localMap = new Map(state.products.map((p) => [p.id, p]));
                const merged = snapshot.docs.map((d) => {
                  const firestoreProduct = { ...d.data(), id: d.id } as Product;
                  const localProduct = localMap.get(d.id);
                  // Si tenemos una versión local con imágenes, usarla (mayor calidad)
                  if (localProduct && localProduct.images && localProduct.images.length > 0) {
                    return { ...firestoreProduct, images: localProduct.images };
                  }
                  return firestoreProduct;
                });
                return { products: merged, isLoading: false };
              });
            }
          },
          (error) => {
            console.error('Error fetching products from Firestore:', error);
            set((state) => ({
              products: state.products.length > 0 ? state.products : INITIAL_PRODUCTS,
              isLoading: false,
            }));
          }
        );

        // Categories listener
        const unsubCategories = onSnapshot(
          categoriesRef,
          (snapshot) => {
            if (snapshot.empty) {
              set((state) => ({
                categories: state.categories.length > 0 ? state.categories : INITIAL_CATEGORIES,
              }));
            } else {
              const categories = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Category));
              set({ categories });
            }
          },
          (error) => {
            console.error('Error fetching categories from Firestore:', error);
            set((state) => ({
              categories: state.categories.length > 0 ? state.categories : INITIAL_CATEGORIES,
            }));
          }
        );

        return () => {
          unsubProducts();
          unsubCategories();
        };
      },

      addProduct: async (newProduct) => {
        const id = `prod-${Date.now()}`;
        const product: Product = {
          ...newProduct,
          id,
          images:
            newProduct.images.length > 0
              ? newProduct.images
              : ['https://images.unsplash.com/photo-1530124560647-55e12e3f8961?q=80&w=600'],
        };
        const clean = JSON.parse(JSON.stringify(product));

        // 1. Actualizar el estado local inmediatamente (optimistic update)
        const currentProducts = get().products;
        set({ products: [...currentProducts, clean] });

        // 2. Comprimir imágenes y guardar en Firestore
        try {
          const compressedImages = await compressImages(clean.images);
          const firestoreDoc = { ...clean, images: compressedImages };
          await setDoc(doc(db, 'products', id), firestoreDoc);
        } catch (error) {
          console.error('Error writing product to Firestore:', error);
          // Revertir el optimistic update si Firestore falla
          set({ products: currentProducts });
          throw error; // re-throw para la UI
        }
      },

      updateProduct: async (id, updates) => {
        const clean = JSON.parse(JSON.stringify(updates));

        // 1. Actualizar el estado local inmediatamente (optimistic update)
        const currentProducts = get().products;
        const updatedProducts = currentProducts.map((p) =>
          p.id === id ? { ...p, ...clean } : p
        );
        set({ products: updatedProducts });

        // 2. Comprimir imágenes (si hay nuevas) y actualizar en Firestore
        try {
          let firestoreUpdates = { ...clean };
          if (clean.images && clean.images.length > 0) {
            firestoreUpdates.images = await compressImages(clean.images);
          }
          await updateDoc(doc(db, 'products', id), firestoreUpdates);
        } catch (error) {
          console.error('Error updating product in Firestore:', error);
          // Revertir el optimistic update si Firestore falla
          set({ products: currentProducts });
          throw error; // re-throw para la UI
        }
      },

      deleteProduct: async (id) => {
        // 1. Actualizar el estado local inmediatamente
        const remainingProducts = get().products.filter((p) => p.id !== id);
        set({ products: remainingProducts });

        // 2. Intentar eliminar en Firestore
        try {
          await deleteDoc(doc(db, 'products', id));
        } catch (error) {
          console.error('Error deleting product from Firestore:', error);
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

        // 1. Actualizar el estado local inmediatamente
        set({ categories: [...categories, category] });

        // 2. Intentar guardar en Firestore
        try {
          await setDoc(doc(db, 'categories', id), category);
        } catch (error) {
          console.error('Error writing category to Firestore:', error);
        }
      },

      deleteCategory: async (id) => {
        const { categories, products } = get();
        const categoryToDelete = categories.find((c) => c.id === id);
        if (!categoryToDelete) return;

        // 1. Actualizar el estado local inmediatamente
        const remainingCategories = categories.filter((c) => c.id !== id);
        const updatedProducts = products.map((p) =>
          p.category === categoryToDelete.name ? { ...p, category: 'Otros' } : p
        );
        set({ categories: remainingCategories, products: updatedProducts });

        // 2. Intentar actualizar en Firestore usando Batch
        try {
          const batch = writeBatch(db);
          batch.delete(doc(db, 'categories', id));

          products
            .filter((p) => p.category === categoryToDelete.name)
            .forEach((p) => {
              batch.update(doc(db, 'products', p.id), { category: 'Otros' });
            });

          await batch.commit();
        } catch (error) {
          console.error('Error deleting category from Firestore:', error);
        }
      },

      resetProductsToDefault: async () => {
        // 1. Actualizar el estado local inmediatamente
        set({ products: INITIAL_PRODUCTS, categories: INITIAL_CATEGORIES });

        // 2. Intentar actualizar en Firestore usando Batch
        try {
          const { products: currentProducts, categories: currentCategories } = get();
          const batch = writeBatch(db);

          // Eliminar productos actuales
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
        } catch (error) {
          console.error('Error resetting products to default in Firestore:', error);
        }
      },
    }),
    {
      name: 'products-storage',
      // Solo persistimos productos y categorías, no el estado de carga (isLoading)
      partialize: (state) => ({
        products: state.products,
        categories: state.categories,
      }),
    }
  )
);
