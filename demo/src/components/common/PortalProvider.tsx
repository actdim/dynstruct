import React, { type ReactNode } from 'react';
import { ComponentContextProvider } from '@actdim/dynstruct/componentModel/react/componentContext';
import { type BaseContext } from '@actdim/dynstruct/componentModel/contracts';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { observable, runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { getPortalMsgBus } from '../../bus/portalBus';

function resolveCurrentThemeMode(): 'light' | 'dark' {
  if (typeof document !== 'undefined') {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }
  return 'dark';
}

export const portalThemeStore = observable({
  mode: resolveCurrentThemeMode(),
  setMode(mode: 'light' | 'dark') {
    this.mode = mode;
  },
});

if (typeof window !== 'undefined') {
  window.addEventListener('actdim:theme-changed', ((e: CustomEvent<{ mode: 'light' | 'dark' }>) => {
    if (e.detail?.mode) {
      runInAction(() => {
        portalThemeStore.setMode(e.detail.mode);
      });
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

export const PortalProvider = observer(function PortalProvider({ children }: { children: ReactNode }) {
  const msgBus = getPortalMsgBus();

  // ComponentContextProvider defines props.value?: BaseContext with default BaseAppMsgStruct
  // without exposing TMsgStruct, creating a type invariance mismatch with MsgBus<DemoMsgStruct>.
  const contextValue: BaseContext = {
    msgBus: msgBus as unknown as BaseContext['msgBus'],
  };

  const currentTheme = portalThemeStore.mode === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeProvider theme={currentTheme}>
      <ComponentContextProvider value={contextValue}>
        {children}
      </ComponentContextProvider>
    </ThemeProvider>
  );
});
