import React, { type ReactNode, useSyncExternalStore } from 'react';
import { ComponentContextProvider } from '@actdim/dynstruct/componentModel/react/componentContext';
import { type BaseContext } from '@actdim/dynstruct/componentModel/contracts';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { getPortalMsgBus } from '../../bus/portalBus';

function resolveCurrentThemeMode(): 'light' | 'dark' {
  if (typeof document !== 'undefined') {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }
  return 'dark';
}

let currentMode: 'light' | 'dark' = resolveCurrentThemeMode();
const listeners = new Set<() => void>();

export const portalThemeStore = {
  get mode() {
    return currentMode;
  },
  setMode(mode: 'light' | 'dark') {
    if (currentMode !== mode) {
      currentMode = mode;
      listeners.forEach((listener) => listener());
    }
  },
  subscribe(callback: () => void) {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  },
  getSnapshot() {
    return currentMode;
  },
  getServerSnapshot() {
    return 'dark' as const;
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener('actdim:theme-changed', ((e: CustomEvent<{ mode: 'light' | 'dark' }>) => {
    if (e.detail?.mode) {
      portalThemeStore.setMode(e.detail.mode);
    }
  }) as EventListener);
}

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0284c7',
    },
    secondary: {
      main: '#9333ea',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
    },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 12,
        },
      },
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#38bdf8',
    },
    secondary: {
      main: '#c084fc',
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
    },
    divider: '#334155',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 12,
        },
      },
    },
  },
});

export interface PortalProviderProps {
  children: ReactNode;
}

export const PortalProvider = ({ children }: PortalProviderProps) => {
  const mode = useSyncExternalStore(
    portalThemeStore.subscribe,
    portalThemeStore.getSnapshot,
    portalThemeStore.getServerSnapshot
  );

  const msgBus = getPortalMsgBus();

  const contextValue: BaseContext = {
    msgBus: msgBus as unknown as BaseContext['msgBus'],
  };

  const currentTheme = mode === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeProvider theme={currentTheme}>
      <ComponentContextProvider value={contextValue}>
        {children}
      </ComponentContextProvider>
    </ThemeProvider>
  );
};
