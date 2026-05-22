import { create } from 'zustand';
import { Product, Category } from '@/types';
import { PRODUCTS as INITIAL_PRODUCTS, CATEGORIES as INITIAL_CATEGORIES } from '@/data/products';
import { db } from '@/lib/firebase';
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

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  categories: INITIAL_CATEGORIES,
  isLoading: true,

  subscribe: () => {
    const productsRef = collection(db, 'products');
    const categoriesRef = collection(db, 'categories');

    // Products listener with auto-seed
    const unsubProducts = onSnapshot(productsRef, async (snapshot) => {
      if (snapshot.empty) {
        // Firestore vacío → sembrar con productos por defecto
        const batch = writeBatch(db);
        INITIAL_PRODUCTS.forEach((product) => {
          batch.set(doc(productsRef, product.id), product);
        });
        await batch.commit();
        return;
      }
      const products = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Product));
      set({ products, isLoading: false });
    });

    // Categories listener with auto-seed
    const unsubCategories = onSnapshot(categoriesRef, async (snapshot) => {
      if (snapshot.empty) {
        const batch = writeBatch(db);
        INITIAL_CATEGORIES.forEach((cat) => {
          batch.set(doc(categoriesRef, cat.id), cat);
        });
        await batch.commit();
        return;
      }
      const categories = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Category));
      set({ categories });
    });

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
    // Limpiar undefined antes de escribir a Firestore
    const clean = JSON.parse(JSON.stringify(product));
    await setDoc(doc(db, 'products', id), clean);
  },

  updateProduct: async (id, updates) => {
    const clean = JSON.parse(JSON.stringify(updates));
    await updateDoc(doc(db, 'products', id), clean);
  },

  deleteProduct: async (id) => {
    await deleteDoc(doc(db, 'products', id));
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
    await setDoc(doc(db, 'categories', id), category);
  },

  deleteCategory: async (id) => {
    const { categories, products } = get();
    const categoryToDelete = categories.find((c) => c.id === id);
    if (!categoryToDelete) return;

    const batch = writeBatch(db);
    batch.delete(doc(db, 'categories', id));

    // Mover productos de la categoría eliminada a "Otros"
    products
      .filter((p) => p.category === categoryToDelete.name)
      .forEach((p) => {
        batch.update(doc(db, 'products', p.id), { category: 'Otros' });
      });

    await batch.commit();
  },

  resetProductsToDefault: async () => {
    const { products } = get();
    const batch = writeBatch(db);

    // Eliminar todos los productos actuales
    products.forEach((p) => {
      batch.delete(doc(db, 'products', p.id));
    });

    // Agregar los productos por defecto
    INITIAL_PRODUCTS.forEach((p) => {
      batch.set(doc(db, 'products', p.id), p);
    });

    await batch.commit();
  },
}));
