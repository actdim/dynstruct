import React from 'react';
import {
  type ComponentStruct,
  type ComponentDef,
  type ComponentParams,
  type Component,
  type ComponentModel,
} from '@actdim/dynstruct/componentModel/contracts';
import { useComponent, toReact } from '@actdim/dynstruct/componentModel/react/hooks';
import { prop, bindProp } from '@actdim/dynstruct/componentModel/core';
import { useTextField, type TextFieldStruct } from '@actdim/dynstruct-mui/TextField';
import { useButton, type ButtonStruct } from '@actdim/dynstruct-mui/Button';
import { useCircularProgress, type CircularProgressStruct } from '@actdim/dynstruct-mui/CircularProgress';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import { type DemoMsgStruct, type DemoCatalogItem } from '../../bus/portalMsgStruct';

const SAMPLE_DATABASE: DemoCatalogItem[] = [
  {
    id: 's1',
    title: 'Reactive Microfrontends with Dynstruct',
    category: 'Architecture',
    description: 'Deconstruct complex enterprise React monoliths into type-safe composable structures.',
    rating: 4.9,
    badge: 'Core',
  },
  {
    id: 's2',
    title: 'Decoupled Service Mesh with MsgMesh',
    category: 'Networking',
    description: 'High performance event bus and RPC protocol over RxJS streams with zero coupling.',
    rating: 4.8,
    badge: 'Protocol',
  },
  {
    id: 's3',
    title: 'Zero-FOUC Island SSR in Astro',
    category: 'Performance',
    description: 'Render clean static HTML with Astro while confining Material UI to isolated client islands.',
    rating: 5.0,
    badge: 'SSR',
  },
  {
    id: 's4',
    title: 'Fine-Grained Observable Mechanics',
    category: 'Reactivity',
    description: 'Eliminate React hook dependencies and re-render thrashing with transparent proxies.',
    rating: 4.7,
    badge: 'State',
  },
  {
    id: 's5',
    title: 'Material UI Dynstruct Adapters',
    category: 'Design System',
    description: 'Turn standard MUI widgets into contract-backed, event-driven Dynstruct components.',
    rating: 4.8,
    badge: 'UI',
  },
];

// #region contract
export type AsyncSearchStruct = ComponentStruct<
  DemoMsgStruct,
  {
    props: {
      query: string;
      loading: boolean;
      results: DemoCatalogItem[];
      executionTimeMs: number | null;
      searchError: string | null;
    };
    actions: {
      setQuery: (q: string) => void;
      performSearch: (q: string) => Promise<void>;
      clearSearch: () => void;
    };
    children: {
      searchInput: TextFieldStruct;
      clearBtn: ButtonStruct;
      loadingProgress: CircularProgressStruct;
    };
    msgScope: {
      publish: 'RPC.SEARCH';
    };
  }
>;
// #endregion contract

export const useAsyncSearch = (params: ComponentParams<AsyncSearchStruct>): Component<AsyncSearchStruct> => {
  let c: Component<AsyncSearchStruct>;
  let m: ComponentModel<AsyncSearchStruct>;

  let activeAbortController: AbortController | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // #region model
  const def: ComponentDef<AsyncSearchStruct> = {
    regType: 'AsyncSearchDemo',
    props: {
      query: '',
      loading: false,
      results: prop({ initialValue: SAMPLE_DATABASE, reactive: 'ref' }),
      executionTimeMs: null,
      searchError: null,
    },
    actions: {
      setQuery: (q: string) => {
        m.query = q;
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
          m.performSearch(q);
        }, 300);
      },
      performSearch: async (q: string) => {
        if (activeAbortController) {
          activeAbortController.abort();
        }
        activeAbortController = new AbortController();
        const signal = activeAbortController.signal;

        m.loading = true;
        m.searchError = null;
        const startTime = performance.now();

        try {
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => resolve(), 350);
            signal.addEventListener('abort', () => {
              clearTimeout(timeout);
              reject(new DOMException('Aborted', 'AbortError'));
            });
          });

          const normalized = q.trim().toLowerCase();
          const filtered =
            normalized === ''
              ? SAMPLE_DATABASE
              : SAMPLE_DATABASE.filter(
                  (item) =>
                    item.title.toLowerCase().includes(normalized) ||
                    item.description.toLowerCase().includes(normalized) ||
                    item.category.toLowerCase().includes(normalized)
                );

          m.results = filtered;
          m.executionTimeMs = Math.round(performance.now() - startTime);
          m.loading = false;
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') {
            return;
          }
          m.searchError = 'RPC request failed to execute.';
          m.loading = false;
        }
      },
      clearSearch: () => {
        m.query = '';
        m.results = SAMPLE_DATABASE;
        m.executionTimeMs = null;
        m.searchError = null;
      },
    },
    children: {
      searchInput: useTextField({
        label: 'Search Documentation & Topics',
        value: bindProp(() => m, 'query'),
        onChange: (v) => m.setQuery(v),
        placeholder: "Type 'architecture', 'ssr', or 'reactivity'...",
        fullWidth: true,
      }),
      clearBtn: useButton({
        label: 'Clear',
        variant: 'outlined',
        color: 'inherit',
        onClick: () => m.clearSearch(),
      }),
      loadingProgress: useCircularProgress({
        size: 28,
        color: 'primary',
      }),
    },
    view: () => (
      <Card variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'divider' }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
              Async Effects & MsgMesh RPC Provider
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Search queries dispatch type-safe RPC requests through @actdim/msgmesh with debouncing and async handling.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <c.children.SearchInput />
            {m.loading && <c.children.LoadingProgress />}
            {m.query && <c.children.ClearBtn />}
          </Box>

          {m.searchError && (
            <Alert severity="error">{m.searchError}</Alert>
          )}

          {m.executionTimeMs !== null && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                size="small"
                label={`RPC Roundtrip: ${m.executionTimeMs}ms`}
                color="success"
                variant="outlined"
              />
              <Chip
                size="small"
                label={`Found: ${m.results.length} item(s)`}
                variant="outlined"
              />
            </Box>
          )}

          <List sx={{ bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider', p: 0 }}>
            {m.results.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No results found matching &quot;{m.query}&quot;.
                </Typography>
              </Box>
            ) : (
              m.results.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <ListItem sx={{ py: 1.5, px: 2 }}>
                    <ListItemText
                      slotProps={{
                        primary: { component: 'div' },
                      }}
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                            {item.title}
                          </Typography>
                          <Chip label={item.badge} size="small" color="primary" sx={{ height: 20, fontSize: 10 }} />
                          <Chip label={item.category} size="small" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {item.description}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {idx < m.results.length - 1 && <Divider />}
                </React.Fragment>
              ))
            )}
          </List>
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
export const AsyncSearchDemo = toReact(useAsyncSearch);
AsyncSearchDemo.displayName = 'AsyncSearchDemo';
// #endregion integration
