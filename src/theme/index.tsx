import { useMemo, type ReactNode } from 'react';
import { createTheme, ThemeProvider, CssBaseline, useMediaQuery } from '@mui/material';
import type { ThemeMode } from '../types';
import { useSettingsStore } from '../store/settingsStore';

const FONT_SIZE_MAP = {
  small: 12,
  medium: 13.5,
  large: 15,
} as const;

const buildTheme = (mode: 'light' | 'dark', fontSize: number) =>
  createTheme({
    palette: {
      mode,
      primary: { main: mode === 'light' ? '#ff6c37' : '#ff8a5c' },
      secondary: { main: mode === 'light' ? '#097bed' : '#5aa9ff' },
      success: { main: '#2e9e5b' },
      warning: { main: '#d9822b' },
      error: { main: '#d64545' },
      background:
        mode === 'light'
          ? { default: '#f5f6f8', paper: '#ffffff' }
          : { default: '#17181c', paper: '#1f2126' },
      divider: mode === 'light' ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)',
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
      fontSize,
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiButton: { defaultProps: { disableElevation: true } },
      MuiTooltip: { defaultProps: { arrow: true } },
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiSelect: { defaultProps: { size: 'small' } },
      MuiTab: { defaultProps: { disableRipple: true } },
    },
  });

export const useResolvedMode = (): 'light' | 'dark' => {
  const themeMode = useSettingsStore((s) => s.settings.theme) as ThemeMode;
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  if (themeMode === 'system') return prefersDark ? 'dark' : 'light';
  return themeMode;
};

export const AppThemeProvider = ({ children }: { children: ReactNode }) => {
  const mode = useResolvedMode();
  const fontSize = useSettingsStore((s) => s.settings.fontSize);
  const theme = useMemo(() => buildTheme(mode, FONT_SIZE_MAP[fontSize] ?? 13.5), [mode, fontSize]);

  // Tailwind 的 dark: 变体依赖 class，保持与 MUI 主题一致
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', mode === 'dark');
    document.documentElement.style.colorScheme = mode;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};
