import { create } from 'zustand';
import { Product, Category } from '@/types';
import { PRODUCTS as INITIAL_PRODUCTS, CATEGORIES as INITIAL_CATEGORIES } from '@/data/products';
import { supabase } from '@/lib/supabase';
import { compressImages } from '@/lib/utils';

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

// ============================================================================
// MAPEADORES TRANSPARENTES POSTGRES <=> FRONTEND
// ============================================================================

function mapDbProductToFrontend(dbProd: any): Product {
  return {
    id: dbProd.id,
    name: dbProd.title, // Postgres 'title' -> Frontend 'name'
    description: dbProd.description || '',
    price: Number(dbProd.price),
    originalPrice: dbProd.original_price ? Number(dbProd.original_price) : undefined,
    discount: dbProd.discount ? Number(dbProd.discount) : undefined,
    images: dbProd.images || [],
    category: dbProd.category || 'Otros',
    stock: dbProd.stock !== null && dbProd.stock !== undefined ? Number(dbProd.stock) : undefined,
    tags: dbProd.tags || [],
    isNew: !!dbProd.badge,         // Postgres 'badge' -> Frontend 'isNew'
    isFeatured: !!dbProd.featured, // Postgres 'featured' -> Frontend 'isFeatured'
  };
}

function mapFrontendProductToDb(feProd: Partial<Product>): any {
  const dbProd: any = {};
  if (feProd.id !== undefined) dbProd.id = feProd.id;
  if (feProd.name !== undefined) dbProd.title = feProd.name; // Frontend 'name' -> Postgres 'title'
  if (feProd.description !== undefined) dbProd.description = feProd.description;
  if (feProd.price !== undefined) dbProd.price = feProd.price;
  if (feProd.originalPrice !== undefined) dbProd.original_price = feProd.originalPrice;
  if (feProd.discount !== undefined) dbProd.discount = feProd.discount;
  if (feProd.images !== undefined) dbProd.images = feProd.images;
  if (feProd.category !== undefined) dbProd.category = feProd.category;
  if (feProd.stock !== undefined) dbProd.stock = feProd.stock;
  if (feProd.tags !== undefined) dbProd.tags = feProd.tags;
  if (feProd.isNew !== undefined) dbProd.badge = feProd.isNew;         // Frontend 'isNew' -> Postgres 'badge'
  if (feProd.isFeatured !== undefined) dbProd.featured = feProd.isFeatured; // Frontend 'isFeatured' -> Postgres 'featured'
  return dbProd;
}

// ============================================================================
// HELPERS DE STORAGE DE SUPABASE
// ============================================================================

/**
 * Sube imágenes a Supabase Storage Bucket 'products'.
 * Convierte Base64 a datos binarios (Blob) antes de subir.
 * Mantiene intactas las imágenes que ya son URLs externas (http/https).
 */
