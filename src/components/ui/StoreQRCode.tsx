'use client';

import { QRCodeCanvas } from 'qrcode.react';

interface StoreQRCodeProps {
  size?: number;
  url?: string;
  showLogo?: boolean;
}

export function StoreQRCode({ 
  size = 200, 
  url = 'https://importadora-martin-store.vercel.app/',
  showLogo = true
}: StoreQRCodeProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-lg border border-zinc-200">
      <div className="relative flex items-center justify-center bg-white p-2 rounded-xl">
        <QRCodeCanvas
          id="store-qr-code"
          value={url}
          size={size}
          bgColor={"#ffffff"}
          fgColor={"#000000"}
          level={"H"}
          includeMargin={false}
          imageSettings={showLogo ? {
            src: "/icon.jpg",
            x: undefined,
            y: undefined,
            height: size * 0.25,
            width: size * 0.25,
            excavate: true,
          } : undefined}
        />
      </div>
      <p className="mt-4 text-xs font-bold text-center text-zinc-500 uppercase tracking-widest">
        Escaneá para entrar a la tienda
      </p>
    </div>
  );
}
