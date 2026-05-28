import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  loginError: string | null;
  adminUsername: string;   // Guardado para mostrar en la interfaz
  adminPassword: string;   // No se usa en texto plano
  login: (usernameInput: string, passwordInput: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateCredentials: (newUsername: string, currentPasswordInput: string, newPasswordInput?: string) => Promise<void>;
  initAuthListener: () => () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      loginError: null,
      adminUsername: 'admin',
      adminPassword: '',

      initAuthListener: () => {
        // En el flujo local/Supabase future auth, la persistencia nativa de Zustand
        // mantiene la sesión. Devolvemos un no-op limpio para no romper componentes.
        return () => {};
      },

      login: async (usernameInput: string, passwordInput: string) => {
        const requiredPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'martin2026';
        
        if (passwordInput === requiredPassword) {
          console.log('[Auth] Login exitoso para el panel de administración.');
          set({ isAuthenticated: true, loginError: null });
          return true;
        } else {
          console.warn('[Auth] Intento fallido de inicio de sesión.');
          set({ loginError: 'Usuario o contraseña incorrectos. Intente nuevamente.' });
          return false;
        }
      },

      logout: async () => {
        console.log('[Auth] Sesión de administración finalizada.');
        set({ isAuthenticated: false, loginError: null });
      },

      clearError: () => set({ loginError: null }),

      updateCredentials: async (newUsername: string, currentPasswordInput: string, newPasswordInput?: string) => {
        const requiredPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'martin2026';
        
        if (currentPasswordInput !== requiredPassword) {
          throw new Error('La contraseña actual es incorrecta.');
        }

        if (newPasswordInput) {
          throw new Error(
            'Para cambiar la contraseña de administración, actualiza la variable "NEXT_PUBLIC_ADMIN_PASSWORD" ' +
            'en las variables de entorno (.env.local o panel de Vercel) y reinicia la aplicación.'
          );
        }

        console.log(`[Auth] Nombre de administrador actualizado a: ${newUsername}`);
        set({ adminUsername: newUsername.trim() });
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        adminUsername: state.adminUsername,
      }),
    }
  )
);
