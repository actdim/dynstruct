import React from 'react';
import {
  type ComponentStruct,
  type ComponentDef,
  type ComponentParams,
  type Component,
  type ComponentModel,
} from '@actdim/dynstruct/componentModel/contracts';
import { useComponent, toReact } from '@actdim/dynstruct/componentModel/react/hooks';
import { bind, bindProp } from '@actdim/dynstruct/componentModel/core';
import { Box, Card as MuiCard, CardContent, Typography, Divider } from '@mui/material';

// Genuine @actdim/dynstruct-mui components (24 adapters)
import { useButton, type ButtonStruct } from '@actdim/dynstruct-mui/Button';
import { useIconButton, type IconButtonStruct } from '@actdim/dynstruct-mui/IconButton';
import { useFab, type FabStruct } from '@actdim/dynstruct-mui/Fab';
import { useToggleButtonGroup, type ToggleButtonGroupStruct } from '@actdim/dynstruct-mui/ToggleButtonGroup';
import { useTextField, type TextFieldStruct } from '@actdim/dynstruct-mui/TextField';
import { useSelect, type SelectStruct, type SelectOption } from '@actdim/dynstruct-mui/Select';
import { useCheckbox, type CheckboxStruct } from '@actdim/dynstruct-mui/Checkbox';
import { useSwitch, type SwitchStruct } from '@actdim/dynstruct-mui/Switch';
import { useSlider, type SliderStruct } from '@actdim/dynstruct-mui/Slider';
import { useRadioGroup, type RadioGroupStruct, type RadioOption } from '@actdim/dynstruct-mui/RadioGroup';
import { useRating, type RatingStruct } from '@actdim/dynstruct-mui/Rating';
import { useAlert, type AlertStruct } from '@actdim/dynstruct-mui/Alert';
import { useChip, type ChipStruct } from '@actdim/dynstruct-mui/Chip';
import { useBadge, type BadgeStruct } from '@actdim/dynstruct-mui/Badge';
import { useAvatar, type AvatarStruct } from '@actdim/dynstruct-mui/Avatar';
import { useCircularProgress, type CircularProgressStruct } from '@actdim/dynstruct-mui/CircularProgress';
import { useLinearProgress, type LinearProgressStruct } from '@actdim/dynstruct-mui/LinearProgress';
import { useSkeleton, type SkeletonStruct } from '@actdim/dynstruct-mui/Skeleton';
import { useTooltip, type TooltipStruct } from '@actdim/dynstruct-mui/Tooltip';
import { useCard, type CardStruct } from '@actdim/dynstruct-mui/Card';
import { useAccordion, type AccordionStruct } from '@actdim/dynstruct-mui/Accordion';
import { useTabs, type TabsStruct, type TabItem } from '@actdim/dynstruct-mui/Tabs';
import { useBreadcrumbs, type BreadcrumbsStruct, type BreadcrumbItem } from '@actdim/dynstruct-mui/Breadcrumbs';
import { usePagination, type PaginationStruct } from '@actdim/dynstruct-mui/Pagination';

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
    children: {
      categoryTabs: TabsStruct;
      toggleCodeBtn: ButtonStruct;

      // Actions
      btnContained: ButtonStruct;
      btnOutlined: ButtonStruct;
      btnSuccess: ButtonStruct;
      btnError: ButtonStruct;
      btnDisabled: ButtonStruct;
      iconBtn: IconButtonStruct;
      fab: FabStruct;
      toggleGroup: ToggleButtonGroupStruct;

      // Inputs
      textField: TextFieldStruct;
      select: SelectStruct;
      checkbox: CheckboxStruct;
      switchInput: SwitchStruct;
      slider: SliderStruct;
      rating: RatingStruct;
      radioGroup: RadioGroupStruct;

      // Feedback
      alertBanner: AlertStruct;
      restoreAlertBtn: ButtonStruct;
      userAvatar: AvatarStruct;
      badge: BadgeStruct;
      badgeIncBtn: ButtonStruct;
      tooltip: TooltipStruct;
      chip: ChipStruct;
      circularProgress: CircularProgressStruct;
      circularProgressDet: CircularProgressStruct;
      linearProgress: LinearProgressStruct;
      skeletonText: SkeletonStruct;
      skeletonRect: SkeletonStruct;

      // Surfaces
      breadcrumbs: BreadcrumbsStruct;
      cardReadDocsBtn: ButtonStruct;
      cardViewSourceBtn: ButtonStruct;
      card: CardStruct;
      innerTabs: TabsStruct;
      accordion: AccordionStruct;
      pagination: PaginationStruct;
    };
  }
