import React from 'react';
import {
  type ComponentStruct,
  type ComponentDef,
  type ComponentParams,
  type Component,
  type ComponentModel,
} from '@actdim/dynstruct/componentModel/contracts';
import { useComponent, toReact } from '@actdim/dynstruct/componentModel/react/hooks';
import { Box, Card as MuiCard, CardContent, Typography, Divider } from '@mui/material';

// Genuine @actdim/dynstruct-mui components (24 adapters)
import { Button } from '@actdim/dynstruct-mui/Button';
import { IconButton } from '@actdim/dynstruct-mui/IconButton';
import { Fab } from '@actdim/dynstruct-mui/Fab';
import { ToggleButtonGroup } from '@actdim/dynstruct-mui/ToggleButtonGroup';
import { TextField } from '@actdim/dynstruct-mui/TextField';
import { Select } from '@actdim/dynstruct-mui/Select';
import { Checkbox } from '@actdim/dynstruct-mui/Checkbox';
import { Switch } from '@actdim/dynstruct-mui/Switch';
import { Slider } from '@actdim/dynstruct-mui/Slider';
import { RadioGroup } from '@actdim/dynstruct-mui/RadioGroup';
import { Rating } from '@actdim/dynstruct-mui/Rating';
import { Alert } from '@actdim/dynstruct-mui/Alert';
import { Chip } from '@actdim/dynstruct-mui/Chip';
import { Badge } from '@actdim/dynstruct-mui/Badge';
import { Avatar } from '@actdim/dynstruct-mui/Avatar';
import { CircularProgress } from '@actdim/dynstruct-mui/CircularProgress';
import { LinearProgress } from '@actdim/dynstruct-mui/LinearProgress';
import { Skeleton } from '@actdim/dynstruct-mui/Skeleton';
import { Tooltip } from '@actdim/dynstruct-mui/Tooltip';
import { Card } from '@actdim/dynstruct-mui/Card';
import { Accordion } from '@actdim/dynstruct-mui/Accordion';
import { Tabs } from '@actdim/dynstruct-mui/Tabs';
import { Breadcrumbs } from '@actdim/dynstruct-mui/Breadcrumbs';
import { Pagination } from '@actdim/dynstruct-mui/Pagination';

import { type DemoMsgStruct } from '../../bus/portalMsgStruct';

export type ShowcaseCategory = 'actions' | 'inputs' | 'feedback' | 'surfaces';

export type ShowcaseGalleryStruct = ComponentStruct<
  DemoMsgStruct,
  {
    props: {
      activeCategory: ShowcaseCategory;
      showBindingCode: boolean;
      // Actions tab
      buttonClicks: number;
      iconClicks: number;
      fabClicks: number;
      toggleVal: string;
      // Form Inputs tab
      textVal: string;
      selectVal: string;
      checkboxVal: boolean;
      switchVal: boolean;
      sliderVal: number;
      radioVal: string;
      ratingVal: number | null;
      // Feedback tab
      alertVisible: boolean;
      badgeCount: number;
      progressVal: number;
      chipCount: number;
      // Surfaces tab
      accordionExpanded: boolean;
      tabsVal: string;
      pageVal: number;
    };
    actions: {
      setCategory: (cat: ShowcaseCategory) => void;
      toggleBindingCode: () => void;
      incrementButtonClicks: () => void;
      incrementIconClicks: () => void;
      incrementFabClicks: () => void;
      setToggleVal: (val: string | string[]) => void;
      setTextVal: (val: string) => void;
      setSelectVal: (val: string) => void;
      setCheckboxVal: (val: boolean) => void;
      setSwitchVal: (val: boolean) => void;
      setSliderVal: (val: number) => void;
      setRadioVal: (val: string) => void;
      setRatingVal: (val: number | null) => void;
      toggleAlert: () => void;
      incrementBadgeCount: () => void;
      incrementChipCount: () => void;
      setAccordionExpanded: (expanded: boolean) => void;
      setTabsVal: (val: string) => void;
      setPageVal: (page: number) => void;
    };
  }
>;

