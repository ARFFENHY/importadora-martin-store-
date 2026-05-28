import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Validar que las variables de entorno de Firebase estén presentes
if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  console.warn(
    "⚠️ ALERTA DE SISTEMA (ArfenixTech):\n" +
    "Faltan las variables de entorno de Firebase. Si has desplegado la aplicación en Vercel o en un dominio personalizado, " +
    "debes agregar las claves de '.env.local' en el panel de Vercel (Project Settings > Environment Variables) y volver a desplegar."
  );
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
