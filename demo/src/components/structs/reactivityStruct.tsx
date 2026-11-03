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
import { useButton, type ButtonStruct } from '@actdim/dynstruct-mui/Button';
import { Box, Card, CardContent, Typography, Chip, Divider } from '@mui/material';
import { type DemoMsgStruct } from '../../bus/portalMsgStruct';

function CommittedRenderCounter({ renderToken }: { renderToken: unknown }) {
  const commitCountRef = React.useRef(0);
  const textRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    commitCountRef.current += 1;
    if (textRef.current) {
      textRef.current.textContent = `View Render Passes: ${commitCountRef.current}`;
    }
  }, [renderToken]);

  return (
    <Chip
      label={<span ref={textRef}>View Render Passes: 1</span>}
      color="secondary"
      variant="outlined"
    />
  );
}

// #region contract
export type ReactivityStruct = ComponentStruct<
  DemoMsgStruct,
  {
    props: {
      deepObject: { nested: { count: number; name: string } };
      shallowArray: Array<{ id: string; label: string; active: boolean }>;
      refHolder: { configKey: string; updated: string };
      resetKey: number;
    };
    actions: {
      mutateDeepNested: () => void;
      pushShallowItem: () => void;
      mutateShallowItemDirectly: () => void;
      replaceRefHolder: () => void;
      mutateRefHolderInternal: () => void;
      resetAll: () => void;
    };
    children: {
      mutateDeepBtn: ButtonStruct;
      pushShallowBtn: ButtonStruct;
      mutateShallowBtn: ButtonStruct;
      replaceRefBtn: ButtonStruct;
      mutateRefBtn: ButtonStruct;
      resetAllBtn: ButtonStruct;
    };
  }
>;
// #endregion contract

export const useReactivity = (params: ComponentParams<ReactivityStruct>): Component<ReactivityStruct> => {
  let c: Component<ReactivityStruct>;
  let m: ComponentModel<ReactivityStruct>;

  // #region model
  const def: ComponentDef<ReactivityStruct> = {
    regType: 'ReactivityDemo',
    props: {
      deepObject: prop({
        initialValue: { nested: { count: 0, name: 'RootNode' } },
        reactive: true,
      }),
      shallowArray: prop({
        initialValue: [
          { id: '1', label: 'Alpha', active: true },
          { id: '2', label: 'Beta', active: false },
        ],
        reactive: 'shallow',
      }),
      refHolder: prop({
        initialValue: { configKey: 'v1.0-default', updated: new Date().toLocaleTimeString() },
        reactive: 'ref',
      }),
      resetKey: 0,
    },
    actions: {
      mutateDeepNested: () => {
        m.deepObject.nested.count += 1;
        m.deepObject.nested.name = `Node-${m.deepObject.nested.count}`;
      },
      pushShallowItem: () => {
        const id = String(m.shallowArray.length + 1);
        m.shallowArray.push({ id, label: `Item #${id}`, active: id.charCodeAt(0) % 2 === 0 });
      },
      mutateShallowItemDirectly: () => {
        if (m.shallowArray.length > 0) {
          m.shallowArray[0].active = !m.shallowArray[0].active;
          m.shallowArray[0].label = `${m.shallowArray[0].label} (silent)`;
        }
      },
      replaceRefHolder: () => {
        m.refHolder = {
          configKey: `v1.${Date.now() % 100}`,
          updated: new Date().toLocaleTimeString(),
        };
      },
      mutateRefHolderInternal: () => {
        m.refHolder.configKey = 'MUTATED_SILENTLY';
      },
      resetAll: () => {
        m.resetKey += 1;
        m.deepObject = { nested: { count: 0, name: 'RootNode' } };
        m.shallowArray = [
          { id: '1', label: 'Alpha', active: true },
          { id: '2', label: 'Beta', active: false },
        ];
        m.refHolder = { configKey: 'v1.0-default', updated: new Date().toLocaleTimeString() };
      },
    },
    children: {
      mutateDeepBtn: useButton({
        label: 'Mutate deepObject.nested.count++',
        variant: 'outlined',
        color: 'primary',
        onClick: () => m.mutateDeepNested(),
      }),
      pushShallowBtn: useButton({
        label: 'Push New Item (Triggers Render)',
        variant: 'outlined',
        color: 'secondary',
        onClick: () => m.pushShallowItem(),
      }),
      mutateShallowBtn: useButton({
        label: 'Mutate Item[0] In-Place (Silent)',
        variant: 'text',
        color: 'inherit',
        onClick: () => m.mutateShallowItemDirectly(),
      }),
      replaceRefBtn: useButton({
        label: 'Replace Reference (Triggers Render)',
        variant: 'outlined',
        color: 'warning',
        onClick: () => m.replaceRefHolder(),
      }),
      mutateRefBtn: useButton({
        label: 'Mutate refHolder Property (Silent)',
        variant: 'text',
        color: 'inherit',
        onClick: () => m.mutateRefHolderInternal(),
      }),
      resetAllBtn: useButton({
        label: 'Reset All State',
        variant: 'outlined',
        color: 'inherit',
        onClick: () => m.resetAll(),
      }),
    },
    view: () => {
      return (
        <Card variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'divider' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                  Fine-Grained MobX Reactivity Modes
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Compare `deep`, `shallow`, and `ref` reactivity semantics in Dynstruct.
                </Typography>
              </Box>
              <CommittedRenderCounter key={m.resetKey} renderToken={{}} />
            </Box>

            {/* Deep Reactivity Block */}
            <Box sx={{ p: 2, borderRadius: 1, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  {'1. Deep Reactivity (prop({ reactive: true }))'}
                </Typography>
                <Chip size="small" label="Auto-Proxied Recursively" color="primary" />
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                Mutating deep nested properties immediately triggers re-render without manual observable tracking.
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {`deepObject.nested: { count: ${m.deepObject.nested.count}, name: "${m.deepObject.nested.name}" }`}
                </Typography>
              </Box>
              <c.children.MutateDeepBtn />
            </Box>

            {/* Shallow Reactivity Block */}
            <Box sx={{ p: 2, borderRadius: 1, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ color: 'secondary.main', fontWeight: 'bold' }}>
                  {"2. Shallow Reactivity (prop({ reactive: 'shallow' }))"}
                </Typography>
                <Chip size="small" label="Container Mutations Only" color="secondary" />
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                Array push/pop operations trigger re-render; mutating an internal item directly bypasses tracking.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                {m.shallowArray.map((it) => (
                  <Chip
                    key={it.id}
                    label={`${it.label} (${it.active ? 'active' : 'inactive'})`}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <c.children.PushShallowBtn />
                <c.children.MutateShallowBtn />
              </Box>
            </Box>

            {/* Ref Reactivity Block */}
            <Box sx={{ p: 2, borderRadius: 1, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                  {"3. Reference Reactivity (prop({ reactive: 'ref' }))"}
                </Typography>
                <Chip size="small" label="Identity Check Only" color="warning" />
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                Only reference replacement triggers re-render. Ideal for large models, React slots, or callbacks.
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1.5 }}>
                {`refHolder: { key: "${m.refHolder.configKey}", updated: "${m.refHolder.updated}" }`}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <c.children.ReplaceRefBtn />
                <c.children.MutateRefBtn />
              </Box>
            </Box>

            <Divider />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <c.children.ResetAllBtn />
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
export const ReactivityDemo = toReact(useReactivity);
ReactivityDemo.displayName = 'ReactivityDemo';
// #endregion integration
