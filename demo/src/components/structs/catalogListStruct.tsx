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
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';
import {
  type DemoMsgStruct,
  type DemoCatalogItem,
  type CatalogFilterPayload,
  DEFAULT_FILTER,
} from '../../bus/portalMsgStruct';

export const ALL_ITEMS: DemoCatalogItem[] = [
  {
    id: 'c1',
    title: 'ComponentStruct Type-Safe Contracts',
    category: 'Architecture',
    description: 'Enforce strict props, actions, and message scopes at the TypeScript level.',
    rating: 4.9,
    badge: 'Contract',
  },
  {
    id: 'c2',
    title: 'Zero-Boilerplate MobX Reactivity',
    category: 'Reactivity',
    description: 'Fine-grained mutation tracking without manual autorun or useEffect hook dependencies.',
    rating: 4.8,
    badge: 'State',
  },
  {
    id: 'c3',
    title: 'Decoupled Cross-Island Communication',
    category: 'Networking',
    description: 'Seamless event bus and RPC coordination between independent Astro React islands.',
    rating: 5.0,
    badge: 'Bus',
  },
  {
    id: 'c4',
    title: 'Zero-FOUC Island SSR in Astro',
    category: 'Performance',
    description: 'Clean crawlable HTML generated on the server with zero client CSS-in-JS layout shift.',
    rating: 4.9,
    badge: 'SEO',
  },
  {
    id: 'c5',
    title: 'Material UI Dynstruct Component Adapters',
    category: 'UI',
    description: 'Full suite of accessible, theme-consistent Material UI controls wrapped into Dynstruct.',
    rating: 4.7,
    badge: 'Components',
  },
  {
    id: 'c6',
    title: 'Transparent Microfrontend Isolation',
    category: 'Architecture',
    description: 'Embed autonomous widgets into independent repositories or host shells cleanly.',
    rating: 4.6,
    badge: 'Enterprise',
  },
];

export type CatalogListStruct = ComponentStruct<
  DemoMsgStruct,
  {
    props: {
      filter: CatalogFilterPayload;
      receivedCount: number;
      items: DemoCatalogItem[];
    };
    msgScope: {
      subscribe: 'CATALOG.FILTER';
    };
  }
>;

export const useCatalogList = (params: ComponentParams<CatalogListStruct>): Component<CatalogListStruct> => {
  let c: Component<CatalogListStruct>;
  let m: ComponentModel<CatalogListStruct>;

  const def: ComponentDef<CatalogListStruct> = {
    regType: 'CatalogList',
    props: {
      filter: { ...DEFAULT_FILTER },
      receivedCount: 0,
      items: prop({
        initialValue: ALL_ITEMS,
        reactive: 'ref',
      }),
    },
    msgBroker: {
      subscribe: {
        'CATALOG.FILTER': {
          in: {
            callback: (msg) => {
              m.filter = { ...msg.payload };
              m.receivedCount += 1;
            },
          },
        },
      },
    },
    view: () => {
      const filterCategory = m.filter.category;
      const minRating = m.filter.minRating ?? 4.0;
      const filterQuery = (m.filter.query || '').trim().toLowerCase();

      const filteredItems = m.items.filter((item) => {
        if (filterCategory && item.category !== filterCategory) {
          return false;
        }
        if (item.rating < minRating) {
          return false;
        }
        if (filterQuery) {
          return (
            item.title.toLowerCase().includes(filterQuery) ||
            item.description.toLowerCase().includes(filterQuery) ||
            item.category.toLowerCase().includes(filterQuery)
          );
        }
        return true;
      });

      return (
        <Card variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'divider', height: '100%' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                  Subscriber Catalog (Island 2)
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Listening to `CATALOG.FILTER` on `@actdim/msgmesh` bus.
                </Typography>
              </Box>
              <Chip
                size="small"
                label={`Received: ${m.receivedCount} event(s)`}
                color="secondary"
                variant="outlined"
              />
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Active Filters:
              </Typography>
              <Chip
                size="small"
                label={filterCategory ? `Category: ${filterCategory}` : 'Category: All'}
                color="primary"
              />
              {m.filter.query && (
                <Chip size="small" label={`Query: "${m.filter.query}"`} variant="outlined" />
              )}
              <Chip size="small" label={`Min Rating: ${minRating.toFixed(1)}`} variant="outlined" />
            </Box>

            <List sx={{ bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider', p: 0 }}>
              {filteredItems.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No items match the active bus filter parameters.
                  </Typography>
                </Box>
              ) : (
                filteredItems.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    <ListItem sx={{ py: 1.5, px: 2 }}>
                      <ListItemText
                        slotProps={{
                          primary: { component: 'div' },
                          secondary: { component: 'div' },
                        }}
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                              {item.title}
                            </Typography>
                            {item.badge && (
                              <Chip label={item.badge} size="small" color="primary" sx={{ height: 20, fontSize: 10 }} />
                            )}
                            <Chip
                              label={`Rating: ${item.rating}`}
                              size="small"
                              color="warning"
                              variant="outlined"
                              sx={{ height: 20, fontSize: 10 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {item.description}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              Category: {item.category}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {idx < filteredItems.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))
              )}
            </List>
          </CardContent>
        </Card>
      );
    },
  };

  c = useComponent(def, params);
  m = c.model;
  return c;
};

export const CatalogList = toReact(useCatalogList);
CatalogList.displayName = 'CatalogList';
