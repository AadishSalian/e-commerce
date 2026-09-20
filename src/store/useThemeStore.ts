import { create } from 'zustand';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setThemeState: (theme: Theme) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

let isTransitioning = false;
let transitionTimeout: NodeJS.Timeout | null = null;

const applyTheme = (newTheme: Theme, save: boolean, set: any) => {
  if (typeof document === 'undefined') return;
  if (isTransitioning) return;
  
  isTransitioning = true;
  document.documentElement.classList.add('theme-transitioning');
  
  set({ theme: newTheme });
  document.documentElement.setAttribute('data-theme', newTheme);
  
  if (save) {
    localStorage.setItem('theme', newTheme);
  }
  
  if (transitionTimeout) clearTimeout(transitionTimeout);
  transitionTimeout = setTimeout(() => {
    document.documentElement.classList.remove('theme-transitioning');
    isTransitioning = false;
  }, 300);
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark', // Initial state
  setThemeState: (theme) => set({ theme }),
  setTheme: (newTheme) => applyTheme(newTheme, true, set),
  toggleTheme: () => applyTheme(get().theme === 'dark' ? 'light' : 'dark', true, set),
}));
