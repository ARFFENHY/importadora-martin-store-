import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updatePassword as firebaseUpdatePassword,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthState {
  isAuthenticated: boolean;
  loginError: string | null;
  adminUsername: string;   // guardado solo para mostrar en UI
  adminPassword: string;   // NO se usa para auth real — es Firebase Auth
  login: (usernameInput: string, passwordInput: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateCredentials: (newUsername: string, currentPasswordInput: string, newPasswordInput?: string) => Promise<void>;
  initAuthListener: () => () => void;
}

// Email de admin en Firebase Auth (formato requerido por Firebase)
const ADMIN_EMAIL = 'importadoramartinstore@hotmail.com';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      loginError: null,
      adminUsername: 'admin',
      adminPassword: '',

      // Escucha cambios de sesión de Firebase (para persistir entre recargas)
      initAuthListener: () => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          set({ isAuthenticated: !!user });
        });
        return unsubscribe;
      },

      login: async (usernameInput: string, passwordInput: string) => {
        try {
          // Firebase Auth usa email+password. El username es solo un alias visual.
          await signInWithEmailAndPassword(auth, ADMIN_EMAIL, passwordInput);
          set({ isAuthenticated: true, loginError: null });
          return true;
        } catch {
          set({ loginError: 'Usuario o contraseña incorrectos. Intente nuevamente.' });
          return false;
        }
      },

      logout: async () => {
        await firebaseSignOut(auth);
        set({ isAuthenticated: false, loginError: null });
      },

      clearError: () => set({ loginError: null }),

      updateCredentials: async (newUsername: string, currentPasswordInput: string, newPasswordInput?: string) => {
        // 1. Si se desea cambiar la contraseña, validar primero con la contraseña actual
        if (newPasswordInput && currentPasswordInput) {
          try {
            // Validar la contraseña actual intentando autenticar silenciosamente
            await signInWithEmailAndPassword(auth, ADMIN_EMAIL, currentPasswordInput);
          } catch {
            throw new Error('La contraseña actual es incorrecta.');
          }

          // Si el login fue exitoso, cambiar la contraseña
          if (auth.currentUser) {
            try {
              await firebaseUpdatePassword(auth.currentUser, newPasswordInput);
            } catch (error: any) {
              console.error('Error changing password in Firebase:', error);
              if (error.code === 'auth/requires-recent-login') {
                throw new Error('Por seguridad, por favor cierra sesión e ingresa nuevamente para cambiar tu contraseña.');
              }
              throw new Error('Error al actualizar la contraseña: ' + (error.message || ''));
            }
          } else {
            throw new Error('No hay una sesión activa de administrador.');
          }
        }

        // 2. Actualizar el nombre visual en el store
        set({ adminUsername: newUsername.trim() });
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        adminUsername: state.adminUsername,
      }),
    }
  )
);
