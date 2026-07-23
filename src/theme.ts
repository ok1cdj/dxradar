export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'dx_theme';

// Keep the mobile browser chrome color in sync with the theme.
const THEME_COLORS: Record<Theme, string> = {
  dark: '#000000',
  light: '#ffffff',
};

export function getTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore storage failures (private mode etc.) */
  }
  document.documentElement.classList.toggle('dark', theme === 'dark');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLORS[theme]);
}
