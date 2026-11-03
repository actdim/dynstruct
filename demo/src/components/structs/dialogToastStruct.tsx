import React from 'react';
import {
  type ComponentStruct,
  type ComponentDef,
  type ComponentParams,
  type Component,
  type ComponentModel,
} from '@actdim/dynstruct/componentModel/contracts';
import { useComponent, toReact } from '@actdim/dynstruct/componentModel/react/hooks';
import { prop, bind, bindProp } from '@actdim/dynstruct/componentModel/core';
import { useDialog, type DialogStruct } from '@actdim/dynstruct-mui/Dialog';
import { useDrawer, type DrawerStruct } from '@actdim/dynstruct-mui/Drawer';
import { useButton, type ButtonStruct } from '@actdim/dynstruct-mui/Button';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { type DemoMsgStruct } from '../../bus/portalMsgStruct';
import { newMsgId } from '../../bus/ids';

// #region contract
export type ToastItem = {
  id: string;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
  timestamp: string;
};

export type DialogToastStruct = ComponentStruct<
  DemoMsgStruct,
  {
    props: {
      dialogOpen: boolean;
      dialogTitle: string;
      dialogContent: string;
      drawerOpen: boolean;
      toasts: ToastItem[];
      activeToast: ToastItem | null;
    };
    actions: {
      openDialog: () => void;
      closeDialog: () => void;
      toggleDrawer: () => void;
      openDrawer: () => void;
      closeDrawer: () => void;
      sendToast: (severity: 'success' | 'info' | 'warning' | 'error', text: string) => void;
      dismissToast: () => void;
    };
    children: {
      openDialogBtn: ButtonStruct;
      toggleDrawerBtn: ButtonStruct;
      toastSuccessBtn: ButtonStruct;
      toastInfoBtn: ButtonStruct;
      toastWarningBtn: ButtonStruct;
      toastErrorBtn: ButtonStruct;
      dialogDismissBtn: ButtonStruct;
      dialogConfirmBtn: ButtonStruct;
      drawerCloseBtn: ButtonStruct;
      dialog: DialogStruct;
      drawer: DrawerStruct;
    };
    msgScope: {
      publish: 'NOTICE.TOAST' | 'DIALOG.OPEN' | 'DRAWER.TOGGLE';
      subscribe: 'NOTICE.TOAST' | 'DIALOG.OPEN' | 'DRAWER.TOGGLE';
    };
  }
>;
// #endregion contract

