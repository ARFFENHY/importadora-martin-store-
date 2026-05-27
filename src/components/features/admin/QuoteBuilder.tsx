"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Printer, Download, Sparkles, Search, FileText, Landmark } from "lucide-react";
import { useProductStore } from "@/store/useProductStore";
import { useConfigStore } from "@/store/useConfigStore";
import { formatPrice } from "@/lib/utils";
import html2canvas from "html2canvas";
import { Product } from "@/types";

interface QuoteItem {
  id: string;
  product: Product;
  quantity: number;
  price: number; // Editable price override
  discountPercent: number; // Item discount %
}

export function QuoteBuilder() {
  const { products } = useProductStore();
  const { store } = useConfigStore();
  
  // Document Title / Type State
  const [documentTitle, setDocumentTitle] = useState("PRESUPUESTO");
  
  // Client Info State
  const [clientName, setClientName] = useState("");
  const [clientTaxId, setClientTaxId] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  
  // Document Info State
  const [quoteNumber, setQuoteNumber] = useState(() => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `PRE-${randomNum}`;
  });
  const [quoteDate, setQuoteDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [quoteValidity, setQuoteValidity] = useState("15");
  const [paymentTerms, setPaymentTerms] = useState(
    "Forma de Pago: Transferencia Bancaria o Contado.\nPlazo de Entrega: Inmediato.\nValidez del Presupuesto: 15 días."
  );
  
  // Dynamic Items list
  const [items, setItems] = useState<QuoteItem[]>([]);
  
  // Select product form state
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQty, setSelectedQty] = useState(1);
  const [priceOverride, setPriceOverride] = useState<number | string>("");
  const [itemDiscount, setItemDiscount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Discount and tax states
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [taxType, setTaxType] = useState<"none" | "iva-21" | "iva-105">("none");

  // General Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Refs
  const printAreaRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);


  // Handle outside click to close product dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Filter products based on search term
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // When a product is selected
  const handleSelectProduct = (prod: Product) => {
    setSelectedProductId(prod.id);
    setPriceOverride(prod.price);
    setSearchTerm(prod.name);
    setShowDropdown(false);
  };

  // Add item to quote list
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const finalPrice = parseFloat(priceOverride.toString()) || prod.price;
    
    // Check if item already exists in quote list
    const existingIndex = items.findIndex((item) => item.product.id === prod.id);
    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += selectedQty;
      // Keep the new price override
      updated[existingIndex].price = finalPrice;
      updated[existingIndex].discountPercent = itemDiscount;
      setItems(updated);
    } else {
      const newItem: QuoteItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        product: prod,
        quantity: selectedQty,
        price: finalPrice,
        discountPercent: itemDiscount,
      };
      setItems([...items, newItem]);
    }

    // Reset picker
    setSelectedProductId("");
    setSelectedQty(1);
    setPriceOverride("");
    setItemDiscount(0);
    setSearchTerm("");
  };

  // Delete item from list
  const handleDeleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Calculate Subtotal
  const getSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.price * (1 - item.discountPercent / 100)) * item.quantity, 0);
  };

  // Calculate Discount Amount
  const getDiscountAmount = () => {
    const subtotal = getSubtotal();
    return (subtotal * discountPercent) / 100;
  };

  // Calculate Tax / IVA Amount
  const getTaxAmount = () => {
    const base = getSubtotal() - getDiscountAmount();
    if (taxType === "iva-21") return base * 0.21;
    if (taxType === "iva-105") return base * 0.105;
    return 0;
  };

  // Calculate Grand Total
  const getGrandTotal = () => {
    return getSubtotal() - getDiscountAmount() + getTaxAmount();
  };

  // Trigger browser A4 print dialog
  const handlePrintPDF = () => {
    if (items.length === 0) {
      alert("Por favor agrega al menos un producto a la cotización.");
      return;
    }
    window.print();
  };

  // Download Quote as PNG
  const handleDownloadPNG = async () => {
    if (items.length === 0) {
      alert("Por favor agrega al menos un producto a la cotización.");
      return;
    }

    try {
      if (!printAreaRef.current) return;
      setToastMessage("Generando imagen de cotización...");
      
      const canvas = await html2canvas(printAreaRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      
      const blobUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `cotizacion_${quoteNumber.toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setToastMessage("Imagen descargada exitosamente!");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Error generating PNG quote:", err);
      setToastMessage("Error al generar la imagen.");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[75vh] select-none">
      {/* 1. LEFT SIDEBAR PANEL (Form controls) */}
      <div className="flex-1 space-y-6 lg:max-w-[450px]">
        {/* Form header */}
        <div className="bg-white border border-zinc-200 rounded-[2rem] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
              <FileText size={18} />
            </div>
            <h3 className="text-sm font-black uppercase text-zinc-900 tracking-wider">Crear Cotización</h3>
          </div>

          <div className="space-y-4">
            {/* Document Title Customizer */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Título del Documento</label>
              <input
                type="text"
                placeholder="Ej. PRESUPUESTO, COTIZACIÓN, COTIZACIÓN PARA..."
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                className="w-full text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
              />
            </div>

            {/* Quote details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">N° Presupuesto</label>
                <input
                  type="text"
                  value={quoteNumber}
                  onChange={(e) => setQuoteNumber(e.target.value)}
                  className="w-full text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Fecha</label>
                <input
                  type="date"
                  value={quoteDate}
                  onChange={(e) => setQuoteDate(e.target.value)}
                  className="w-full text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Razón Social / Cliente</label>
              <input
                type="text"
                placeholder="Nombre del cliente o empresa"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">CUIT / DNI</label>
                <input
                  type="text"
                  placeholder="30-XXXXXXXX-X"
                  value={clientTaxId}
                  onChange={(e) => setClientTaxId(e.target.value)}
                  className="w-full text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Validez (Días)</label>
                <input
                  type="number"
                  value={quoteValidity}
                  onChange={(e) => setQuoteValidity(e.target.value)}
                  className="w-full text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Teléfono</label>
                <input
                  type="text"
                  placeholder="11-XXXX-XXXX"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Email</label>
                <input
                  type="email"
                  placeholder="cliente@correo.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Add Product Section */}
        <div className="bg-white border border-zinc-200 rounded-[2rem] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
              <Plus size={18} />
            </div>
            <h3 className="text-sm font-black uppercase text-zinc-900 tracking-wider">Añadir Productos</h3>
          </div>

          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="space-y-1 relative" ref={dropdownRef}>
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Buscar Producto en Catálogo</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                <input
                  type="text"
                  placeholder="Escribe para buscar..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
                />
              </div>
              
              {/* Dropdown Suggestions */}
              {showDropdown && filteredProducts.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-zinc-200 rounded-2xl shadow-xl p-1.5 flex flex-col gap-0.5 custom-scrollbar">
                  {filteredProducts.map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleSelectProduct(prod)}
                      className="w-full text-left px-3 py-2.5 hover:bg-zinc-50 rounded-xl text-xs font-bold text-zinc-800 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate mr-2">{prod.name}</span>
                      <span className="text-amber-500 shrink-0">{formatPrice(prod.price)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Precio ($)</label>
                <input
                  type="number"
                  value={priceOverride}
                  onChange={(e) => setPriceOverride(e.target.value)}
                  placeholder="Precio"
                  disabled={!selectedProductId}
                  className="w-full text-[11px] font-bold bg-zinc-50 border border-zinc-200 rounded-xl px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Desc. (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={itemDiscount}
                  onChange={(e) => setItemDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  disabled={!selectedProductId}
                  className="w-full text-[11px] font-bold bg-zinc-50 border border-zinc-200 rounded-xl px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Cant.</label>
                <input
                  type="number"
                  min="1"
                  value={selectedQty}
                  onChange={(e) => setSelectedQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-[11px] font-bold bg-zinc-50 border border-zinc-200 rounded-xl px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedProductId}
              className="w-full bg-black text-white hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98] shadow-sm disabled:cursor-not-allowed cursor-pointer text-center"
            >
              Agregar Item
            </button>
          </form>
        </div>

        {/* Global modifiers (Discounts & Taxes) */}
        <div className="bg-white border border-zinc-200 rounded-[2rem] p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
              <Landmark size={18} />
            </div>
            <h3 className="text-sm font-black uppercase text-zinc-900 tracking-wider">Ajustes y Pago</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Descuento Global (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-full text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Cargar IVA</label>
              <select
                value={taxType}
                onChange={(e) => setTaxType(e.target.value as "none" | "iva-21" | "iva-105")}
                className="w-full text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white cursor-pointer"
              >
                <option value="none">Sin IVA</option>
                <option value="iva-21">IVA Responsable Inscripto (21%)</option>
                <option value="iva-105">IVA Reducido (10.5%)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Términos de Pago y Leyenda</label>
            <textarea
              rows={3}
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white custom-scrollbar resize-none"
            />
          </div>
        </div>
      </div>

      {/* 2. CENTER STAGE (Document Preview A4) */}
      <div className="flex-1 flex flex-col items-center">
        {/* Workspace controls bar */}
        <div className="w-full max-w-[800px] flex items-center justify-between mb-4 bg-white border border-zinc-200 p-3 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 ml-2">Vista Previa A4 Presupuesto</span>
          
          <div className="flex items-center gap-2">
            {/* Print / Save PDF Vector Button */}
            <button
              onClick={handlePrintPDF}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-xs font-black uppercase text-white shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Printer size={14} />
              Imprimir / PDF
            </button>

            {/* Download Image Button */}
            <button
              onClick={handleDownloadPNG}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-black uppercase bg-white active:scale-95 transition-all cursor-pointer"
            >
              <Download size={14} />
              Guardar Imagen (PNG)
            </button>
          </div>
        </div>

        {/* CSS Printing Self-Contained Injectable Styles */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            /* Hide all regular web DOM elements */
            body * {
              visibility: hidden !important;
            }
            /* Show ONLY the printable document block */
            #quote-print-area, #quote-print-area * {
              visibility: visible !important;
            }
            #quote-print-area {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 210mm !important;
              height: 297mm !important;
              margin: 0 !important;
              padding: 15mm !important;
              background: white !important;
              color: black !important;
              box-shadow: none !important;
              border: none !important;
              z-index: 99999 !important;
            }
            /* Fix page dimensions setup */
            @page {
              size: A4;
              margin: 0;
            }
          }
        `}} />

        {/* Printable Area Page */}
        <div className="w-full max-w-[800px] bg-white border border-zinc-300 rounded-[2rem] shadow-premium overflow-hidden select-text relative">
          
          {/* Internal A4 Printable document canvas wrapper */}
          <div 
            ref={printAreaRef}
            id="quote-print-area"
            className="w-full bg-white p-8 sm:p-12 text-zinc-950 flex flex-col justify-between min-h-[1050px]"
            style={{ fontFamily: "'Inter', 'Montserrat', sans-serif" }}
          >
            {/* Document Header (MEMBRETE) */}
            <div className="space-y-6">
              <div className="flex flex-row justify-between items-start border-b border-zinc-200 pb-6 gap-4">
                {/* Store logo & brand metadata */}
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full overflow-hidden border border-zinc-200 bg-white flex items-center justify-center shrink-0 shadow-2xs">
                    <img src={store.logoUrl || "/logo.png"} alt="Store logo" className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-zinc-900 uppercase">
                      {store.name || "IMPORTADORA MARTIN STORE"}
                    </h1>
                    <p className="text-[10px] text-zinc-400 font-semibold mt-1">
                      {store.pickupAddress || "Dirección: Ramos Mejía, Buenos Aires."}
                    </p>
                  </div>
                </div>

                {/* Document Type Label & Number */}
                <div className="text-right flex flex-col items-end">
                  <span className="text-sm font-black text-white bg-zinc-900 px-3 py-1 rounded-md uppercase tracking-wider shadow-sm mb-2 max-w-[250px] break-words text-right">
                    {documentTitle || "PRESUPUESTO"}
                  </span>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Número de Documento</p>
                  <p className="text-base font-black text-zinc-900 mt-0.5">{quoteNumber || "PRE-000000"}</p>
                </div>
              </div>

              {/* Grid Metadata details (Date, Validity & Client info) */}
              <div className="grid grid-cols-2 gap-8 bg-zinc-50/50 p-5 rounded-2xl border border-zinc-200/60">
                {/* Column left: Quote dates */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-200/80 pb-1">Información General</h4>
                  <div className="grid grid-cols-3 gap-y-1 text-xs">
                    <span className="text-zinc-500 font-semibold">Emisión:</span>
                    <span className="col-span-2 text-zinc-900 font-bold">{quoteDate ? quoteDate.split("-").reverse().join("/") : "DD/MM/AAAA"}</span>
                    
                    <span className="text-zinc-500 font-semibold">Validez:</span>
                    <span className="col-span-2 text-zinc-900 font-bold">{quoteValidity || "15"} días</span>
                    
                    <span className="text-zinc-500 font-semibold">Contacto:</span>
                    <span className="col-span-2 text-zinc-900 font-bold">{store.whatsAppNumber || "+54 11 XXXX-XXXX"}</span>
                  </div>
                </div>

                {/* Column right: Client info */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-200/80 pb-1">Datos del Cliente</h4>
                  <div className="grid grid-cols-3 gap-y-1 text-xs">
                    <span className="text-zinc-500 font-semibold">Cliente:</span>
                    <span className="col-span-2 text-zinc-900 font-bold truncate">{clientName || "[Nombre del Cliente]"}</span>
                    
                    {clientTaxId && (
                      <>
                        <span className="text-zinc-500 font-semibold">CUIT/DNI:</span>
                        <span className="col-span-2 text-zinc-900 font-bold">{clientTaxId}</span>
                      </>
                    )}
                    
                    {(clientPhone || clientEmail) && (
                      <>
                        <span className="text-zinc-500 font-semibold">Contacto:</span>
                        <span className="col-span-2 text-zinc-900 font-bold truncate">
                          {clientPhone || clientEmail}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table details */}
              <div className="pt-2">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-300 text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                      <th className="py-2.5 pb-2">Descripción / Detalle</th>
                      <th className="py-2.5 pb-2 text-center w-12">Cant.</th>
                      <th className="py-2.5 pb-2 text-right w-24">P. Unitario</th>
                      <th className="py-2.5 pb-2 text-center w-16">Desc.</th>
                      <th className="py-2.5 pb-2 text-right w-24">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center font-medium text-zinc-400 italic">
                          No hay ítems cargados en el presupuesto. Agrega herramientas usando el panel de la izquierda.
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item.id} className="border-b border-zinc-100 text-zinc-800 font-semibold hover:bg-zinc-50/20">
                          <td className="py-3 pr-4">
                            <p className="font-bold text-zinc-900">{item.product.name}</p>
                            <span className="text-[10px] text-zinc-400 font-medium uppercase">{item.product.category}</span>
                          </td>
                          <td className="py-3 text-center font-bold text-zinc-900">{item.quantity}</td>
                          <td className="py-3 text-right text-zinc-700">{formatPrice(item.price)}</td>
                          <td className="py-3 text-center font-bold text-green-600">
                            {item.discountPercent > 0 ? `${item.discountPercent}%` : "-"}
                          </td>
                          <td className="py-3 text-right font-bold text-zinc-900">
                            {formatPrice((item.price * (1 - item.discountPercent / 100)) * item.quantity)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations totals block & foot legend details */}
            <div className="pt-8 space-y-8 border-t border-zinc-200 mt-auto">
              <div className="flex flex-row justify-between items-start gap-8">
                {/* Terms and legend details */}
                <div className="flex-1 max-w-[60%]">
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Términos y Condiciones comerciales</h4>
                  <p className="text-[10px] text-zinc-600 font-semibold leading-relaxed whitespace-pre-wrap">
                    {paymentTerms}
                  </p>
                </div>

                {/* Final totals list calculation box */}
                <div className="w-56 shrink-0 bg-zinc-50 border border-zinc-200/80 p-4 rounded-2xl flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between font-semibold text-zinc-500">
                    <span>Subtotal:</span>
                    <span className="font-bold text-zinc-800">{formatPrice(getSubtotal())}</span>
                  </div>
                  
                  {discountPercent > 0 && (
                    <div className="flex justify-between font-semibold text-green-600">
                      <span>Descuento ({discountPercent}%):</span>
                      <span className="font-bold">-{formatPrice(getDiscountAmount())}</span>
                    </div>
                  )}

                  {taxType !== "none" && (
                    <div className="flex justify-between font-semibold text-zinc-500">
                      <span>{taxType === "iva-21" ? "IVA (21%):" : "IVA (10.5%):"}</span>
                      <span className="font-bold text-zinc-800">{formatPrice(getTaxAmount())}</span>
                    </div>
                  )}

                  <div className="h-[1px] bg-zinc-200 my-1" />

                  <div className="flex justify-between text-zinc-900 font-black text-sm uppercase tracking-tight">
                    <span>Importe Neto:</span>
                    <span className="text-zinc-950 font-black">{formatPrice(getGrandTotal())}</span>
                  </div>
                </div>
              </div>

              {/* Signature block Pie de página */}
              <div className="flex flex-row justify-between items-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest pt-4 border-t border-zinc-100">
                <span>{store.name || "Importadora Martin Store"}</span>
              </div>
            </div>
            
          </div>

          {/* Action trigger overlays inside A4 card in Web view only */}
          {items.length > 0 && (
            <div className="bg-zinc-50 border-t border-zinc-200 p-4 flex justify-between items-center gap-3 print:hidden">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                Presupuesto estructurado con {items.length} {items.length === 1 ? "ítem" : "ítems"}
              </span>
              <div className="flex gap-2">
                {items.map((item) => (
                  <div key={item.id} className="h-8 pl-3.5 pr-2 bg-white rounded-xl border border-zinc-200 text-[10px] font-bold text-zinc-600 flex items-center gap-1.5 shadow-2xs">
                    <span className="truncate max-w-[80px]">{item.product.name}</span>
                    {item.discountPercent > 0 && (
                      <span className="bg-green-50 text-green-700 px-1 py-0.5 rounded text-[8px] font-black">-{item.discountPercent}%</span>
                    )}
                    <span className="bg-zinc-100 text-zinc-900 px-1.5 py-0.5 rounded font-black">x{item.quantity}</span>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 hover:bg-red-50 rounded-lg text-zinc-400 hover:text-red-500 cursor-pointer transition-colors"
                      title="Eliminar ítem"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Global save toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-zinc-900 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-premium z-50 flex items-center gap-2 border border-zinc-800 animate-bounce">
          <Sparkles size={14} className="text-amber-400" />
          {toastMessage}
        </div>
      )}
    </div>
  );
}