>;

const CODE_EXAMPLES: Record<ShowcaseCategory, string> = {
  actions: `// 1. Declare pure TypeScript ComponentStruct contract with children
export type ActionsStruct = ComponentStruct<BaseAppMsgStruct, {
  props: { buttonClicks: number; toggleVal: string };
  actions: { increment: () => void; setAlignment: (val: string | string[]) => void };
  children: {
    actionBtn: ButtonStruct;
    alignment: ToggleButtonGroupStruct;
  };
}>;

// 2. Define component model with hooks in children and prop-less JSX in view
const def: ComponentDef<ActionsStruct> = {
  regType: 'ActionsDemo',
  props: { buttonClicks: 0, toggleVal: 'left' },
  actions: {
    increment: () => { m.buttonClicks += 1; },
    setAlignment: (v) => { if (typeof v === 'string') m.toggleVal = v; },
  },
  children: {
    // Bindings and handlers configured during child hook initialization
    actionBtn: useButton({
      label: 'Execute Action',
      variant: 'contained',
      onClick: () => m.increment(),
    }),
    alignment: useToggleButtonGroup({
      value: bindProp(() => m, 'toggleVal'),
      onChange: (v) => m.setAlignment(v),
      exclusive: true,
      items: [
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ],
    }),
  },
  // View is strictly lightweight layout markup with zero inline props
  view: () => (
    <div className="flex gap-2">
      <c.children.ActionBtn />
      <c.children.Alignment />
    </div>
  ),
};`,
  inputs: `// 1. Declare contract with form values, mutators, and child controls
export type FormInputsStruct = ComponentStruct<BaseAppMsgStruct, {
  props: { text: string; role: string; enabled: boolean; priority: number; rating: number | null };
  actions: {
    setText: (v: string) => void;
    setRole: (v: string) => void;
    setEnabled: (v: boolean) => void;
    setPriority: (v: number) => void;
    setRating: (v: number | null) => void;
  };
  children: {
    titleInput: TextFieldStruct;
    roleSelect: SelectStruct;
    statusSwitch: SwitchStruct;
    prioritySlider: SliderStruct;
    starRating: RatingStruct;
  };
}>;

// 2. Pure reactive model: bindings update target models without re-render cascades
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
  children: {
    titleInput: useTextField({
      label: 'Title',
      value: bindProp(() => m, 'text'),
      onChange: (v) => m.setText(v),
    }),
    roleSelect: useSelect({
      label: 'Role',
      value: bindProp(() => m, 'role'),
      onChange: (v) => m.setRole(v),
      options: ROLE_OPTIONS,
    }),
    statusSwitch: useSwitch({
      label: 'Active Status',
      checked: bindProp(() => m, 'enabled'),
      onChange: (v) => m.setEnabled(v),
    }),
    prioritySlider: useSlider({
      value: bindProp(() => m, 'priority'),
      onChange: (v) => m.setPriority(v),
      min: 0,
      max: 100,
    }),
    starRating: useRating({
      value: bindProp(() => m, 'rating'),
      onChange: (v) => m.setRating(v),
    }),
  },
  // View is prop-less: only layout and tag references
  view: () => (
    <div className="flex flex-col gap-2">
      <c.children.TitleInput />
      <c.children.RoleSelect />
      <c.children.StatusSwitch />
      <c.children.PrioritySlider />
      <c.children.StarRating />
    </div>
  ),
};`,
  feedback: `// 1. Declare feedback indicator contract and children
export type FeedbackIndicatorsStruct = ComponentStruct<BaseAppMsgStruct, {
  props: { count: number; alertVisible: boolean; status: string };
  actions: { toggleAlert: () => void; incrementCount: () => void };
  children: {
    alert: AlertStruct;
    userAvatar: AvatarStruct;
    badge: BadgeStruct;
    chip: ChipStruct;
    progress: LinearProgressStruct;
  };
}>;

// 2. Define component model
const def: ComponentDef<FeedbackIndicatorsStruct> = {
  regType: 'FeedbackDemo',
  props: { count: 3, alertVisible: true, status: 'System Operational' },
  actions: {
    toggleAlert: () => { m.alertVisible = !m.alertVisible; },
    incrementCount: () => { m.count += 1; },
  },
  children: {
    alert: useAlert({
      severity: 'success',
      message: bind(() => m.status),
      onClose: () => m.toggleAlert(),
    }),
    userAvatar: useAvatar({ alt: 'User', children: 'JD' }),
    badge: useBadge({
      badgeContent: bindProp(() => m, 'count'),
      color: 'primary',
      children: () => <c.children.UserAvatar />,
    }),
    chip: useChip({
      label: bind(() => \`Counter: \${m.count}\`),
      onClick: () => m.incrementCount(),
      color: 'secondary',
    }),
    progress: useLinearProgress({
      variant: 'determinate',
      value: bind(() => m.count * 10),
    }),
  },
  // Clean prop-free view
  view: () => (
    <div className="flex flex-col gap-2">
      {m.alertVisible && <c.children.Alert />}
      <c.children.Badge />
      <c.children.Chip />
      <c.children.Progress />
    </div>
  ),
};`,
  surfaces: `// 1. Declare surfaces & navigation contract with children
export type SurfacesNavStruct = ComponentStruct<BaseAppMsgStruct, {
  props: { currentTab: string; page: number; isExpanded: boolean };
  actions: {
    setCurrentTab: (t: string) => void;
    setPage: (p: number) => void;
    toggleAccordion: (expanded: boolean) => void;
  };
  children: {
    tabs: TabsStruct;
    accordion: AccordionStruct;
    pagination: PaginationStruct;
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
  children: {
    // Child adapters instantiated with two-way and one-way bindings
    tabs: useTabs({
      value: bindProp(() => m, 'currentTab'),
      onChange: (t) => m.setCurrentTab(t),
      tabs: NAV_TABS,
    }),
    accordion: useAccordion({
      summary: 'Architecture & Wiring',
      expanded: bindProp(() => m, 'isExpanded'),
      onChange: (e) => m.toggleAccordion(e),
      content: () => <Typography variant="body2">Dynstruct decouples views from state.</Typography>,
    }),
    pagination: usePagination({
      count: 10,
      page: bindProp(() => m, 'page'),
      onChange: (p) => m.setPage(p),
      color: 'primary',
    }),
  },
  // In view: only layout wrappers and clean <c.children.Name />
  view: () => (
    <div className="flex flex-col gap-3">
      <c.children.Tabs />
      <c.children.Accordion />
      <c.children.Pagination />
    </div>
  ),
};`,
};

