import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/types';
import { useProductStore } from './useProductStore';

export interface Order {
  id: string;
  date: string;
  customerName: string;
  customerPhone: string;
  deliveryMethod: 'delivery' | 'pickup';
  address?: string;
  city?: string;
  paymentMethod: string;
  notes?: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'completed' | 'canceled';
}

interface OrderState {
  orders: Order[];
  addOrder: (orderData: Omit<Order, 'id' | 'date' | 'status'>) => string;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  deleteOrder: (id: string) => void;
  clearOrders: () => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],

      addOrder: (orderData) => {
        const id = `ped-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;
        const date = new Date().toISOString();
        
        const newOrder: Order = {
          ...orderData,
          id,
          date,
          status: 'pending'
        };

        set((state) => ({
          orders: [newOrder, ...state.orders]
        }));

        return id;
      },

      updateOrderStatus: (id, status) =>
        set((state) => {
          const order = state.orders.find((o) => o.id === id);
          if (!order) return state;

          const oldStatus = order.status || 'pending';
          const newStatus = status;

          // Deduct stock if transitioning to 'completed' and wasn't completed before
          if (newStatus === 'completed' && oldStatus !== 'completed') {
            const { products, updateProduct } = useProductStore.getState();
            order.items.forEach((item) => {
              const dbProduct = products.find((p) => p.id === item.id);
              if (dbProduct && dbProduct.stock !== undefined) {
                const newStock = Math.max(0, dbProduct.stock - item.quantity);
                updateProduct(item.id, { stock: newStock });
              }
            });
          }
          // Restore stock if transitioning FROM 'completed' to another status
          else if (oldStatus === 'completed' && newStatus !== 'completed') {
            const { products, updateProduct } = useProductStore.getState();
            order.items.forEach((item) => {
              const dbProduct = products.find((p) => p.id === item.id);
              if (dbProduct && dbProduct.stock !== undefined) {
                const newStock = dbProduct.stock + item.quantity;
                updateProduct(item.id, { stock: newStock });
              }
            });
          }

          return {
            orders: state.orders.map((o) =>
              o.id === id ? { ...o, status } : o
            )
          };
        }),

      deleteOrder: (id) =>
        set((state) => {
          const order = state.orders.find((o) => o.id === id);
          if (order && order.status === 'completed') {
            const { products, updateProduct } = useProductStore.getState();
            order.items.forEach((item) => {
              const dbProduct = products.find((p) => p.id === item.id);
              if (dbProduct && dbProduct.stock !== undefined) {
                const newStock = dbProduct.stock + item.quantity;
                updateProduct(item.id, { stock: newStock });
              }
            });
          }
          return {
            orders: state.orders.filter((o) => o.id !== id)
          };
        }),

      clearOrders: () =>
        set((state) => {
          const { products, updateProduct } = useProductStore.getState();
          state.orders.forEach((order) => {
            if (order.status === 'completed') {
              order.items.forEach((item) => {
                const dbProduct = products.find((p) => p.id === item.id);
                if (dbProduct && dbProduct.stock !== undefined) {
                  const newStock = dbProduct.stock + item.quantity;
                  updateProduct(item.id, { stock: newStock });
                }
              });
            }
          });
          return { orders: [] };
        })
    }),
    {
      name: 'orders-storage'
    }
  )
);
