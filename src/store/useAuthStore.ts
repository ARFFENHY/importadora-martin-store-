import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  loginError: string | null;
  adminUsername: string;
  adminPassword: string;
  login: (usernameInput: string, passwordInput: string) => boolean;
  logout: () => void;
  clearError: () => void;
  updateCredentials: (newUsername: string, newPassword: string) => void;
}

const DEFAULT_USER = 'admin';
const DEFAULT_PASS = 'martin2026';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      loginError: null,
      adminUsername: DEFAULT_USER,
      adminPassword: DEFAULT_PASS,

      login: (usernameInput, passwordInput) => {
        const { adminUsername, adminPassword } = get();
        if (
          usernameInput.trim().toLowerCase() === adminUsername.toLowerCase() &&
          passwordInput === adminPassword
        ) {
          set({ isAuthenticated: true, loginError: null });
          return true;
        } else {
          set({ loginError: 'Usuario o contraseña incorrectos. Intente nuevamente.' });
          return false;
        }
      },

      logout: () => set({ isAuthenticated: false, loginError: null }),
      clearError: () => set({ loginError: null }),

      updateCredentials: (newUsername: string, newPassword: string) => {
        set({ adminUsername: newUsername.trim(), adminPassword: newPassword });
      },
    }),
    {
      name: 'admin-auth-storage',
    }
  )
);
