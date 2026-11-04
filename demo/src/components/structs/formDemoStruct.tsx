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
import { useTextField, type TextFieldStruct } from '@actdim/dynstruct-mui/TextField';
import { useSelect, type SelectStruct, type SelectOption } from '@actdim/dynstruct-mui/Select';
import { useCheckbox, type CheckboxStruct } from '@actdim/dynstruct-mui/Checkbox';
import { useSwitch, type SwitchStruct } from '@actdim/dynstruct-mui/Switch';
import { useSlider, type SliderStruct } from '@actdim/dynstruct-mui/Slider';
import { useButton, type ButtonStruct } from '@actdim/dynstruct-mui/Button';
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
    children: {
      usernameInput: TextFieldStruct;
      emailInput: TextFieldStruct;
      roleSelect: SelectStruct;
      experienceSlider: SliderStruct;
      streamSwitch: SwitchStruct;
      termsCheckbox: CheckboxStruct;
      resetBtn: ButtonStruct;
      submitBtn: ButtonStruct;
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

  const roleOptions: SelectOption[] = [
    { value: 'frontend', label: 'Frontend Engineer' },
    { value: 'backend', label: 'Backend / Systems Engineer' },
    { value: 'fullstack', label: 'Full-Stack Architect' },
    { value: 'devops', label: 'Platform / DevOps Engineer' },
  ];

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
          nextErrors.username = 'Username must be at least 3 characters.';
        }
        if (!m.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email)) {
          nextErrors.email = 'Valid email address is required.';
        }
        if (!m.termsAccepted) {
          nextErrors.termsAccepted = 'You must accept the terms before submitting.';
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
              message: 'Validation failed! Check required fields.',
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
    children: {
      usernameInput: useTextField({
        label: 'Username',
        value: bindProp(() => m, 'username'),
        onChange: (v) => m.setUsername(v),
        error: bind(() => Boolean(m.errors.username)),
        helperText: bind(() => m.errors.username),
        placeholder: 'e.g. alex_developer',
        fullWidth: true,
      }),
      emailInput: useTextField({
        label: 'Email',
        value: bindProp(() => m, 'email'),
        onChange: (v) => m.setEmail(v),
        error: bind(() => Boolean(m.errors.email)),
        helperText: bind(() => m.errors.email),
        placeholder: 'alex@example.com',
        fullWidth: true,
      }),
      roleSelect: useSelect({
        label: 'Primary Engineering Role',
        value: bindProp(() => m, 'role'),
        options: roleOptions,
        onChange: (v) => m.setRole(v),
        fullWidth: true,
      }),
      experienceSlider: useSlider({
        value: bindProp(() => m, 'experienceYears'),
        min: 1,
        max: 20,
        step: 1,
        onChange: (v) => m.setExperienceYears(v),
      }),
      streamSwitch: useSwitch({
        label: 'Enable Real-Time Event Stream',
        checked: bindProp(() => m, 'notifications'),
        onChange: (v) => m.setNotifications(v),
      }),
      termsCheckbox: useCheckbox({
        label: 'Accept Terms & Architecture Agreement',
        checked: bindProp(() => m, 'termsAccepted'),
        error: bind(() => Boolean(m.errors.termsAccepted)),
        helperText: bind(() => m.errors.termsAccepted),
        onChange: (v) => m.setTermsAccepted(v),
      }),
      resetBtn: useButton({
        label: 'Reset',
        variant: 'outlined',
        color: 'secondary',
        onClick: () => m.reset(),
      }),
      submitBtn: useButton({
        label: 'Submit Contract Form',
        variant: 'contained',
        color: 'primary',
        onClick: () => m.submit(),
      }),
    },
    view: () => (
      <Card variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'divider' }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
              Contract-Driven Form with Validation
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Pure Dynstruct reactivity with zero-boilerplate action mutators and typed msgmesh notifications.
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <c.children.UsernameInput />
            <c.children.EmailInput />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <c.children.RoleSelect />
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1 }}>
                Experience Level: {m.experienceYears} Years
              </Typography>
              <c.children.ExperienceSlider />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <c.children.StreamSwitch />
            <c.children.TermsCheckbox />
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
            <c.children.ResetBtn />
            <c.children.SubmitBtn />
          </Box>
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
export const FormDemo = toReact(useFormDemo);
FormDemo.displayName = 'FormDemo';
// #endregion integration
