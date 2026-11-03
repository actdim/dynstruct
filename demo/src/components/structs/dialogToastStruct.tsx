import React from 'react';
import { observer } from 'mobx-react-lite';
import {
  type ComponentStruct,
  type ComponentDef,
  type ComponentParams,
  type Component,
  type ComponentModel,
} from '@actdim/dynstruct/componentModel/contracts';
import { useComponent, toReact } from '@actdim/dynstruct/componentModel/react/hooks';
import { prop } from '@actdim/dynstruct/componentModel/core';
import { Dialog } from '@actdim/dynstruct-mui/Dialog';
import { Drawer } from '@actdim/dynstruct-mui/Drawer';
import { Button } from '@actdim/dynstruct-mui/Button';
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

  const DialogContentComp = React.useMemo(
    () =>
      observer(() => (
        <Box sx={{ py: 1 }}>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1 }}>
            {m.dialogContent}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Because it uses native Material UI Dialog inside an Astro React island, it maintains 100% theme fidelity and accessibility without polluting server-side Astro HTML.
          </Typography>
        </Box>
      )),
    [],
  );

  const DialogActionsComp = React.useCallback(
    () => (
      <Box sx={{ display: 'flex', gap: 1, p: 1 }}>
        <Button label="Dismiss" variant="outlined" color="inherit" onClick={() => m.closeDialog()} />
        <Button
          label="Confirm & Notify"
          variant="contained"
          color="primary"
          onClick={() => {
            m.closeDialog();
            m.sendToast('success', 'Confirmed action from inside Dialog!');
          }}
        />
      </Box>
    ),
    [],
  );

  const DrawerContentComp = React.useMemo(
    () =>
      observer(() => (
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
            <Button label="Close Drawer" variant="outlined" fullWidth onClick={() => m.closeDrawer()} />
          </Box>
        </Box>
      )),
    [],
  );

  // #region model
  const def: ComponentDef<DialogToastStruct> = {
    regType: 'DialogToast',
    props: {
      dialogOpen: false,
      dialogTitle: 'Dynstruct Contract Dialog',
      dialogContent: 'This modal dialog is wired through the ComponentDef contract and controlled via reactive model state.',
      drawerOpen: false,
      toasts: prop({ initialValue: [], reactive: true }),
      activeToast: null,
    },
    msgBroker: {
      subscribe: {
        'NOTICE.TOAST': {
          in: {
            callback: (msg) => {
              const item: ToastItem = {
                id: msg.payload.id,
                message: msg.payload.message,
                severity: msg.payload.severity ?? 'info',
                timestamp: new Date().toLocaleTimeString(),
              };
              m.toasts.unshift(item);
              if (m.toasts.length > 5) {
                m.toasts.pop();
              }
              m.activeToast = item;
            },
          },
        },
        'DIALOG.OPEN': {
          in: {
            callback: (msg) => {
              m.dialogOpen = true;
              m.dialogTitle = msg.payload.title;
              m.dialogContent = msg.payload.content;
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
    view: () => {
      return (
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
              <Button
                label="Open Modal Dialog"
                variant="contained"
                color="primary"
                onClick={m.openDialog}
              />
              <Button
                label="Toggle Side Drawer"
                variant="outlined"
                color="secondary"
                onClick={m.toggleDrawer}
              />
            </Box>

            <Box sx={{ pt: 1 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.primary', mb: 1 }}>
                Dispatch Message Mesh Notifications:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Button
                  label="Success Notice"
                  variant="outlined"
                  color="success"
                  onClick={() => m.sendToast('success', 'Operation completed in 42ms.')}
                />
                <Button
                  label="Info Notice"
                  variant="outlined"
                  color="info"
                  onClick={() => m.sendToast('info', 'New data synchronization detected.')}
                />
                <Button
                  label="Warning Notice"
                  variant="outlined"
                  color="warning"
                  onClick={() => m.sendToast('warning', 'Payload near quota threshold.')}
                />
                <Button
                  label="Error Notice"
                  variant="outlined"
                  color="error"
                  onClick={() => m.sendToast('error', 'Failed to resolve external endpoint.')}
                />
              </Box>
            </Box>

            <Dialog
              open={m.dialogOpen}
              onClose={m.closeDialog}
              title={m.dialogTitle}
              content={DialogContentComp}
              actions={DialogActionsComp}
              maxWidth="sm"
              fullWidth
            />

            <Drawer
              open={m.drawerOpen}
              onClose={m.closeDrawer}
              anchor="right"
              children={DrawerContentComp}
            />

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
      );
    },
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
