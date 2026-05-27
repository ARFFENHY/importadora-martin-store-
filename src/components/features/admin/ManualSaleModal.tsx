'use client';

import { useState } from 'react';
import { useProductStore } from '@/store/useProductStore';
import { Product } from '@/types';
import { useOrderStore } from '@/store/useOrderStore';
import { X, Plus, Minus, Search, ShoppingBag, Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';

interface ManualSaleModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function ManualSaleModal({ onClose, onSuccess }: ManualSaleModalProps) {
  const { products } = useProductStore();
  const { addOrder, updateOrderStatus } = useOrderStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [customerName, setCustomerName] = useState('Venta en Mostrador');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handleRegisterSale = () => {
    if (cart.length === 0) return;

    // Register order as completed directly
    const orderId = addOrder({
      customerName,
      customerPhone: '-',
      deliveryMethod: 'pickup',
      paymentMethod,
      items: cart.map(item => ({
        ...item.product,
        quantity: item.quantity
      })),
      total
    });

    // Update status to completed immediately to deduct stock
    updateOrderStatus(orderId, 'completed');
    
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Cargar Venta Manual</h2>
            <p className="text-xs text-zinc-500 mt-1">Registrá ventas por fuera de la web para descontar stock.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content grid */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left: Product Selection */}
          <div className="flex-1 border-r border-zinc-100 flex flex-col bg-zinc-50">
            <div className="p-4 border-b border-zinc-200 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar producto por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-black transition-all"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredProducts.map(product => (
                <div 
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-xl hover:border-black transition-colors cursor-pointer"
                  onClick={() => addToCart(product)}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-10 w-10 relative rounded-lg overflow-hidden shrink-0 bg-zinc-100">
                      <Image 
                        src={product.images[0]} 
                        alt={product.name} 
                        fill 
                        className="object-cover" 
                        unoptimized
                      />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold truncate">{product.name}</p>
                      <p className="text-xs text-zinc-500 font-mono">Stock: {product.stock}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="text-sm font-black text-blue-600">{formatPrice(product.price)}</span>
                    <button className="h-8 w-8 bg-zinc-100 hover:bg-black hover:text-white rounded-lg flex items-center justify-center transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Cart & Checkout */}
          <div className="w-full md:w-96 bg-white flex flex-col">
            <div className="p-6 border-b border-zinc-100">
              <h3 className="font-black uppercase tracking-widest text-xs text-zinc-400 mb-4">Detalle de Venta</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Cliente / Referencia</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Método de Pago</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta (Débito/Crédito)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-3">
                  <ShoppingBag size={32} opacity={0.5} />
                  <p className="text-xs text-center">No hay productos en la venta actual.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="flex gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-bold line-clamp-2">{item.product.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{formatPrice(item.product.price)} c/u</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-black">{formatPrice(item.product.price * item.quantity)}</p>
                        <button 
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 bg-zinc-100 rounded-lg p-1">
                        <button 
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="h-6 w-6 bg-white rounded shadow-sm flex items-center justify-center hover:bg-zinc-50 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="h-6 w-6 bg-white rounded shadow-sm flex items-center justify-center hover:bg-zinc-50 transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-zinc-50 border-t border-zinc-200">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-zinc-500">Total Venta</span>
                <span className="text-2xl font-black text-blue-600">{formatPrice(total)}</span>
              </div>
              <button
                onClick={handleRegisterSale}
                disabled={cart.length === 0}
                className="w-full bg-black text-white hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
              >
                Registrar Venta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