export const useDialogToast = (params: ComponentParams<DialogToastStruct>): Component<DialogToastStruct> => {
  let c: Component<DialogToastStruct>;
  let m: ComponentModel<DialogToastStruct>;

  // #region model
  const def: ComponentDef<DialogToastStruct> = {
    regType: 'DialogToastDemo',
    props: {
      dialogOpen: false,
      dialogTitle: 'Default Dialog',
      dialogContent: '',
      drawerOpen: false,
      toasts: prop({ initialValue: [], reactive: 'shallow' }),
      activeToast: null,
    },
    actions: {
      openDialog: () => {
        c.msgBus.send({
          channel: 'DIALOG.OPEN',
          payload: {
            dialogId: 'contract-dialog-1',
            title: 'Dynstruct Contract Dialog',
            content: 'This modal dialog was dispatched via DIALOG.OPEN on @actdim/msgmesh bus.',
          },
        });
      },
      closeDialog: () => {
        m.dialogOpen = false;
      },
      toggleDrawer: () => {
        c.msgBus.send({
          channel: 'DRAWER.TOGGLE',
          payload: {
            open: !m.drawerOpen,
          },
        });
      },
      openDrawer: () => {
        c.msgBus.send({
          channel: 'DRAWER.TOGGLE',
          payload: {
            open: true,
          },
        });
      },
      closeDrawer: () => {
        c.msgBus.send({
          channel: 'DRAWER.TOGGLE',
          payload: {
            open: false,
          },
        });
      },
      sendToast: (severity, text) => {
        c.msgBus.send({
          channel: 'NOTICE.TOAST',
          payload: {
            id: newMsgId(),
            message: text,
            severity,
          },
        });
      },
      dismissToast: () => {
        m.activeToast = null;
      },
    },
    children: {
      openDialogBtn: useButton({
        label: 'Open Modal Dialog',
        variant: 'contained',
        color: 'primary',
        onClick: () => m.openDialog(),
      }),
      toggleDrawerBtn: useButton({
        label: 'Toggle Side Drawer',
        variant: 'outlined',
        color: 'secondary',
        onClick: () => m.toggleDrawer(),
      }),
      toastSuccessBtn: useButton({
        label: 'Success Notice',
        variant: 'outlined',
        color: 'success',
        onClick: () => m.sendToast('success', 'Operation completed in 42ms.'),
      }),
      toastInfoBtn: useButton({
        label: 'Info Notice',
        variant: 'outlined',
        color: 'info',
        onClick: () => m.sendToast('info', 'New data synchronization detected.'),
      }),
      toastWarningBtn: useButton({
        label: 'Warning Notice',
        variant: 'outlined',
        color: 'warning',
        onClick: () => m.sendToast('warning', 'Payload near quota threshold.'),
      }),
      toastErrorBtn: useButton({
        label: 'Error Notice',
        variant: 'outlined',
        color: 'error',
        onClick: () => m.sendToast('error', 'Failed to resolve external endpoint.'),
      }),
      dialogDismissBtn: useButton({
        label: 'Dismiss',
        variant: 'outlined',
        color: 'inherit',
        onClick: () => m.closeDialog(),
      }),
      dialogConfirmBtn: useButton({
        label: 'Confirm & Notify',
        variant: 'contained',
        color: 'primary',
        onClick: () => {
          m.closeDialog();
          m.sendToast('success', 'Confirmed action from inside Dialog!');
        },
      }),
      drawerCloseBtn: useButton({
        label: 'Close Drawer',
        variant: 'outlined',
        fullWidth: true,
        onClick: () => m.closeDrawer(),
      }),
      dialog: useDialog({
        open: bindProp(() => m, 'dialogOpen'),
        onClose: () => m.closeDialog(),
        title: bind(() => m.dialogTitle),
        content: () => (
          <Box sx={{ py: 1 }}>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1 }}>
              {m.dialogContent}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Because it uses native Material UI Dialog inside an Astro React island, it maintains 100% theme fidelity and accessibility without polluting server-side Astro HTML.
            </Typography>
          </Box>
        ),
        actions: () => (
          <Box sx={{ display: 'flex', gap: 1, p: 1 }}>
            <c.children.DialogDismissBtn />
            <c.children.DialogConfirmBtn />
          </Box>
        ),
        maxWidth: 'sm',
        fullWidth: true,
      }),
      drawer: useDrawer({
        open: bindProp(() => m, 'drawerOpen'),
        onClose: () => m.closeDrawer(),
        anchor: 'right',
        children: () => (
          <Box sx={{ width: 320, p: 3, bgcolor: 'background.paper', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              Event Bus Stream
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
              Recent @actdim/msgmesh notices received:
            </Typography>
            <Divider sx={{ my: 1.5 }} />
            <List dense>
              {m.toasts.length === 0 ? (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  No events received yet. Click toast buttons to send notices.
                </Typography>
              ) : (
                m.toasts.map((t) => (
                  <ListItem key={t.id} sx={{ px: 0 }}>
                    <ListItemText
                      primary={t.message}
                      secondary={`${t.severity.toUpperCase()} at ${t.timestamp}`}
                    />
                  </ListItem>
                ))
              )}
            </List>
            <Box sx={{ mt: 3 }}>
              <c.children.DrawerCloseBtn />
            </Box>
          </Box>
        ),
      }),
    },
    msgBroker: {
      subscribe: {
        'NOTICE.TOAST': {
          in: {
            callback: (msg) => {
              const nextItem: ToastItem = {
                id: msg.payload.id,
                message: msg.payload.message,
                severity: msg.payload.severity ?? 'info',
                timestamp: new Date().toLocaleTimeString(),
              };
              m.toasts.unshift(nextItem);
              m.activeToast = nextItem;
            },
          },
        },
        'DIALOG.OPEN': {
          in: {
            callback: (msg) => {
              m.dialogTitle = msg.payload.title;
              m.dialogContent = msg.payload.content;
              m.dialogOpen = true;
            },
          },
        },
        'DRAWER.TOGGLE': {
          in: {
            callback: (msg) => {
              m.drawerOpen = msg.payload.open;
            },
          },
        },
      },
    },
    view: () => (
      <Card variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'divider' }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
              Overlays, Drawers & Event-Driven Toast Stack
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Coordinate complex overlays across components without prop drilling using @actdim/msgmesh channels.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            <c.children.OpenDialogBtn />
            <c.children.ToggleDrawerBtn />
          </Box>

          <Box sx={{ pt: 1 }}>
            <Typography variant="subtitle2" sx={{ color: 'text.primary', mb: 1 }}>
              Dispatch Message Mesh Notifications:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <c.children.ToastSuccessBtn />
              <c.children.ToastInfoBtn />
              <c.children.ToastWarningBtn />
              <c.children.ToastErrorBtn />
            </Box>
          </Box>

          <c.children.Dialog />
          <c.children.Drawer />

          <Snackbar
            key={m.activeToast?.id}
            open={Boolean(m.activeToast)}
            autoHideDuration={4000}
            onClose={m.dismissToast}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            {m.activeToast ? (
              <Alert
                severity={m.activeToast.severity}
                variant="filled"
                onClose={m.dismissToast}
                sx={{ width: '100%', boxShadow: 3 }}
              >
                {m.activeToast.message}
              </Alert>
            ) : undefined}
          </Snackbar>
        </CardContent>
      </Card>
    ),
  };
  // #endregion model

  c = useComponent(def, params);
  m = c.model;

  return c;
};

// #region integration
export const DialogToastDemo = toReact(useDialogToast);
DialogToastDemo.displayName = 'DialogToastDemo';
// #endregion integration
