import React from 'react';
import {
  type ComponentStruct,
  type ComponentDef,
  type ComponentParams,
  type Component,
  type ComponentModel,
} from '@actdim/dynstruct/componentModel/contracts';
import { useComponent, toReact } from '@actdim/dynstruct/componentModel/react/hooks';
import { bindProp } from '@actdim/dynstruct/componentModel/core';
import { useTextField, type TextFieldStruct } from '@actdim/dynstruct-mui/TextField';
import { useSelect, type SelectStruct, type SelectOption } from '@actdim/dynstruct-mui/Select';
import { useSlider, type SliderStruct } from '@actdim/dynstruct-mui/Slider';
import { useButton, type ButtonStruct } from '@actdim/dynstruct-mui/Button';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { type DemoMsgStruct, DEFAULT_FILTER } from '../../bus/portalMsgStruct';

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'Architecture', label: 'Architecture' },
  { value: 'Networking', label: 'Networking' },
  { value: 'Performance', label: 'Performance' },
  { value: 'Reactivity', label: 'Reactivity' },
  { value: 'UI', label: 'UI & Design System' },
];

export type CatalogFilterStruct = ComponentStruct<
  DemoMsgStruct,
  {
    props: {
      query: string;
      category: string;
      minRating: number;
      publishedCount: number;
    };
    actions: {
      setQuery: (q: string) => void;
      setCategory: (c: string) => void;
      setMinRating: (r: number) => void;
      reset: () => void;
    };
    children: {
      queryInput: TextFieldStruct;
      categorySelect: SelectStruct;
      ratingSlider: SliderStruct;
      resetBtn: ButtonStruct;
    };
    msgScope: {
      publish: 'CATALOG.FILTER';
    };
  }
>;

export const useCatalogFilter = (params: ComponentParams<CatalogFilterStruct>): Component<CatalogFilterStruct> => {
  let c: Component<CatalogFilterStruct>;
  let m: ComponentModel<CatalogFilterStruct>;

  const publishCurrentFilter = (query: string, category: string, minRating: number) => {
    c.msgBus.send({
      channel: 'CATALOG.FILTER',
      payload: {
        query,
        category: category === 'ALL' ? undefined : category,
        minRating,
      },
    });
    m.publishedCount += 1;
  };

  const def: ComponentDef<CatalogFilterStruct> = {
    regType: 'CatalogFilter',
    props: {
      query: DEFAULT_FILTER.query || '',
      category: DEFAULT_FILTER.category || 'ALL',
      minRating: DEFAULT_FILTER.minRating ?? 4.0,
      publishedCount: 0,
    },
    actions: {
      setQuery: (q: string) => {
        m.query = q;
        publishCurrentFilter(q, m.category, m.minRating);
      },
      setCategory: (cat: string) => {
        m.category = cat;
        publishCurrentFilter(m.query, cat, m.minRating);
      },
      setMinRating: (rating: number) => {
        m.minRating = rating;
        publishCurrentFilter(m.query, m.category, rating);
      },
      reset: () => {
        const nextQuery = DEFAULT_FILTER.query || '';
        const nextCat = DEFAULT_FILTER.category || 'ALL';
        const nextRating = DEFAULT_FILTER.minRating ?? 4.0;
        m.query = nextQuery;
        m.category = nextCat;
        m.minRating = nextRating;
        publishCurrentFilter(nextQuery, nextCat, nextRating);
      },
    },
    children: {
      queryInput: useTextField({
        label: 'Search Titles or Descriptions',
        value: bindProp(() => m, 'query'),
        onChange: (q) => m.setQuery(q),
        placeholder: 'e.g. reactive, ssr, architecture...',
        size: 'small',
        fullWidth: true,
      }),
      categorySelect: useSelect({
        label: 'Filter by Category',
        value: bindProp(() => m, 'category'),
        options: CATEGORY_OPTIONS,
        onChange: (cat) => m.setCategory(cat),
        size: 'small',
        fullWidth: true,
      }),
      ratingSlider: useSlider({
        value: bindProp(() => m, 'minRating'),
        min: 4.0,
        max: 5.0,
        step: 0.1,
        valueLabelDisplay: 'auto',
        onChange: (r) => m.setMinRating(r),
      }),
      resetBtn: useButton({
        variant: 'outlined',
        color: 'inherit',
        label: 'Reset Filters',
        onClick: () => m.reset(),
      }),
    },
    view: () => (
      <Card variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'divider', height: '100%' }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                Filter Controls (Island 1)
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Publishes events to `@actdim/msgmesh` bus without React Context.
              </Typography>
            </Box>
            <Chip
              size="small"
              label={`Published: ${m.publishedCount} event(s)`}
              color="primary"
              variant="outlined"
            />
          </Box>

          <c.children.QueryInput />
          <c.children.CategorySelect />

          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
              Minimum Rating: {m.minRating.toFixed(1)} / 5.0
            </Typography>
            <c.children.RatingSlider />
          </Box>

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 1 }}>
            <c.children.ResetBtn />
          </Box>
        </CardContent>
      </Card>
    ),
  };

  c = useComponent(def, params);
  m = c.model;
  return c;
};

export const CatalogFilter = toReact(useCatalogFilter);
CatalogFilter.displayName = 'CatalogFilter';
