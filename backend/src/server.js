import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getTenants, getThemeConfigByTenantId, initializeDatabase } from './db.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'tenant-theme-poc-backend' });
});

app.get('/api/tenants', async (_req, res) => {
  try {
    const tenants = await getTenants();
    res.json({ tenants });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tenants', details: error.message });
  }
});

app.get('/api/theme-config/:tenantId', async (req, res) => {
  const tenantId = Number(req.params.tenantId);
  if (Number.isNaN(tenantId)) {
    return res.status(400).json({ error: 'tenantId must be a valid number' });
  }

  try {
    const data = await getThemeConfigByTenantId(tenantId);
    if (!data) {
      return res.status(404).json({ error: `No tenant found for id=${tenantId}` });
    }
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch theme config', details: error.message });
  }
});

async function start() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server', error);
    process.exit(1);
  }
}

start();
