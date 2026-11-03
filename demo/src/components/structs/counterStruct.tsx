import React from 'react';
import {
  type ComponentStruct,
  type ComponentDef,
  type ComponentParams,
  type Component,
  type ComponentModel,
} from '@actdim/dynstruct/componentModel/contracts';
import { useComponent, toReact } from '@actdim/dynstruct/componentModel/react/hooks';
import { bind } from '@actdim/dynstruct/componentModel/core';
import { useButton, type ButtonStruct } from '@actdim/dynstruct-mui/Button';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { type DemoMsgStruct } from '../../bus/portalMsgStruct';

// #region contract
export type CounterStruct = ComponentStruct<
  DemoMsgStruct,
  {
    props: {
      count: number;
      step: number;
      max: number;
    };
    actions: {
      increment: () => void;
      decrement: () => void;
      reset: () => void;
    };
    children: {
      decrementBtn: ButtonStruct;
      resetBtn: ButtonStruct;
      incrementBtn: ButtonStruct;
    };
  }
>;
// #endregion contract

export const useCounter = (params: ComponentParams<CounterStruct>): Component<CounterStruct> => {
  let c: Component<CounterStruct>;
  let m: ComponentModel<CounterStruct>;

  // #region model
  const def: ComponentDef<CounterStruct> = {
    regType: 'Counter',
    props: {
      count: 0,
      step: 1,
      max: 20,
    },
    actions: {
      increment: () => {
        if (m.count + m.step <= m.max) {
          m.count += m.step;
        }
      },
      decrement: () => {
        if (m.count - m.step >= 0) {
          m.count -= m.step;
        }
      },
      reset: () => {
        m.count = 0;
      },
    },
    children: {
      decrementBtn: useButton({
        label: 'Decrement',
        variant: 'outlined',
        color: 'secondary',
        disabled: bind(() => m.count <= 0),
        onClick: () => m.decrement(),
      }),
      resetBtn: useButton({
        label: 'Reset',
        variant: 'text',
        color: 'inherit',
        disabled: bind(() => m.count <= 0),
        onClick: () => m.reset(),
      }),
      incrementBtn: useButton({
        label: 'Increment',
        variant: 'contained',
        color: 'primary',
        disabled: bind(() => m.count >= m.max),
        onClick: () => m.increment(),
      }),
    },
    view: () => {
      const isMax = m.count >= m.max;

      return (
        <Card variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'divider' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                Reactive Counter Model
              </Typography>
              <Chip
                label={isMax ? 'MAX REACHED' : `Step: ${m.step}`}
                color={isMax ? 'warning' : 'primary'}
                size="small"
                variant="outlined"
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
              <Typography variant="h2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {m.count}
              </Typography>
              <Typography variant="h5" sx={{ color: 'text.secondary', ml: 1 }}>
                / {m.max}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
              <c.children.DecrementBtn />
              <c.children.ResetBtn />
              <c.children.IncrementBtn />
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
export const Counter = toReact(useCounter);
Counter.displayName = 'Counter';
// #endregion integration