export const useShowcaseGallery = (
  params: ComponentParams<ShowcaseGalleryStruct>
): Component<ShowcaseGalleryStruct> => {
  let c: Component<ShowcaseGalleryStruct>;
  let m: ComponentModel<ShowcaseGalleryStruct>;

  const selectOptions: SelectOption[] = [
    { value: 'one', label: 'Standard Option (One)' },
    { value: 'two', label: 'Advanced Option (Two)' },
    { value: 'three', label: 'Enterprise Option (Three)' },
  ];

  const radioOptions: RadioOption[] = [
    { value: 'managed', label: 'Managed Component Model' },
    { value: 'controlled', label: 'Controlled Parent Binding' },
    { value: 'uncontrolled', label: 'Autonomous Struct' },
  ];

  const toggleItems = [
    { value: 'left', label: 'Left' },
    { value: 'center', label: 'Center' },
    { value: 'right', label: 'Right' },
  ];

  const showcaseTabs: TabItem[] = [
    { value: 'actions', label: 'Actions & Buttons' },
    { value: 'inputs', label: 'Form Controls & Inputs' },
    { value: 'feedback', label: 'Feedback & Indicators' },
    { value: 'surfaces', label: 'Surfaces & Navigation' },
  ];

  const innerTabs: TabItem[] = [
    { value: 'tab1', label: 'Overview Panel' },
    { value: 'tab2', label: 'Contract Schema' },
    { value: 'tab3', label: 'Bus Wire Log' },
  ];

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Portal', href: '#' },
    { label: 'Component Gallery', href: '#' },
    { label: 'SURFACES' },
  ];

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
    children: {
      categoryTabs: useTabs({
        tabs: showcaseTabs,
        value: bindProp(() => m, 'activeCategory'),
        onChange: (v) => m.setCategory(v as ShowcaseCategory),
        sx: { borderBottom: 1, borderColor: 'divider' },
      }),
      toggleCodeBtn: useButton({
        label: bind(() => (m.showBindingCode ? 'Hide Binding Pattern' : 'View Binding Pattern')),
        variant: 'outlined',
        color: 'primary',
        onClick: () => m.toggleBindingCode(),
        sx: { height: 38 },
      }),

      // Actions
      btnContained: useButton({
        label: 'Primary Contained',
        variant: 'contained',
        color: 'primary',
        onClick: () => m.incrementButtonClicks(),
      }),
      btnOutlined: useButton({
        label: 'Secondary Outlined',
        variant: 'outlined',
        color: 'secondary',
        onClick: () => m.incrementButtonClicks(),
      }),
      btnSuccess: useButton({
        label: 'Success Action',
        variant: 'contained',
        color: 'success',
        onClick: () => m.incrementButtonClicks(),
      }),
      btnError: useButton({
        label: 'Error Action',
        variant: 'outlined',
        color: 'error',
        onClick: () => m.incrementButtonClicks(),
      }),
      btnDisabled: useButton({
        label: 'Disabled Button',
        variant: 'contained',
        disabled: true,
      }),
      iconBtn: useIconButton({
        title: 'Favorite Star',
        color: 'primary',
        onClick: () => m.incrementIconClicks(),
        icon: <span>&#9733;</span>,
      }),
      fab: useFab({
        ariaLabel: 'Add Item',
        color: 'secondary',
        size: 'medium',
        onClick: () => m.incrementFabClicks(),
        icon: () => <span>+</span>,
      }),
      toggleGroup: useToggleButtonGroup({
        value: bindProp(() => m, 'toggleVal'),
        onChange: (v) => m.setToggleVal(v),
        items: toggleItems,
        exclusive: true,
        color: 'primary',
      }),

      // Inputs
      textField: useTextField({
        label: 'Model-Bound Text Input',
        value: bindProp(() => m, 'textVal'),
        onChange: (v) => m.setTextVal(v),
        fullWidth: true,
        size: 'small',
      }),
      select: useSelect({
        label: 'Model-Bound Selection',
        value: bindProp(() => m, 'selectVal'),
        onChange: (v) => m.setSelectVal(v),
        options: selectOptions,
        fullWidth: true,
        size: 'small',
      }),
      checkbox: useCheckbox({
        label: 'Active Checkbox',
        checked: bindProp(() => m, 'checkboxVal'),
        onChange: (v) => m.setCheckboxVal(v),
      }),
      switchInput: useSwitch({
        label: 'Reactive Switch',
        checked: bindProp(() => m, 'switchVal'),
        onChange: (v) => m.setSwitchVal(v),
      }),
      slider: useSlider({
        value: bindProp(() => m, 'sliderVal'),
        onChange: (v) => m.setSliderVal(v),
        min: 0,
        max: 100,
      }),
      rating: useRating({
        value: bindProp(() => m, 'ratingVal'),
        onChange: (v) => m.setRatingVal(v),
      }),
      radioGroup: useRadioGroup({
        label: 'Composition Architecture',
        value: bindProp(() => m, 'radioVal'),
        onChange: (v) => m.setRadioVal(v),
        options: radioOptions,
        row: true,
      }),

      // Feedback
      alertBanner: useAlert({
        severity: 'success',
        message: 'Dynstruct component model: fine-grained reactive state with Zero useState hooks.',
        onClose: () => m.toggleAlert(),
      }),
      restoreAlertBtn: useButton({
        label: 'Restore Alert Banner',
        variant: 'outlined',
        size: 'small',
        onClick: () => m.toggleAlert(),
      }),
      userAvatar: useAvatar({
        alt: 'Dynstruct User',
        children: 'DS',
      }),
      badge: useBadge({
        badgeContent: bindProp(() => m, 'badgeCount'),
        color: 'primary',
        children: () => <c.children.UserAvatar />,
      }),
      badgeIncBtn: useButton({
        label: 'Increment Badge',
        size: 'small',
        variant: 'outlined',
        onClick: () => m.incrementBadgeCount(),
      }),
      tooltip: useTooltip({
        title: 'Click to increment badge count in Dynstruct model',
        children: () => <c.children.BadgeIncBtn />,
      }),
      chip: useChip({
        label: bind(() => `Interactive Chip: ${m.chipCount}`),
        color: 'primary',
        variant: 'outlined',
        onClick: () => m.incrementChipCount(),
      }),
      circularProgress: useCircularProgress({
        color: 'primary',
        size: 32,
      }),
      circularProgressDet: useCircularProgress({
        variant: 'determinate',
        value: bindProp(() => m, 'progressVal'),
        color: 'secondary',
        size: 32,
      }),
      linearProgress: useLinearProgress({
        variant: 'determinate',
        value: bindProp(() => m, 'progressVal'),
        color: 'primary',
      }),
      skeletonText: useSkeleton({
        variant: 'text',
        width: '80%',
        height: 24,
      }),
      skeletonRect: useSkeleton({
        variant: 'rounded',
        width: '100%',
        height: 40,
      }),

      // Surfaces
      breadcrumbs: useBreadcrumbs({
        items: breadcrumbItems,
      }),
      cardReadDocsBtn: useButton({
        label: 'Read Docs',
        size: 'small',
        variant: 'text',
      }),
      cardViewSourceBtn: useButton({
        label: 'View Source',
        size: 'small',
        variant: 'outlined',
      }),
      card: useCard({
        title: 'Declarative Dynstruct Card Adapter',
        subheader: 'Adapted from @actdim/dynstruct-mui/Card',
        content: () => (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Cards package header, actions, and body content into contract-defined slots without prop drilling.
          </Typography>
        ),
        actions: () => (
          <Box sx={{ display: 'flex', gap: 1, p: 1 }}>
            <c.children.CardReadDocsBtn />
            <c.children.CardViewSourceBtn />
          </Box>
        ),
      }),
      innerTabs: useTabs({
        value: bindProp(() => m, 'tabsVal'),
        onChange: (v) => m.setTabsVal(v),
        tabs: innerTabs,
      }),
      accordion: useAccordion({
        summary: 'Architecture Specification Details',
        expanded: bindProp(() => m, 'accordionExpanded'),
        onChange: (v) => m.setAccordionExpanded(v),
        content: () => (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Dynstruct enforces separation of concerns: contracts define the interface, models implement reactive logic, and views render UI adapters without local React hooks.
          </Typography>
        ),
      }),
      pagination: usePagination({
        count: 5,
        page: bindProp(() => m, 'pageVal'),
        onChange: (v) => m.setPageVal(v),
        color: 'primary',
      }),
    },
    view: () => (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Top Category Tabs via c.children.CategoryTabs */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 300 }}>
            <c.children.CategoryTabs />
          </Box>
          <c.children.ToggleCodeBtn />
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
              Notice the complete absence of React useState hooks and inline prop bindings in JSX. State resides strictly in ComponentDef.props, child components are declared in ComponentDef.children, and view renders prop-less c.children tags.
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
                  <c.children.BtnContained />
                  <c.children.BtnOutlined />
                  <c.children.BtnSuccess />
                  <c.children.BtnError />
                  <c.children.BtnDisabled />
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
                  <c.children.IconBtn />
                  <c.children.Fab />
                  <c.children.ToggleGroup />
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
                <c.children.TextField />
                <c.children.Select />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Current Text: <code>&quot;{m.textVal}&quot;</code> | Current Select: <code>&quot;{m.selectVal}&quot;</code>
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
                  <c.children.Checkbox />
                  <c.children.SwitchInput />
                </Box>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Slider Intensity Value: {m.sliderVal}%
                  </Typography>
                  <c.children.Slider />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Star Rating:
                  </Typography>
                  <c.children.Rating />
                </Box>
                <c.children.RadioGroup />
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
                  <c.children.AlertBanner />
                ) : (
                  <c.children.RestoreAlertBtn />
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 1 }}>
                  <c.children.Badge />
                  <c.children.Tooltip />
                  <c.children.Chip />
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
                  <c.children.CircularProgress />
                  <c.children.CircularProgressDet />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Determinate: {m.progressVal}%
                  </Typography>
                </Box>
                <Box sx={{ width: '100%', mt: 1 }}>
                  <c.children.LinearProgress />
                </Box>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Pre-Hydration Skeleton Placeholders:
                </Typography>
                <c.children.SkeletonText />
                <c.children.SkeletonRect />
              </CardContent>
            </MuiCard>
          </Box>
        )}

        {/* TAB 4: Surfaces & Navigation */}
        {m.activeCategory === 'surfaces' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            {/* Card & Breadcrumbs */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <c.children.Breadcrumbs />
              <c.children.Card />
            </Box>

            {/* Accordion, Tabs & Pagination */}
            <MuiCard variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'divider' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Surfaces & Pagination
                </Typography>
                <c.children.InnerTabs />
                <c.children.Accordion />
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  <c.children.Pagination />
                </Box>
              </CardContent>
            </MuiCard>
          </Box>
        )}
      </Box>
    ),
  };

  c = useComponent(def, params);
  m = c.model;
  return c;
};

export const ShowcaseGallery = toReact(useShowcaseGallery);
ShowcaseGallery.displayName = 'ShowcaseGallery';
