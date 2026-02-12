import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  CssBaseline,
  FormControl,
  Grid2,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme
} from '@mui/material';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const tableRows = [
  { id: 'ACT-9281', user: 'Jane Doe', status: 'Completed', amount: '$1,400' },
  { id: 'ACT-9282', user: 'Liam Smith', status: 'Pending', amount: '$620' },
  { id: 'ACT-9283', user: 'Olivia Brown', status: 'Escalated', amount: '$2,300' }
];

export default function App() {
  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [themeConfig, setThemeConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    async function bootstrap() {
      try {
        setLoading(true);
        const tenantResponse = await fetch(`${API_BASE_URL}/tenants`);
        if (!tenantResponse.ok) {
          throw new Error('Could not load tenants');
        }
        const tenantPayload = await tenantResponse.json();
        const loadedTenants = tenantPayload.tenants || [];
        setTenants(loadedTenants);

        if (loadedTenants.length > 0) {
          const defaultId = loadedTenants[0].id;
          setSelectedTenantId(String(defaultId));
          await loadThemeForTenant(defaultId);
        }
      } catch (bootstrapError) {
        setError(bootstrapError.message);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  async function loadThemeForTenant(tenantId) {
    const response = await fetch(`${API_BASE_URL}/theme-config/${tenantId}`);
    if (!response.ok) {
      throw new Error(`Unable to load theme config for tenant ${tenantId}`);
    }
    const payload = await response.json();
    setThemeConfig(payload);
  }

  async function handleTenantChange(event) {
    const nextTenantId = event.target.value;
    setSelectedTenantId(nextTenantId);
    try {
      setLoading(true);
      await loadThemeForTenant(nextTenantId);
      setError('');
    } catch (tenantError) {
      setError(tenantError.message);
    } finally {
      setLoading(false);
    }
  }

  const muiTheme = useMemo(() => {
    if (!themeConfig) {
      return null;
    }

    return createTheme({
      palette: {
        primary: { main: themeConfig.theme.colors.primary },
        secondary: { main: themeConfig.theme.colors.secondary },
        background: {
          default: themeConfig.theme.colors.base,
          paper: '#ffffff'
        }
      },
      typography: {
        fontFamily: `${themeConfig.theme.fonts.body}, sans-serif`,
        h1: { fontFamily: `${themeConfig.theme.fonts.heading}, sans-serif` },
        h2: { fontFamily: `${themeConfig.theme.fonts.heading}, sans-serif` },
        h3: { fontFamily: `${themeConfig.theme.fonts.heading}, sans-serif` },
        button: { fontFamily: `${themeConfig.theme.fonts.body}, sans-serif` },
        body1: { fontFamily: `${themeConfig.theme.fonts.body}, sans-serif` },
        subtitle2: { fontFamily: `${themeConfig.theme.fonts.mono}, monospace` }
      },
      shape: { borderRadius: 12 }
    });
  }, [themeConfig]);

  if (!muiTheme) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f5f5f5'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="static" color="primary">
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">Tenant Theming Dashboard (POC)</Typography>
            <Typography variant="subtitle2">Runtime theme switch via tenant ID</Typography>
          </Toolbar>
        </AppBar>

        <Container sx={{ py: 4 }} maxWidth="lg">
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid2 container spacing={2} alignItems="center">
              <Grid2 size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel id="tenant-label">Tenant</InputLabel>
                  <Select
                    labelId="tenant-label"
                    value={selectedTenantId}
                    label="Tenant"
                    onChange={handleTenantChange}
                  >
                    {tenants.map((tenant) => (
                      <MenuItem key={tenant.id} value={String(tenant.id)}>
                        {tenant.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid2>
              <Grid2 size={{ xs: 12, md: 8 }}>
                {themeConfig && (
                  <Alert severity="info">
                    Active theme <strong>{themeConfig.theme.name}</strong> with colors (
                    {themeConfig.theme.colors.primary}, {themeConfig.theme.colors.secondary},
                    {themeConfig.theme.colors.base})
                  </Alert>
                )}
              </Grid2>
            </Grid2>
          </Paper>

          {error && <Alert severity="error">{error}</Alert>}
          {loading && (
            <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && themeConfig && (
            <Grid2 container spacing={2}>
              <Grid2 size={{ xs: 12, md: 4 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">1) Revenue Snapshot</Typography>
                    <Typography variant="h3" color="primary">
                      $24,560
                    </Typography>
                    <Chip label="+18% month-over-month" color="secondary" sx={{ mt: 1 }} />
                  </CardContent>
                </Card>
              </Grid2>

              <Grid2 size={{ xs: 12, md: 4 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">2) Active Users</Typography>
                    <Typography variant="h3" color="primary">
                      1,248
                    </Typography>
                    <Chip label="42 new this week" color="secondary" sx={{ mt: 1 }} />
                  </CardContent>
                </Card>
              </Grid2>

              <Grid2 size={{ xs: 12, md: 4 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">3) Support Tickets</Typography>
                    <Typography variant="h3" color="primary">
                      73
                    </Typography>
                    <Chip label="12 escalated" color="secondary" sx={{ mt: 1 }} />
                  </CardContent>
                </Card>
              </Grid2>

              <Grid2 size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    4) Quick Actions
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button variant="contained">Create Invoice</Button>
                    <Button variant="outlined">Send Campaign</Button>
                    <Button variant="contained" color="secondary">
                      Launch Workflow
                    </Button>
                  </Box>
                </Paper>
              </Grid2>

              <Grid2 size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    5) Search & Filter
                  </Typography>
                  <TextField fullWidth placeholder="Search customers, orders, tickets..." />
                </Paper>
              </Grid2>

              <Grid2 size={{ xs: 12, md: 6 }}>
                <Alert severity="warning">6) 5 invoices are approaching due date this week.</Alert>
              </Grid2>

              <Grid2 size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    7) Status Chips
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label="New" color="primary" />
                    <Chip label="In Progress" color="secondary" />
                    <Chip label="Blocked" variant="outlined" color="error" />
                  </Box>
                </Paper>
              </Grid2>

              <Grid2 size={{ xs: 12, md: 7 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    8) Recent Activity
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>User</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tableRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.id}</TableCell>
                          <TableCell>{row.user}</TableCell>
                          <TableCell>{row.status}</TableCell>
                          <TableCell>{row.amount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              </Grid2>

              <Grid2 size={{ xs: 12, md: 5 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    9) Insights Tabs
                  </Typography>
                  <Tabs value={tabValue} onChange={(_e, value) => setTabValue(value)}>
                    <Tab label="Sales" />
                    <Tab label="Engagement" />
                    <Tab label="Ops" />
                  </Tabs>
                  <Typography sx={{ mt: 2 }}>Selected tab index: {tabValue}</Typography>
                </Paper>
              </Grid2>

              <Grid2 size={{ xs: 12 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    10) Theme-aware Components (from backend table)
                  </Typography>
                  <List dense>
                    {themeConfig.components.map((component) => (
                      <ListItem key={component.id}>
                        <ListItemText
                          primary={`${component.label} (${component.key})`}
                          secondary={
                            component.isThemeCustomizable
                              ? 'Customizable in tenant theme'
                              : 'Uses global default style'
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid2>
            </Grid2>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}
