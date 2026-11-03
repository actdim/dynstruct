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
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { type DemoMsgStruct, type DemoCatalogItem } from '../../bus/portalMsgStruct';

export type SsrCatalogStruct = ComponentStruct<
  DemoMsgStruct,
  {
    props: {
      initialItems: DemoCatalogItem[];
      ssrTimestamp: string;
      filterQuery: string;
      sortBy: 'rating' | 'title';
      clientHydrationTime: string | null;
    };
    actions: {
      setFilterQuery: (q: string) => void;
      toggleSort: () => void;
    };
  }
>;

export const useSsrCatalog = (params: ComponentParams<SsrCatalogStruct>): Component<SsrCatalogStruct> => {
  let c: Component<SsrCatalogStruct>;
  let m: ComponentModel<SsrCatalogStruct>;

  const def: ComponentDef<SsrCatalogStruct> = {
    regType: 'SsrCatalog',
    props: {
      initialItems: prop({
        initialValue: [],
        reactive: 'ref',
      }),
      ssrTimestamp: '',
      filterQuery: '',
      sortBy: 'rating',
      clientHydrationTime: null,
    },
    events: {
      onReady: () => {
        m.clientHydrationTime = new Date().toLocaleTimeString();
      },
    },
    actions: {
      setFilterQuery: (q: string) => {
        m.filterQuery = q;
      },
      toggleSort: () => {
        m.sortBy = m.sortBy === 'rating' ? 'title' : 'rating';
      },
    },
    view: () => {
      const query = m.filterQuery.toLowerCase().trim();
      const filtered = query
        ? m.initialItems.filter(
            (it) =>
              it.title.toLowerCase().includes(query) ||
              it.description.toLowerCase().includes(query) ||
              it.category.toLowerCase().includes(query)
          )
        : m.initialItems;

      const visibleItems = [...filtered].sort((a, b) => {
        if (m.sortBy === 'rating') {
          return b.rating - a.rating;
        }
        return a.title.localeCompare(b.title);
      });

      return (
        <Card variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'divider' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Hydration & SSR Audit Badges */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                borderRadius: 1,
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                  SSR Pre-Render & Hydration Status
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Server fetched {m.initialItems.length} records during Astro static/SSR phase (prerendered at build time - SSG).
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  label={`Server Render (SSG): ${m.ssrTimestamp}`}
                  color="primary"
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={
                    m.clientHydrationTime
                      ? `Client Hydrated: ${m.clientHydrationTime}`
                      : 'Client: Pre-Hydration (Static HTML)'
                  }
                  color={m.clientHydrationTime ? 'success' : 'warning'}
                  size="small"
                />
              </Box>
            </Box>

            {/* Interactive Filtering Controls (Active after hydration) */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <Box sx={{ flex: 1, minWidth: 240 }}>
                <TextField
                  label="Client Search (Live Filtering After Hydration)"
                  value={m.filterQuery}
                  onChange={m.setFilterQuery}
                  placeholder="Filter pre-rendered catalog items..."
                  size="small"
                  fullWidth
                />
              </Box>
              <Button
                variant="outlined"
                color="primary"
                label={`Sort by: ${m.sortBy.toUpperCase()}`}
                onClick={m.toggleSort}
                sx={{ textTransform: 'none', height: 40 }}
              />
            </Box>

            {/* Pre-Rendered Crawlable Table */}
            <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: 'background.default' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Topic / Title</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Category</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Rating</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Description (Full Text Crawlable)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleItems.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary', whiteSpace: 'nowrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{item.title}</span>
                          {item.badge && (
                            <Chip label={item.badge} size="small" color="primary" sx={{ height: 18, fontSize: 10 }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{item.category}</TableCell>
                      <TableCell sx={{ color: 'warning.main', fontWeight: 'bold' }}>{item.rating.toFixed(1)} / 5.0</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>{item.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      );
    },
  };

  c = useComponent(def, params);
  m = c.model;
  return c;
};

export const SsrCatalog = toReact(useSsrCatalog);
SsrCatalog.displayName = 'SsrCatalog';
