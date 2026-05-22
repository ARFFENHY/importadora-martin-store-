import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
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
  updateCredentials: (newUsername: string, newPassword: string) => void;
  initAuthListener: () => () => void;
}

// Email de admin en Firebase Auth (formato requerido por Firebase)
const ADMIN_EMAIL = 'importadoramartinstore@hotmail.com';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
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

      updateCredentials: (newUsername: string, newPassword: string) => {
        // Solo actualiza el nombre visual en UI (la contraseña real la maneja Firebase Auth)
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
