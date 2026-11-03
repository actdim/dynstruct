import React, { useState } from 'react';
import { PortalProvider } from '../common/PortalProvider';
import { Button } from '@actdim/dynstruct-mui/Button';
import { TextField } from '@actdim/dynstruct-mui/TextField';
import { Select } from '@actdim/dynstruct-mui/Select';
import { Checkbox } from '@actdim/dynstruct-mui/Checkbox';
import { Switch } from '@actdim/dynstruct-mui/Switch';
import { Slider } from '@actdim/dynstruct-mui/Slider';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Badge,
  Alert,
  CircularProgress,
  LinearProgress,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';

export function ShowcaseGalleryIsland() {
  const [tabValue, setTabValue] = useState(0);
  const [btnClicks, setBtnClicks] = useState(0);
  const [textVal, setTextVal] = useState('Dynstruct Input');
  const [selectVal, setSelectVal] = useState('one');
  const [chkVal, setChkVal] = useState(true);
  const [swVal, setSwVal] = useState(true);
  const [sldVal, setSldVal] = useState(65);

  const selectOptions = [
    { value: 'one', label: 'Option One (Alpha)' },
    { value: 'two', label: 'Option Two (Beta)' },
    { value: 'three', label: 'Option Three (Gamma)' },
  ];

  return (
    <PortalProvider>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          textColor="primary"
          indicatorColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Buttons & Actions" />
          <Tab label="Form & Inputs" />
          <Tab label="Feedback & Status" />
          <Tab label="Surfaces & Content" />
        </Tabs>

        {/* Tab 0: Buttons & Actions */}
        {tabValue === 0 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Card variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'divider' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Button Variants & Colors
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  <Button
                    label="Primary Contained"
                    variant="contained"
                    color="primary"
                    onClick={() => setBtnClicks((c) => c + 1)}
                  />
                  <Button
                    label="Secondary Outlined"
                    variant="outlined"
                    color="secondary"
                    onClick={() => setBtnClicks((c) => c + 1)}
                  />
                  <Button
                    label="Success Action"
                    variant="contained"
                    color="success"
                    onClick={() => setBtnClicks((c) => c + 1)}
                  />
                  <Button
                    label="Error Action"
                    variant="outlined"
                    color="error"
                    onClick={() => setBtnClicks((c) => c + 1)}
                  />
                  <Button label="Disabled" variant="contained" disabled />
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Total Click Events Processed: {btnClicks}
                </Typography>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'divider' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Button Sizes & Loading States
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                  <Button label="Small" size="small" variant="contained" />
                  <Button label="Medium" size="medium" variant="contained" />
                  <Button label="Large" size="large" variant="contained" />
                  <Button label="Loading State" variant="contained" loading />
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Tab 1: Form & Inputs */}
        {tabValue === 1 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Card variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'divider' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Text Inputs & Selection
                </Typography>
                <TextField
                  label="Dynamic Text Field"
                  value={textVal}
                  onChange={setTextVal}
                  fullWidth
                />
                <Select
                  label="Select Component"
                  value={selectVal}
                  options={selectOptions}
                  onChange={setSelectVal}
                  fullWidth
                />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Live state: text=&quot;{textVal}&quot;, select=&quot;{selectVal}&quot;
                </Typography>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'divider' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Toggles & Sliders
                </Typography>
                <Checkbox
                  label={`Checkbox Control (checked: ${chkVal ? 'true' : 'false'})`}
                  checked={chkVal}
                  onChange={setChkVal}
                />
                <Switch
                  label={`Switch Control (enabled: ${swVal ? 'true' : 'false'})`}
                  checked={swVal}
                  onChange={setSwVal}
                />
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                    Slider Value: {sldVal}%
                  </Typography>
                  <Slider value={sldVal} min={0} max={100} onChange={setSldVal} />
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Tab 2: Feedback & Status */}
        {tabValue === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <Alert severity="info">
                Information Notice: Dynstruct contracts maintain strict type checks.
              </Alert>
              <Alert severity="success">
                Success Notice: Server-side rendering verified without hydration errors.
              </Alert>
              <Alert severity="warning">
                Warning Notice: Heavy CSS-in-JS runtimes should be kept inside islands.
              </Alert>
              <Alert severity="error">
                Error Notice: Direct prop-drilling across microfrontends is discouraged.
              </Alert>
            </Box>

            <Card variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'divider' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Progress Indicators
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <CircularProgress size={32} />
                  <CircularProgress color="secondary" size={32} />
                  <CircularProgress color="success" size={32} />
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress sx={{ borderRadius: 1 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Tab 3: Surfaces & Content */}
        {tabValue === 3 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <Badge badgeContent={4} color="primary">
                <Avatar sx={{ bgcolor: 'primary.main' }}>DS</Avatar>
              </Badge>
              <Badge badgeContent="NEW" color="secondary">
                <Avatar sx={{ bgcolor: 'secondary.main' }}>MM</Avatar>
              </Badge>
              <Chip label="Chip Outlined" variant="outlined" color="primary" />
              <Chip label="Chip Contained" color="primary" />
              <Chip label="Deletable Chip" onDelete={() => {}} color="secondary" />
            </Box>

            <Accordion sx={{ bgcolor: 'background.paper', borderColor: 'divider' }}>
              <AccordionSummary>
                <Typography sx={{ fontWeight: 'bold' }}>
                  Architecture FAQ: Why Astro Islands instead of pure Next.js or Vite SPA?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Astro produces static, zero-JavaScript HTML by default. By loading Material UI only inside interactive client islands, the initial page payload drops by over 80% while retaining rich Material Design widgets exactly where needed.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}
      </Box>
    </PortalProvider>
  );
}
