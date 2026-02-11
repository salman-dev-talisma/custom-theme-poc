import mariadb from 'mariadb';
import dotenv from 'dotenv';

dotenv.config();

const {
  DB_HOST = '127.0.0.1',
  DB_PORT = 3306,
  DB_USER = 'root',
  DB_PASSWORD = 'password',
  DB_NAME = 'tenant_theme_poc'
} = process.env;

const adminPool = mariadb.createPool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  connectionLimit: 5
});

const appPool = mariadb.createPool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  connectionLimit: 5
});

async function execute(pool, sql, params = []) {
  let conn;
  try {
    conn = await pool.getConnection();
    return await conn.query(sql, params);
  } finally {
    if (conn) conn.release();
  }
}

export async function initializeDatabase() {
  await execute(adminPool, `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);

  await execute(appPool, `
    CREATE TABLE IF NOT EXISTS theme (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(80) NOT NULL,
      primary_color VARCHAR(20) NOT NULL,
      secondary_color VARCHAR(20) NOT NULL,
      base_color VARCHAR(20) NOT NULL,
      heading_font VARCHAR(80) NOT NULL,
      body_font VARCHAR(80) NOT NULL,
      mono_font VARCHAR(80) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await execute(appPool, `
    CREATE TABLE IF NOT EXISTS tenant (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      slug VARCHAR(80) NOT NULL UNIQUE,
      theme_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_tenant_theme
        FOREIGN KEY (theme_id) REFERENCES theme(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
    );
  `);

  await execute(appPool, `
    CREATE TABLE IF NOT EXISTS component (
      id INT AUTO_INCREMENT PRIMARY KEY,
      component_key VARCHAR(120) NOT NULL UNIQUE,
      label VARCHAR(120) NOT NULL,
      is_theme_customizable BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const themeCount = await execute(appPool, 'SELECT COUNT(*) as total FROM theme;');
  if (themeCount[0].total === 0) {
    await execute(
      appPool,
      `
      INSERT INTO theme
        (name, primary_color, secondary_color, base_color, heading_font, body_font, mono_font)
      VALUES
        (?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?);
      `,
      [
        'Aurora Retail', '#2D6A4F', '#FF9F1C', '#F1FAEE', 'Poppins', 'Inter', 'Fira Code',
        'Nebula Health', '#005F73', '#EE6C4D', '#F8F9FA', 'Montserrat', 'Lato', 'Source Code Pro',
        'Summit Finance', '#3A0CA3', '#F72585', '#F5F3FF', 'Roboto Slab', 'Nunito Sans', 'JetBrains Mono'
      ]
    );
  }

  const tenantCount = await execute(appPool, 'SELECT COUNT(*) as total FROM tenant;');
  if (tenantCount[0].total === 0) {
    await execute(
      appPool,
      `
      INSERT INTO tenant (name, slug, theme_id)
      VALUES
        ('Acme Retail', 'acme-retail', 1),
        ('Bluebird Clinics', 'bluebird-clinics', 2),
        ('Summit Capital', 'summit-capital', 3);
      `
    );
  }

  const componentCount = await execute(appPool, 'SELECT COUNT(*) as total FROM component;');
  if (componentCount[0].total === 0) {
    await execute(
      appPool,
      `
      INSERT INTO component (component_key, label, is_theme_customizable)
      VALUES
        ('app_header', 'Application Header', true),
        ('kpi_cards', 'KPI Cards', true),
        ('quick_actions', 'Quick Action Buttons', true),
        ('search_bar', 'Search and Filters', false),
        ('alerts_panel', 'Alerts Panel', true),
        ('recent_table', 'Recent Activity Table', false),
        ('status_chips', 'Status Chips', true),
        ('tabs_panel', 'Tabbed Insights', false),
        ('announcement_list', 'Announcements List', true),
        ('footer', 'Footer Section', true);
      `
    );
  }
}

export async function getTenants() {
  return execute(
    appPool,
    `SELECT t.id, t.name, t.slug, t.theme_id, th.name AS theme_name
     FROM tenant t
     JOIN theme th ON th.id = t.theme_id
     ORDER BY t.id;`
  );
}

export async function getThemeConfigByTenantId(tenantId) {
  const tenantRows = await execute(
    appPool,
    `SELECT t.id, t.name, t.slug, th.id as theme_id, th.name as theme_name,
            th.primary_color, th.secondary_color, th.base_color,
            th.heading_font, th.body_font, th.mono_font
     FROM tenant t
     JOIN theme th ON th.id = t.theme_id
     WHERE t.id = ?;`,
    [tenantId]
  );

  if (tenantRows.length === 0) {
    return null;
  }

  const componentRows = await execute(
    appPool,
    `SELECT id, component_key, label, is_theme_customizable
     FROM component
     ORDER BY id;`
  );

  return {
    tenant: {
      id: tenantRows[0].id,
      name: tenantRows[0].name,
      slug: tenantRows[0].slug
    },
    theme: {
      id: tenantRows[0].theme_id,
      name: tenantRows[0].theme_name,
      colors: {
        primary: tenantRows[0].primary_color,
        secondary: tenantRows[0].secondary_color,
        base: tenantRows[0].base_color
      },
      fonts: {
        heading: tenantRows[0].heading_font,
        body: tenantRows[0].body_font,
        mono: tenantRows[0].mono_font
      }
    },
    components: componentRows.map((component) => ({
      id: component.id,
      key: component.component_key,
      label: component.label,
      isThemeCustomizable: Boolean(component.is_theme_customizable)
    }))
  };
}
