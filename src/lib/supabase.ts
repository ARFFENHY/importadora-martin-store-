import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn(
    "⚠️ ALERTA DE SISTEMA (Antigravity):\n" +
    "Faltan las variables de entorno de Supabase (NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY).\n" +
    "Si has desplegado la aplicación en Vercel o localmente, agrégalas en tu archivo '.env.local' y vuelve a iniciar el servidor."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
