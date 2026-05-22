"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Send, MapPin, CreditCard, User, Truck, Building2 } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useConfigStore } from "@/store/useConfigStore";
import { formatPrice } from "@/lib/utils";
import { motion } from "framer-motion";
import { useOrderStore } from "@/store/useOrderStore";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const { store } = useConfigStore();
  const { addOrder } = useOrderStore();
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    deliveryMethod: "delivery", // 'delivery' | 'pickup'
    paymentMethod: "efectivo", // 'efectivo' | 'transferencia'
    notes: ""
  });

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">Tu carrito está vacío</h1>
        <button
          onClick={() => router.push("/catalogo")}
          className="mt-6 rounded-2xl bg-black px-8 py-4 font-bold text-white shadow-lg shadow-black/10 active:scale-95 transition-transform"
        >
          Volver a la tienda
        </button>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const total = getTotal();
    const businessName = store.name;
    const phoneNumber = store.whatsAppNumber; 

    // Save order dynamically to local storage store
    const orderId = addOrder({
      customerName: formData.name,
      customerPhone: formData.phone,
      deliveryMethod: formData.deliveryMethod as 'delivery' | 'pickup',
      address: formData.deliveryMethod === 'delivery' ? formData.address : undefined,
      city: formData.deliveryMethod === 'delivery' ? formData.city : undefined,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes || undefined,
      items: items,
      total: total
    });

    let message = `*🛒 NUEVO PEDIDO #${orderId} - ${businessName}*\n\n`;
    message += `*👤 CLIENTE*\n`;
    message += `• Nombre: ${formData.name}\n`;
    message += `• Teléfono: ${formData.phone}\n\n`;
    
    message += `*📍 ENTREGA*\n`;
    message += `• Método: ${formData.deliveryMethod === 'delivery' ? 'Envío a domicilio' : 'Retiro en local'}\n`;
    if (formData.deliveryMethod === 'delivery') {
      message += `• Dirección: ${formData.address}, ${formData.city}\n\n`;
    } else {
      message += `• Lugar: Retiro por sucursal Alvear 2580\n\n`;
    }

    message += `*💳 PAGO*\n`;
    message += `• Método: ${formData.paymentMethod.toUpperCase()}\n\n`;

    message += `*📦 PRODUCTOS*\n`;
    items.forEach((item) => {
      message += `• ${item.quantity}x ${item.name} - ${formatPrice(item.price * item.quantity)}\n`;
    });
    
    message += `\n*💰 TOTAL: ${formatPrice(total)}*`;
    
    if (formData.notes) {
      message += `\n\n*📝 NOTAS*\n${formData.notes}`;
    }

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, "_blank");
    
    clearCart();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black text-foreground uppercase tracking-tight">Finalizar Compra</h1>
      </header>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Datos del Cliente */}
          <section className="bg-white rounded-3xl p-6 border border-border shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2 text-foreground font-black uppercase tracking-tight">
              <User size={20} className="text-primary" />
              <h3>Datos de Contacto</h3>
            </div>
            <div className="space-y-3">
              <input
                required
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nombre Completo"
                className="w-full bg-zinc-50 border border-border rounded-xl px-4 py-3 text-sm focus:border-black outline-none transition-all"
              />
              <input
                required
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Teléfono / WhatsApp"
                className="w-full bg-zinc-50 border border-border rounded-xl px-4 py-3 text-sm focus:border-black outline-none transition-all"
              />
            </div>
          </section>

          {/* Entrega */}
          <section className="bg-white rounded-3xl p-6 border border-border shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2 text-foreground font-black uppercase tracking-tight">
              <Truck size={20} className="text-primary" />
              <h3>Entrega</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, deliveryMethod: "delivery" }))}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                  formData.deliveryMethod === "delivery" 
                    ? "border-black bg-black text-white" 
                    : "border-border bg-zinc-50 text-muted"
                }`}
              >
                <Truck size={24} />
                <span className="text-xs font-bold uppercase">Envío</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, deliveryMethod: "pickup" }))}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                  formData.deliveryMethod === "pickup" 
                    ? "border-black bg-black text-white" 
                    : "border-border bg-zinc-50 text-muted"
                }`}
              >
                <Building2 size={24} />
                <span className="text-xs font-bold uppercase">Retiro</span>
              </button>
            </div>

            {formData.deliveryMethod === "delivery" && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3 pt-2"
              >
                <input
                  required
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Dirección y Número"
                  className="w-full bg-zinc-50 border border-border rounded-xl px-4 py-3 text-sm focus:border-black outline-none transition-all"
                />
                <input
                  required
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Localidad / Ciudad"
                  className="w-full bg-zinc-50 border border-border rounded-xl px-4 py-3 text-sm focus:border-black outline-none transition-all"
                />
              </motion.div>
            )}
          </section>

          {/* Pago */}
          <section className="bg-white rounded-3xl p-6 border border-border shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2 text-foreground font-black uppercase tracking-tight">
              <CreditCard size={20} className="text-primary" />
              <h3>Método de Pago</h3>
            </div>
            
            <div className="space-y-3">
              {["efectivo", "transferencia", "tarjeta"].map((method) => (
                <label 
                  key={method}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                    formData.paymentMethod === method 
                      ? "border-black bg-zinc-50" 
                      : "border-border bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={formData.paymentMethod === method}
                      onChange={handleInputChange}
                      className="w-4 h-4 accent-black"
                    />
                    <span className="text-sm font-bold uppercase tracking-tight">{method}</span>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Resumen Final */}
          <section className="bg-black rounded-3xl p-8 text-white space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tight">Resumen</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-zinc-400 text-sm">
                <span>Productos ({items.length})</span>
                <span>{formatPrice(getTotal())}</span>
              </div>
              <div className="flex justify-between text-zinc-400 text-sm">
                <span>Entrega</span>
                <span>{formData.deliveryMethod === "delivery" ? "A convenir" : "Gratis"}</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-white/10 text-xl font-black">
                <span>Total</span>
                <span className="text-primary">{formatPrice(getTotal())}</span>
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-primary transition-all active:scale-95 shadow-xl shadow-white/5"
            >
              <Send size={20} />
              Confirmar por WhatsApp
            </button>
          </section>

        </form>
      </div>
    </div>
  );
}
