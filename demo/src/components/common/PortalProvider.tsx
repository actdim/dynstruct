import React, { type ReactNode } from 'react';
import { ComponentContextProvider } from '@actdim/dynstruct/componentModel/react/componentContext';
import { type BaseContext } from '@actdim/dynstruct/componentModel/contracts';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { getPortalMsgBus } from '../../bus/portalBus';

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

export function PortalProvider({ children }: { children: ReactNode }) {
  const msgBus = getPortalMsgBus();

  // ComponentContextProvider defines props.value?: BaseContext with default BaseAppMsgStruct
  // without exposing TMsgStruct, creating a type invariance mismatch with MsgBus<DemoMsgStruct>.
  const contextValue: BaseContext = {
    msgBus: msgBus as unknown as BaseContext['msgBus'],
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <ComponentContextProvider value={contextValue}>
        {children}
      </ComponentContextProvider>
    </ThemeProvider>
  );
}
