// Theme types and utilities
export type Theme = 'dark' | 'light' | 'system';

// Local storage key for theme preference
export const THEME_STORAGE_KEY = 'laxbot-theme-preference';

// Check if we're in the browser
export const isBrowser = typeof window !== 'undefined';

// Get the current theme from local storage
export function getStoredTheme(): Theme {
  if (!isBrowser) return 'system';
  
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'dark' || storedTheme === 'light' || storedTheme === 'system') {
      return storedTheme;
    }
  } catch (e) {
    console.error('Error accessing localStorage:', e);
  }
  
  return 'system';
}

// Apply theme to document
export function applyTheme(theme: Theme) {
  if (!isBrowser) return;
  
  const isDark = 
    theme === 'dark' || 
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  document.documentElement.classList.toggle('dark', isDark);
}

// Initial theme setup for SSR/hydration
export function setupInitialTheme() {
  if (!isBrowser) return;
  
  // Injected script to avoid flashing during load
  const initialThemeScript = `
    (function() {
      const theme = localStorage.getItem('${THEME_STORAGE_KEY}') || 'system';
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', isDark);
    })();
  `;
  
  // Create and append the script
  const script = document.createElement('script');
  script.textContent = initialThemeScript;
  document.head.appendChild(script);
} 