async function uploadProductImages(productId: string, images: string[]): Promise<string[]> {
  console.log(`[Storage] Iniciando compresión de ${images.length} imágenes...`);
  const compressed = await compressImages(images);
  console.log(`[Storage] Compresión completada.`);

  const uploadPromises = compressed.map(async (image, index) => {
    if (!image.startsWith('data:image')) {
      return image; // Ya es una URL pública
    }

    try {
      // Extraer datos base64 y tipo MIME
      const base64Data = image.split(',')[1];
      const mimeMatch = image.match(/data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      
      // Convertir base64 a Blob binario
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const fileBlob = new Blob([byteArray], { type: mimeType });

      // Definir nombre de archivo único
      const uniqueId = `${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      const fileExtension = mimeType.split('/')[1] || 'jpg';
      const fileName = `${productId}/img_${index}_${uniqueId}.${fileExtension}`;
      
      console.log(`[Storage] Subiendo imagen ${index + 1}/${compressed.length} a Supabase: ${fileName}`);
      
      const { error } = await supabase.storage
        .from('products')
        .upload(fileName, fileBlob, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        throw error;
      }

      // Obtener URL pública
      const { data: publicUrlData } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      const publicURL = publicUrlData.publicUrl;
      console.log(`[Storage] Imagen ${index + 1} subida. URL: ${publicURL}`);
      return publicURL;
    } catch (err) {
      console.error(`[Storage] Error al subir imagen ${index + 1}:`, err);
      throw new Error(`Fallo al subir imagen en Supabase Storage: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  return Promise.all(uploadPromises);
}

/**
 * Elimina imágenes en desuso de Supabase Storage.
 */
async function deleteProductImages(productId: string, imageUrls: string[]) {
  const deletePromises = imageUrls.map(async (url) => {
    if (url.includes('/storage/v1/object/public/products/')) {
      try {
        const pathParts = url.split('/storage/v1/object/public/products/');
        if (pathParts.length > 1) {
          const filePath = decodeURIComponent(pathParts[1]);
          console.log(`[Storage] Eliminando imagen obsoleta de Storage: ${filePath}`);
          const { error } = await supabase.storage.from('products').remove([filePath]);
          if (error) {
            console.error(`[Storage] Error al eliminar ${filePath} de Storage:`, error);
          }
        }
      } catch (err) {
        console.error(`[Storage] Error al parsear URL de imagen para eliminación: ${url}`, err);
      }
    }
  });
  await Promise.all(deletePromises);
}

// ============================================================================
// ZUSTAND STORE IMPLEMENTATION
// ============================================================================

export const useProductStore = create<ProductState>()((set, get) => ({
  products: INITIAL_PRODUCTS,
  categories: INITIAL_CATEGORIES,
  isLoading: true,

  subscribe: () => {
    console.log('[Supabase] Iniciando suscripciones y carga inicial de base de datos...');

    // Suscripción al Canal en Tiempo Real para Productos
    const productsChannel = supabase
      .channel('realtime-products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        async (payload) => {
          console.log('[Supabase Realtime] Cambio detectado en productos:', payload.eventType);
          
          // Re-cargar productos de forma ordenada
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('[Supabase Realtime] Error al sincronizar productos:', error);
          } else if (data) {
            const mapped = data.map(mapDbProductToFrontend);
            set({ products: mapped, isLoading: false });
          }
        }
      )
      .subscribe();

    // Suscripción al Canal en Tiempo Real para Categorías
    const categoriesChannel = supabase
      .channel('realtime-categories')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        async (payload) => {
          console.log('[Supabase Realtime] Cambio detectado en categorías:', payload.eventType);
          
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name', { ascending: true });

          if (error) {
            console.error('[Supabase Realtime] Error al sincronizar categorías:', error);
          } else if (data) {
            set({ categories: data as Category[] });
          }
        }
      )
      .subscribe();

    // Carga inicial asíncrona
    const loadInitialData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          supabase.from('products').select('*').order('created_at', { ascending: false }),
          supabase.from('categories').select('*').order('name', { ascending: true })
        ]);

        if (prodRes.error) throw prodRes.error;
        
        const dbProducts = prodRes.data && prodRes.data.length > 0
          ? prodRes.data.map(mapDbProductToFrontend)
          : INITIAL_PRODUCTS;

        const dbCategories = catRes.data && catRes.data.length > 0
          ? (catRes.data as Category[])
          : INITIAL_CATEGORIES;

        console.log(`[Supabase] Carga inicial exitosa. ${dbProducts.length} productos, ${dbCategories.length} categorías.`);
        set({ products: dbProducts, categories: dbCategories, isLoading: false });
      } catch (err) {
        console.error('[Supabase] Error en carga inicial, usando datos estáticos por defecto:', err);
        set({ products: INITIAL_PRODUCTS, categories: INITIAL_CATEGORIES, isLoading: false });
      }
    };

    void loadInitialData();

    // Retorna función de desuscripción limpia
    return () => {
      console.log('[Supabase] Limpiando canales de tiempo real...');
      void supabase.removeChannel(productsChannel);
      void supabase.removeChannel(categoriesChannel);
    };
  },

  addProduct: async (newProduct) => {
    // Generar un ID temporal para organizar la carpeta en el Storage
    const tempFolderId = `prod-${Date.now()}`;
    console.log(`[Zustand] Creando producto. Carpeta temporal Storage: ${tempFolderId}`);

    // 1. Subir imágenes a Storage
    let imageUrls: string[] = [];
    try {
      if (newProduct.images && newProduct.images.length > 0) {
        imageUrls = await uploadProductImages(tempFolderId, newProduct.images);
      } else {
        imageUrls = ['https://images.unsplash.com/photo-1530124560647-55e12e3f8961?q=80&w=600'];
      }
    } catch (storageErr) {
      console.error('[Storage] Error crítico al subir imágenes:', storageErr);
      throw storageErr;
    }

    // 2. Mapear y preparar documento de base de datos
    const dbPayload = mapFrontendProductToDb({
      ...newProduct,
      images: imageUrls,
    });
    // Permitimos que Postgres auto-genere el ID en formato UUID

    console.log('[Supabase] Insertando producto en la tabla products:', dbPayload);

    // 3. Escribir en base de datos
    const { data, error } = await supabase
      .from('products')
      .insert(dbPayload)
      .select();

    if (error) {
      console.error('[Supabase] Error al insertar en tabla products:', error);
      // Rollback: Eliminar fotos en storage para no saturar con basura
      try {
        await deleteProductImages(tempFolderId, imageUrls);
      } catch (delErr) {
        console.error('[Storage] Falló rollback de fotos de producto fallido:', delErr);
      }
      throw new Error(`Error en base de datos de Supabase: ${error.message}`);
    }

    console.log('[Supabase] Producto insertado con éxito en DB.');

    // 4. Actualizar estado local inmediatamente para feedback rápido (defensa)
    if (data && data.length > 0) {
      const createdProduct = mapDbProductToFrontend(data[0]);
      set((state) => ({
        products: [createdProduct, ...state.products],
      }));
    }
  },

  updateProduct: async (id, updates) => {
    console.log(`[Zustand] Modificando producto ID: ${id}`, updates);
    const { products } = get();
    const originalProduct = products.find((p) => p.id === id);

    if (!originalProduct) {
      throw new Error(`Producto con ID ${id} no encontrado.`);
    }

    // 1. Subir imágenes nuevas (si hay Base64)
    let imageUrls: string[] = [];
    if (updates.images) {
      try {
        imageUrls = await uploadProductImages(id, updates.images);
      } catch (storageErr) {
        console.error('[Storage] Error crítico al actualizar imágenes:', storageErr);
        throw storageErr;
      }
    }

    // 2. Preparar el payload de Postgres
    const dbPayload = mapFrontendProductToDb({
      ...updates,
      ...(updates.images ? { images: imageUrls } : {}),
    });

    console.log(`[Supabase] Actualizando fila products donde id = ${id}:`, dbPayload);

    // 3. Actualizar fila en DB
    const { data, error } = await supabase
      .from('products')
      .update(dbPayload)
      .eq('id', id)
      .select();

    if (error) {
      console.error('[Supabase] Error al actualizar en products:', error);
      // Rollback de imágenes nuevas si falló la DB
      if (updates.images) {
        try {
          const newlyAdded = imageUrls.filter((url) => !originalProduct.images.includes(url));
          await deleteProductImages(id, newlyAdded);
        } catch (delErr) {
          console.error('[Storage] Falló rollback de fotos nuevas tras error de DB:', delErr);
        }
      }
      throw new Error(`Error en base de datos al actualizar: ${error.message}`);
    }

    console.log('[Supabase] Producto actualizado con éxito en DB.');

    // 4. Limpiar fotos obsoletas
    if (originalProduct.images && updates.images) {
      const unusedUrls = originalProduct.images.filter((url) => !imageUrls.includes(url));
      if (unusedUrls.length > 0) {
        console.log(`[Storage] Limpiando ${unusedUrls.length} fotos antiguas de Storage...`);
        await deleteProductImages(id, unusedUrls);
      }
    }

    // 5. Actualizar estado local inmediatamente
    if (data && data.length > 0) {
      const updatedProduct = mapDbProductToFrontend(data[0]);
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? updatedProduct : p)),
      }));
    }
  },

  deleteProduct: async (id) => {
    console.log(`[Zustand] Eliminando producto ID: ${id}`);
    const { products } = get();
    const originalProduct = products.find((p) => p.id === id);

    if (!originalProduct) return;

    // 1. Eliminar fila en base de datos
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      console.error('[Supabase] Error al eliminar en products:', error);
      throw new Error(`Error de base de datos al eliminar: ${error.message}`);
    }

    console.log('[Supabase] Fila eliminada de DB.');

    // 2. Eliminar fotos de Storage
    if (originalProduct.images && originalProduct.images.length > 0) {
      console.log(`[Storage] Eliminando fotos asociadas a ${id} de Storage...`);
      await deleteProductImages(id, originalProduct.images);
    }

    // 3. Actualizar estado local inmediatamente
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    }));
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

    const categoryPayload = { name, slug };
    console.log('[Supabase] Creando categoría:', categoryPayload);

    const { data, error } = await supabase
      .from('categories')
      .insert(categoryPayload)
      .select();

    if (error) {
      console.error('[Supabase] Error al crear categoría:', error);
      throw new Error(`Error de base de datos al agregar categoría: ${error.message}`);
    }

    console.log('[Supabase] Categoría creada con éxito en DB.');

    if (data && data.length > 0) {
      set((state) => ({
        categories: [...state.categories, data[0] as Category],
      }));
    }
  },

  deleteCategory: async (id) => {
    const { categories, products } = get();
    const categoryToDelete = categories.find((c) => c.id === id);
    if (!categoryToDelete) return;

    console.log(`[Zustand] Eliminando categoría: ${categoryToDelete.name}`);

    // 1. En Supabase, reasignar productos de esta categoría a 'Otros'
    const { error: updateErr } = await supabase
      .from('products')
      .update({ category: 'Otros' })
      .eq('category', categoryToDelete.name);

    if (updateErr) {
      console.warn('[Supabase] No se pudieron reasignar algunos productos a la categoría Otros:', updateErr);
    }

    // 2. Eliminar la categoría de la DB
    const { error: deleteErr } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (deleteErr) {
      console.error('[Supabase] Error al eliminar categoría:', deleteErr);
      throw new Error(`Error de base de datos al eliminar categoría: ${deleteErr.message}`);
    }

    console.log('[Supabase] Categoría eliminada con éxito en DB.');

    // 3. Sincronizar estado local inmediatamente
    const remainingCategories = categories.filter((c) => c.id !== id);
    const updatedProducts = products.map((p) =>
      p.category === categoryToDelete.name ? { ...p, category: 'Otros' } : p
    );
    set({ categories: remainingCategories, products: updatedProducts });
  },

  resetProductsToDefault: async () => {
    console.log('[Zustand] Restableciendo base de datos a valores de demostración...');
    set({ isLoading: true });

    try {
      const { products: currentProducts, categories: currentCategories } = get();

      // 1. Eliminar productos actuales de Supabase
      if (currentProducts.length > 0) {
        const currentIds = currentProducts.map((p) => p.id);
        const { error: delProdErr } = await supabase
          .from('products')
          .delete()
          .in('id', currentIds);
        if (delProdErr) throw delProdErr;
      }

      // 2. Eliminar categorías actuales de Supabase
      if (currentCategories.length > 0) {
        const currentCatIds = currentCategories.map((c) => c.id);
        const { error: delCatErr } = await supabase
          .from('categories')
          .delete()
          .in('id', currentCatIds);
        if (delCatErr) throw delCatErr;
      }

      // 3. Insertar las categorías estáticas iniciales (dejando que Supabase genere UUID)
      const categoriesPayload = INITIAL_CATEGORIES.map((c) => ({
        name: c.name,
        slug: c.slug,
        icon: c.icon || null,
        image: c.image || null,
      }));

      const { data: newCats, error: insCatErr } = await supabase
        .from('categories')
        .insert(categoriesPayload)
        .select();

      if (insCatErr) throw insCatErr;

      // 4. Insertar los productos estáticos iniciales
      const productsPayload = INITIAL_PRODUCTS.map((p) => {
        const dbPayload = mapFrontendProductToDb(p);
        // Quitar el ID estático si no es UUID para evitar fallos de tipo
        if (dbPayload.id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dbPayload.id)) {
          delete dbPayload.id;
        }
        return dbPayload;
      });

      const { data: newProds, error: insProdErr } = await supabase
        .from('products')
        .insert(productsPayload)
        .select();

      if (insProdErr) throw insProdErr;

      console.log('[Supabase] Restauración de base de datos completada con éxito.');

      const mappedProds = newProds ? newProds.map(mapDbProductToFrontend) : INITIAL_PRODUCTS;
      const mappedCats = newCats ? (newCats as Category[]) : INITIAL_CATEGORIES;

      set({ products: mappedProds, categories: mappedCats, isLoading: false });
    } catch (err) {
      console.error('[Supabase] Error al restablecer base de datos:', err);
      set({ isLoading: false });
      throw err;
    }
  },
}));
