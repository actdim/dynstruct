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
import { Button } from '@actdim/dynstruct-mui/Button';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
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
    title: 'MobX Fine-Grained Observable Mechanics',
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
    msgScope: {
      provide: 'RPC.SEARCH';
      publish: 'RPC.SEARCH';
    };
  }
>;
// #endregion contract

export const useAsyncSearch = (params: ComponentParams<AsyncSearchStruct>): Component<AsyncSearchStruct> => {
  let c: Component<AsyncSearchStruct>;
  let m: ComponentModel<AsyncSearchStruct>;
  let searchSeq = 0;
  let searchTimer: ReturnType<typeof setTimeout> | null = null;

  // #region model
  const def: ComponentDef<AsyncSearchStruct> = {
    regType: 'AsyncSearchDemo',
    props: {
      query: '',
      loading: false,
      results: prop({ initialValue: SAMPLE_DATABASE, reactive: true }),
      executionTimeMs: null,
      searchError: null,
    },
    msgBroker: {
      provide: {
        'RPC.SEARCH': {
          in: {
            callback: async (msg) => {
              // Simulate 100ms async latency
              await new Promise((r) => setTimeout(r, 100));
              const q = (msg.payload?.query || '').toLowerCase().trim();
              if (!q) {
                return { items: SAMPLE_DATABASE };
              }
              const filtered = SAMPLE_DATABASE.filter(
                (it) =>
                  it.title.toLowerCase().includes(q) ||
                  it.category.toLowerCase().includes(q) ||
                  it.description.toLowerCase().includes(q)
              );
              return { items: filtered };
            },
          },
        },
      },
    },
    actions: {
      setQuery: (q: string) => {
        m.query = q;
        if (searchTimer) {
          clearTimeout(searchTimer);
        }
        searchTimer = setTimeout(() => {
          m.performSearch(q);
        }, 250);
      },
      performSearch: async (q: string) => {
        const seq = ++searchSeq;
        m.loading = true;
        m.searchError = null;
        const start = performance.now();
        try {
          const response = await c.msgBus.request({
            channel: 'RPC.SEARCH',
            payload: { query: q },
          });
          if (seq !== searchSeq) return;
          m.results = response?.payload?.items ?? [];
          m.executionTimeMs = Math.round(performance.now() - start);
        } catch (err: unknown) {
          if (seq !== searchSeq) return;
          m.results = [];
          m.executionTimeMs = null;
          m.searchError = err instanceof Error ? err.message : 'Search request failed.';
        } finally {
          if (seq === searchSeq) {
            m.loading = false;
          }
        }
      },
      clearSearch: () => {
        if (searchTimer) {
          clearTimeout(searchTimer);
          searchTimer = null;
        }
        searchSeq++;
        m.query = '';
        m.results = SAMPLE_DATABASE;
        m.executionTimeMs = null;
        m.searchError = null;
        m.loading = false;
      },
    },
    events: {
      onDestroy: () => {
        if (searchTimer) {
          clearTimeout(searchTimer);
        }
      },
    },
    view: () => {
      return (
        <Card variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'divider' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                Async Effects & MsgMesh RPC Provider
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Search queries dispatch type-safe RPC requests through `@actdim/msgmesh` with debouncing and async handling.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <TextField
                label="Search Documentation & Topics"
                value={m.query}
                onChange={m.setQuery}
                placeholder="Type 'architecture', 'ssr', or 'reactivity'..."
                fullWidth
              />
              {m.loading && <CircularProgress size={28} sx={{ color: 'primary.main', flexShrink: 0 }} />}
              {m.query && (
                <Button label="Clear" variant="outlined" color="inherit" onClick={m.clearSearch} />
              )}
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
                            {item.badge && (
                              <Chip label={item.badge} size="small" color="primary" sx={{ height: 20, fontSize: 10 }} />
                            )}
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              ({item.category})
                            </Typography>
                          </Box>
                        }
                        secondary={item.description}
                      />
                    </ListItem>
                    {idx < m.results.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))
              )}
            </List>
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
export const AsyncSearchDemo = toReact(useAsyncSearch);
AsyncSearchDemo.displayName = 'AsyncSearchDemo';
// #endregion integration
