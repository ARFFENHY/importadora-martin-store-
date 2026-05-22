import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, Category } from '@/types';
import { PRODUCTS as INITIAL_PRODUCTS, CATEGORIES as INITIAL_CATEGORIES } from '@/data/products';

interface ProductState {
  products: Product[];
  categories: Category[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCategory: (name: string) => void;
  deleteCategory: (id: string) => void;
  resetProductsToDefault: () => void;
}

export const useProductStore = create<ProductState>()(
  persist(
    (set) => ({
      products: INITIAL_PRODUCTS,
      categories: INITIAL_CATEGORIES,

      addProduct: (newProduct) =>
        set((state) => {
          const id = `prod-${Date.now()}`;
          const product: Product = {
            ...newProduct,
            id,
            images: newProduct.images.length > 0 ? newProduct.images : ['https://images.unsplash.com/photo-1530124560647-55e12e3f8961?q=80&w=600'],
          };
          return { products: [product, ...state.products] };
        }),

      updateProduct: (id, updates) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),

      addCategory: (name) =>
        set((state) => {
          const id = `cat-${Date.now()}`;
          const slug = name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // remove accents
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');

          // Check if category already exists
          if (state.categories.some((c) => c.slug === slug)) {
            return state;
          }

          const category: Category = { id, name, slug };
          return { categories: [...state.categories, category] };
        }),

      deleteCategory: (id) =>
        set((state) => {
          const categoryToDelete = state.categories.find((c) => c.id === id);
          if (!categoryToDelete) return state;

          return {
            categories: state.categories.filter((c) => c.id !== id),
            // Optionally, products in deleted category could be moved to 'Otros' or general
            products: state.products.map((p) =>
              p.category === categoryToDelete.name ? { ...p, category: 'Otros' } : p
            ),
          };
        }),

      resetProductsToDefault: () =>
        set({
          products: INITIAL_PRODUCTS,
          categories: INITIAL_CATEGORIES,
        }),
    }),
    {
      name: 'products-storage',
    }
  )
);