const CODE_EXAMPLES: Record<ShowcaseCategory, string> = {
  actions: `// 1. Declare pure TypeScript ComponentStruct contract
export type ActionsStruct = ComponentStruct<BaseAppMsgStruct, {
  props: { buttonClicks: number; toggleVal: string };
  actions: { increment: () => void; setAlignment: (val: string | string[]) => void };
}>;

// 2. Define component model with reactive props & actions
const def: ComponentDef<ActionsStruct> = {
  regType: 'ActionsDemo',
  props: { buttonClicks: 0, toggleVal: 'left' },
  actions: {
    increment: () => { m.buttonClicks += 1; },
    setAlignment: (v) => { if (typeof v === 'string') m.toggleVal = v; },
  },
  view: () => (
    <Box sx={{ display: 'flex', gap: 2 }}>
      {/* Dynstruct-MUI Button bound to model action */}
      <Button label="Execute Action" variant="contained" onClick={m.increment} />
      {/* Dynstruct-MUI ToggleButtonGroup bound to model property */}
      <ToggleButtonGroup
        value={m.toggleVal}
        onChange={m.setAlignment}
        exclusive
        items={[
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
        ]}
      />
    </Box>
  ),
};`,
  inputs: `// 1. Declare contract with form values and setter actions
export type FormInputsStruct = ComponentStruct<BaseAppMsgStruct, {
  props: { text: string; role: string; enabled: boolean; priority: number; rating: number | null };
  actions: {
    setText: (v: string) => void;
    setRole: (v: string) => void;
    setEnabled: (v: boolean) => void;
    setPriority: (v: number) => void;
    setRating: (v: number | null) => void;
  };
}>;

// 2. Pure reactive model: changes trigger targeted MobX re-renders
const def: ComponentDef<FormInputsStruct> = {
  regType: 'FormInputsDemo',
  props: { text: 'Title', role: 'admin', enabled: true, priority: 75, rating: 4 },
  actions: {
    setText: (v) => { m.text = v; },
    setRole: (v) => { m.role = v; },
    setEnabled: (v) => { m.enabled = v; },
    setPriority: (v) => { m.priority = v; },
    setRating: (v) => { m.rating = v; },
  },
  view: () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField label="Title" value={m.text} onChange={m.setText} />
      <Select label="Role" value={m.role} onChange={m.setRole} options={ROLE_OPTIONS} />
      <Switch label="Active Status" checked={m.enabled} onChange={m.setEnabled} />
      <Slider value={m.priority} onChange={m.setPriority} min={0} max={100} />
      <Rating value={m.rating} onChange={m.setRating} />
    </Box>
  ),
};`,
  feedback: `// 1. Declare feedback indicator contract
export type FeedbackIndicatorsStruct = ComponentStruct<BaseAppMsgStruct, {
  props: { count: number; alertVisible: boolean; status: string };
  actions: { toggleAlert: () => void; incrementCount: () => void };
}>;

// 2. Define component model
const def: ComponentDef<FeedbackIndicatorsStruct> = {
  regType: 'FeedbackDemo',
  props: { count: 3, alertVisible: true, status: 'System Operational' },
  actions: {
    toggleAlert: () => { m.alertVisible = !m.alertVisible; },
    incrementCount: () => { m.count += 1; },
  },
  view: () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {m.alertVisible && (
        <Alert severity="success" message={m.status} onClose={m.toggleAlert} />
      )}
      <Badge badgeContent={m.count} color="primary">
        {() => <Avatar alt="User">JD</Avatar>}
      </Badge>
      <Tooltip title="Fine-grained Dynstruct Chip indicator">
        {() => <Chip label={\`Counter: \${m.count}\`} onClick={m.incrementCount} color="secondary" />}
      </Tooltip>
      <LinearProgress variant="determinate" value={m.count * 10} />
    </Box>
  ),
};`,
  surfaces: `// 1. Declare surfaces & navigation contract
export type SurfacesNavStruct = ComponentStruct<BaseAppMsgStruct, {
  props: { currentTab: string; page: number; isExpanded: boolean };
  actions: {
    setCurrentTab: (t: string) => void;
    setPage: (p: number) => void;
    toggleAccordion: (expanded: boolean) => void;
  };
}>;

// 2. Define component model
const def: ComponentDef<SurfacesNavStruct> = {
  regType: 'SurfacesDemo',
  props: { currentTab: 'overview', page: 1, isExpanded: true },
  actions: {
    setCurrentTab: (t) => { m.currentTab = t; },
    setPage: (p) => { m.page = p; },
    toggleAccordion: (e) => { m.isExpanded = e; },
  },
  view: () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Dynstruct-MUI Tabs */}
      <Tabs value={m.currentTab} onChange={m.setCurrentTab} tabs={NAV_TABS} />
      {/* Dynstruct-MUI Accordion */}
      <Accordion
        summary="Architecture & Wiring"
        expanded={m.isExpanded}
        onChange={m.toggleAccordion}
        content={() => <Typography variant="body2">Dynstruct decouples views from state.</Typography>}
      />
      {/* Dynstruct-MUI Pagination */}
      <Pagination count={10} page={m.page} onChange={m.setPage} color="primary" />
    </Box>
  ),
};`,
};

