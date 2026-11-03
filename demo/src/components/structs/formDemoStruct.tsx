import React from 'react';
import {
  type ComponentStruct,
  type ComponentDef,
  type ComponentParams,
  type Component,
  type ComponentModel,
} from '@actdim/dynstruct/componentModel/contracts';
import { useComponent, toReact } from '@actdim/dynstruct/componentModel/react/hooks';
import { prop } from '@actdim/dynstruct/componentModel/core';
import { TextField } from '@actdim/dynstruct-mui/TextField';
import { Select } from '@actdim/dynstruct-mui/Select';
import { Checkbox } from '@actdim/dynstruct-mui/Checkbox';
import { Switch } from '@actdim/dynstruct-mui/Switch';
import { Slider } from '@actdim/dynstruct-mui/Slider';
import { Button } from '@actdim/dynstruct-mui/Button';
import { Box, Card, CardContent, Typography, Alert } from '@mui/material';
import { type DemoMsgStruct } from '../../bus/portalMsgStruct';
import { newMsgId } from '../../bus/ids';

// #region contract
export type FormDemoStruct = ComponentStruct<
  DemoMsgStruct,
  {
    props: {
      username: string;
      email: string;
      role: string;
      notifications: boolean;
      termsAccepted: boolean;
      experienceYears: number;
      submittedPayload: string | null;
      errors: Record<string, string>;
    };
    actions: {
      setUsername: (v: string) => void;
      setEmail: (v: string) => void;
      setRole: (v: string) => void;
      setNotifications: (v: boolean) => void;
      setTermsAccepted: (v: boolean) => void;
      setExperienceYears: (v: number) => void;
      validate: () => boolean;
      submit: () => void;
      reset: () => void;
    };
    msgScope: {
      publish: 'NOTICE.TOAST';
    };
  }
>;
// #endregion contract

export const useFormDemo = (params: ComponentParams<FormDemoStruct>): Component<FormDemoStruct> => {
  let c: Component<FormDemoStruct>;
  let m: ComponentModel<FormDemoStruct>;

  // #region model
  const def: ComponentDef<FormDemoStruct> = {
    regType: 'FormDemo',
    props: {
      username: '',
      email: '',
      role: 'frontend',
      notifications: true,
      termsAccepted: false,
      experienceYears: 3,
      submittedPayload: null,
      errors: prop({ initialValue: {}, reactive: true }),
    },
    actions: {
      setUsername: (v: string) => {
        m.username = v;
        if (m.errors.username && v.length >= 3) {
          delete m.errors.username;
        }
      },
      setEmail: (v: string) => {
        m.email = v;
        if (m.errors.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
          delete m.errors.email;
        }
      },
      setRole: (v: string) => {
        m.role = v;
      },
      setNotifications: (v: boolean) => {
        m.notifications = v;
      },
      setTermsAccepted: (v: boolean) => {
        m.termsAccepted = v;
        if (v && m.errors.termsAccepted) {
          delete m.errors.termsAccepted;
        }
      },
      setExperienceYears: (v: number) => {
        m.experienceYears = v;
      },
      validate: () => {
        const nextErrors: Record<string, string> = {};
        if (!m.username || m.username.trim().length < 3) {
          nextErrors.username = 'Username must contain at least 3 characters.';
        }
        if (!m.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email)) {
          nextErrors.email = 'Please provide a valid email address.';
        }
        if (!m.termsAccepted) {
          nextErrors.termsAccepted = 'You must accept the terms of service.';
        }

        m.errors = nextErrors;
        return Object.keys(nextErrors).length === 0;
      },
      submit: () => {
        if (!m.validate()) {
          c.msgBus.send({
            channel: 'NOTICE.TOAST',
            payload: {
              id: newMsgId(),
              message: 'Validation failed: Check highlighted fields.',
              severity: 'error',
            },
          });
          return;
        }

        const data = {
          username: m.username,
          email: m.email,
          role: m.role,
          notifications: m.notifications,
          termsAccepted: m.termsAccepted,
          experienceYears: m.experienceYears,
          submittedAt: new Date().toISOString(),
        };

        m.submittedPayload = JSON.stringify(data, null, 2);

        c.msgBus.send({
          channel: 'NOTICE.TOAST',
          payload: {
            id: newMsgId(),
            message: `Form submitted successfully for ${m.username}!`,
            severity: 'success',
          },
        });
      },
      reset: () => {
        m.username = '';
        m.email = '';
        m.role = 'frontend';
        m.notifications = true;
        m.termsAccepted = false;
        m.experienceYears = 3;
        m.submittedPayload = null;
        m.errors = {};
      },
    },
    view: () => {
      const roleOptions = [
        { value: 'frontend', label: 'Frontend Engineer' },
        { value: 'fullstack', label: 'Full-Stack Architect' },
        { value: 'systems', label: 'Systems & Infrastructure' },
        { value: 'designer', label: 'UI/UX Specialist' },
      ];

      return (
        <Card variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'divider' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                Contract-Driven Form with Validation
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Pure MobX reactivity with zero-boilerplate action mutators and typed msgmesh notifications.
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Username"
                value={m.username}
                onChange={m.setUsername}
                error={Boolean(m.errors.username)}
                helperText={m.errors.username}
                placeholder="e.g. alex_developer"
                fullWidth
              />

              <TextField
                label="Email"
                value={m.email}
                onChange={m.setEmail}
                error={Boolean(m.errors.email)}
                helperText={m.errors.email}
                placeholder="alex@example.com"
                fullWidth
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Select
                label="Primary Engineering Role"
                value={m.role}
                options={roleOptions}
                onChange={m.setRole}
                fullWidth
              />

              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1 }}>
                  Experience Level: {m.experienceYears} Years
                </Typography>
                <Slider
                  value={m.experienceYears}
                  min={1}
                  max={20}
                  step={1}
                  onChange={m.setExperienceYears}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Switch
                label="Enable Real-Time Event Stream"
                checked={m.notifications}
                onChange={m.setNotifications}
              />

              <Checkbox
                label="Accept Terms & Architecture Agreement"
                checked={m.termsAccepted}
                error={Boolean(m.errors.termsAccepted)}
                helperText={m.errors.termsAccepted}
                onChange={m.setTermsAccepted}
              />
            </Box>

            {m.submittedPayload && (
              <Alert severity="success" sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                  Verified Payload Output:
                </Typography>
                <pre style={{ margin: 0, fontSize: '11px', overflowX: 'auto' }}>
                  {m.submittedPayload}
                </pre>
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', pt: 1 }}>
              <Button
                label="Reset"
                variant="outlined"
                color="secondary"
                onClick={m.reset}
              />
              <Button
                label="Submit Contract Form"
                variant="contained"
                color="primary"
                onClick={m.submit}
              />
            </Box>
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
export const FormDemo = toReact(useFormDemo);
FormDemo.displayName = 'FormDemo';
// #endregion integration