export const useShowcaseGallery = (
  params: ComponentParams<ShowcaseGalleryStruct>
): Component<ShowcaseGalleryStruct> => {
  let c: Component<ShowcaseGalleryStruct>;
  let m: ComponentModel<ShowcaseGalleryStruct>;

  const def: ComponentDef<ShowcaseGalleryStruct> = {
    regType: 'ShowcaseGallery',
    props: {
      activeCategory: 'actions',
      showBindingCode: false,
      buttonClicks: 0,
      iconClicks: 0,
      fabClicks: 0,
      toggleVal: 'center',
      textVal: 'Reactive Dynstruct Model Input',
      selectVal: 'two',
      checkboxVal: true,
      switchVal: true,
      sliderVal: 65,
      radioVal: 'managed',
      ratingVal: 4,
      alertVisible: true,
      badgeCount: 3,
      progressVal: 70,
      chipCount: 0,
      accordionExpanded: true,
      tabsVal: 'tab1',
      pageVal: 1,
    },
    actions: {
      setCategory: (cat: ShowcaseCategory) => {
        m.activeCategory = cat;
      },
      toggleBindingCode: () => {
        m.showBindingCode = !m.showBindingCode;
      },
      incrementButtonClicks: () => {
        m.buttonClicks += 1;
      },
      incrementIconClicks: () => {
        m.iconClicks += 1;
      },
      incrementFabClicks: () => {
        m.fabClicks += 1;
      },
      setToggleVal: (val: string | string[]) => {
        if (typeof val === 'string') {
          m.toggleVal = val;
        }
      },
      setTextVal: (val: string) => {
        m.textVal = val;
      },
      setSelectVal: (val: string) => {
        m.selectVal = val;
      },
      setCheckboxVal: (val: boolean) => {
        m.checkboxVal = val;
      },
      setSwitchVal: (val: boolean) => {
        m.switchVal = val;
      },
      setSliderVal: (val: number) => {
        m.sliderVal = val;
      },
      setRadioVal: (val: string) => {
        m.radioVal = val;
      },
      setRatingVal: (val: number | null) => {
        m.ratingVal = val;
      },
      toggleAlert: () => {
        m.alertVisible = !m.alertVisible;
      },
      incrementBadgeCount: () => {
        m.badgeCount += 1;
      },
      incrementChipCount: () => {
        m.chipCount += 1;
      },
      setAccordionExpanded: (expanded: boolean) => {
        m.accordionExpanded = expanded;
      },
      setTabsVal: (val: string) => {
        m.tabsVal = val;
      },
      setPageVal: (page: number) => {
        m.pageVal = page;
      },
    },
    view: () => {
      const selectOptions = [
        { value: 'one', label: 'Standard Option (One)' },
        { value: 'two', label: 'Advanced Option (Two)' },
        { value: 'three', label: 'Enterprise Option (Three)' },
      ];

      const radioOptions = [
        { value: 'managed', label: 'Managed Component Model' },
        { value: 'controlled', label: 'Controlled Parent Binding' },
        { value: 'uncontrolled', label: 'Autonomous Struct' },
      ];

      const toggleItems = [
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ];

      const showcaseTabs = [
        { value: 'actions', label: 'Actions & Buttons' },
        { value: 'inputs', label: 'Form Controls & Inputs' },
        { value: 'feedback', label: 'Feedback & Indicators' },
        { value: 'surfaces', label: 'Surfaces & Navigation' },
      ];

      const innerTabs = [
        { value: 'tab1', label: 'Overview Panel' },
        { value: 'tab2', label: 'Contract Schema' },
        { value: 'tab3', label: 'Bus Wire Log' },
      ];

      const breadcrumbItems = [
        { label: 'Portal', href: '#' },
        { label: 'Component Gallery', href: '#' },
        { label: m.activeCategory.toUpperCase() },
      ];

      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Top Category Tabs via @actdim/dynstruct-mui/Tabs */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: 300 }}>
              <Tabs
                value={m.activeCategory}
                onChange={(v) => m.setCategory(v as ShowcaseCategory)}
                tabs={showcaseTabs}
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              />
            </Box>

            {/* Code Toggle Button */}
            <Button
              label={m.showBindingCode ? 'Hide Binding Pattern' : 'View Binding Pattern'}
              variant="outlined"
              color="primary"
              onClick={m.toggleBindingCode}
              sx={{ height: 38 }}
            />
          </Box>

          {/* Collapsible Binding Code Panel */}
          {m.showBindingCode && (
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
                Dynstruct Canonical Binding Pattern for {m.activeCategory.toUpperCase()}:
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
                Notice the complete absence of React useState hooks. State resides strictly in ComponentDef.props and updates via typed ComponentDef.actions.
              </Typography>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 2,
                  borderRadius: 1,
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                  overflowX: 'auto',
                  fontFamily: 'monospace',
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: 'text.primary',
                }}
              >
                <code>{CODE_EXAMPLES[m.activeCategory]}</code>
              </Box>
            </Box>
          )}

          {/* TAB 1: Actions & Buttons */}
          {m.activeCategory === 'actions' && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {/* Button Variants */}
              <MuiCard variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'divider' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Button Adapters (@actdim/dynstruct-mui/Button)
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    <Button
                      label="Primary Contained"
                      variant="contained"
                      color="primary"
                      onClick={m.incrementButtonClicks}
                    />
                    <Button
                      label="Secondary Outlined"
                      variant="outlined"
                      color="secondary"
                      onClick={m.incrementButtonClicks}
                    />
                    <Button
                      label="Success Action"
                      variant="contained"
                      color="success"
                      onClick={m.incrementButtonClicks}
                    />
                    <Button
                      label="Error Action"
                      variant="outlined"
                      color="error"
                      onClick={m.incrementButtonClicks}
                    />
                    <Button label="Disabled Button" variant="contained" disabled />
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Model-tracked Button Click Events: <strong>{m.buttonClicks}</strong>
                  </Typography>
                </CardContent>
              </MuiCard>

              {/* IconButton, Fab & ToggleButtonGroup */}
              <MuiCard variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'divider' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Icon Controls & Toggle Groups
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    {/* IconButton */}
                    <IconButton
                      title="Favorite Star"
                      color="primary"
                      onClick={m.incrementIconClicks}
                      icon={<span>&#9733;</span>}
                    />
                    {/* Fab */}
                    <Fab
                      ariaLabel="Add Item"
                      color="secondary"
                      size="medium"
                      onClick={m.incrementFabClicks}
                      icon={() => <span>+</span>}
                    />
                    {/* ToggleButtonGroup */}
                    <ToggleButtonGroup
                      value={m.toggleVal}
                      onChange={m.setToggleVal}
                      items={toggleItems}
                      exclusive
                      color="primary"
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Icon clicks: <strong>{m.iconClicks}</strong> | FAB clicks: <strong>{m.fabClicks}</strong> | Selected Alignment: <strong>{m.toggleVal}</strong>
                  </Typography>
                </CardContent>
              </MuiCard>
            </Box>
          )}

          {/* TAB 2: Form Controls & Inputs */}
          {m.activeCategory === 'inputs' && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {/* Text & Select Controls */}
              <MuiCard variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'divider' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Text & Select Inputs
                  </Typography>
                  <TextField
                    label="Model-Bound Text Input"
                    value={m.textVal}
                    onChange={m.setTextVal}
                    fullWidth
                    size="small"
                  />
                  <Select
                    label="Model-Bound Selection"
                    value={m.selectVal}
                    onChange={m.setSelectVal}
                    options={selectOptions}
                    fullWidth
                    size="small"
                  />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Current Text: <code>"{m.textVal}"</code> | Current Select: <code>"{m.selectVal}"</code>
                  </Typography>
                </CardContent>
              </MuiCard>

              {/* Toggles, Sliders & Radios */}
              <MuiCard variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'divider' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Switches, Checkboxes & Ratings
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    <Checkbox
                      label="Active Checkbox"
                      checked={m.checkboxVal}
                      onChange={m.setCheckboxVal}
                    />
                    <Switch
                      label="Reactive Switch"
                      checked={m.switchVal}
                      onChange={m.setSwitchVal}
                    />
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Slider Intensity Value: {m.sliderVal}%
                    </Typography>
                    <Slider
                      value={m.sliderVal}
                      onChange={m.setSliderVal}
                      min={0}
                      max={100}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Star Rating:
                    </Typography>
                    <Rating value={m.ratingVal} onChange={m.setRatingVal} />
                  </Box>
                  <RadioGroup
                    label="Composition Architecture"
                    value={m.radioVal}
                    onChange={m.setRadioVal}
                    options={radioOptions}
                    row
                  />
                </CardContent>
              </MuiCard>
            </Box>
          )}

          {/* TAB 3: Feedback & Indicators */}
          {m.activeCategory === 'feedback' && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {/* Alerts & Tooltips */}
              <MuiCard variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'divider' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Alerts, Badges & Tooltips
                  </Typography>
                  {m.alertVisible ? (
                    <Alert
                      severity="success"
                      message="Dynstruct component model: fine-grained MobX state with Zero useState hooks."
                      onClose={m.toggleAlert}
                    />
                  ) : (
                    <Button
                      label="Restore Alert Banner"
                      variant="outlined"
                      size="small"
                      onClick={m.toggleAlert}
                    />
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 1 }}>
                    <Badge badgeContent={m.badgeCount} color="primary">
                      {() => <Avatar alt="Dynstruct User">DS</Avatar>}
                    </Badge>
                    <Tooltip title="Click to increment badge count in Dynstruct model">
                      {() => (
                        <Button
                          label="Increment Badge"
                          size="small"
                          variant="outlined"
                          onClick={m.incrementBadgeCount}
                        />
                      )}
                    </Tooltip>
                    <Chip
                      label={`Interactive Chip: ${m.chipCount}`}
                      color="primary"
                      variant="outlined"
                      onClick={m.incrementChipCount}
                    />
                  </Box>
                </CardContent>
              </MuiCard>

              {/* Progress & Skeletons */}
              <MuiCard variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'divider' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Loading & Skeleton Indicators
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <CircularProgress color="primary" size={32} />
                    <CircularProgress variant="determinate" value={m.progressVal} color="secondary" size={32} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Determinate: {m.progressVal}%
                    </Typography>
                  </Box>
                  <Box sx={{ width: '100%', mt: 1 }}>
                    <LinearProgress variant="determinate" value={m.progressVal} color="primary" />
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Pre-Hydration Skeleton Placeholders:
                  </Typography>
                  <Skeleton variant="text" width="80%" height={24} />
                  <Skeleton variant="rounded" width="100%" height={40} />
                </CardContent>
              </MuiCard>
            </Box>
          )}

          {/* TAB 4: Surfaces & Navigation */}
          {m.activeCategory === 'surfaces' && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {/* Card & Breadcrumbs */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Breadcrumbs items={breadcrumbItems} />
                <Card
                  title="Declarative Dynstruct Card Adapter"
                  subheader="Adapted from @actdim/dynstruct-mui/Card"
                  content={() => (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Cards package header, actions, and body content into contract-defined slots without prop drilling.
                    </Typography>
                  )}
                  actions={() => (
                    <Box sx={{ display: 'flex', gap: 1, p: 1 }}>
                      <Button label="Read Docs" size="small" variant="text" />
                      <Button label="View Source" size="small" variant="outlined" />
                    </Box>
                  )}
                />
              </Box>

              {/* Accordion, Tabs & Pagination */}
              <MuiCard variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'divider' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Surfaces & Pagination
                  </Typography>
                  <Tabs value={m.tabsVal} onChange={m.setTabsVal} tabs={innerTabs} />
                  <Accordion
                    summary="Architecture Specification Details"
                    expanded={m.accordionExpanded}
                    onChange={m.setAccordionExpanded}
                    content={() => (
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Dynstruct enforces separation of concerns: contracts define the interface, models implement reactive logic, and views render UI adapters without local React hooks.
                      </Typography>
                    )}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                    <Pagination
                      count={5}
                      page={m.pageVal}
                      onChange={m.setPageVal}
                      color="primary"
                    />
                  </Box>
                </CardContent>
              </MuiCard>
            </Box>
          )}
        </Box>
      );
    },
  };

  c = useComponent(def, params);
  m = c.model;
  return c;
};

export const ShowcaseGallery = toReact(useShowcaseGallery);
ShowcaseGallery.displayName = 'ShowcaseGallery';
