import dotenv from 'dotenv';
import { DataTypes, Sequelize } from 'sequelize';

dotenv.config();

const {
  DB_HOST = '127.0.0.1',
  DB_PORT = 3306,
  DB_USER = 'root',
  DB_PASSWORD = 'password',
  DB_NAME = 'tenant_theme_poc'
} = process.env;

const rootSequelize = new Sequelize('mysql', DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: 'mysql',
  logging: false
});

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: 'mysql',
  logging: false
});

const Theme = sequelize.define(
  'Theme',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(80), allowNull: false },
    primaryColor: { type: DataTypes.STRING(20), allowNull: false, field: 'primary_color' },
    secondaryColor: { type: DataTypes.STRING(20), allowNull: false, field: 'secondary_color' },
    baseColor: { type: DataTypes.STRING(20), allowNull: false, field: 'base_color' },
    headingFont: { type: DataTypes.STRING(80), allowNull: false, field: 'heading_font' },
    bodyFont: { type: DataTypes.STRING(80), allowNull: false, field: 'body_font' },
    monoFont: { type: DataTypes.STRING(80), allowNull: false, field: 'mono_font' }
  },
  { tableName: 'theme', underscored: true }
);

const Tenant = sequelize.define(
  'Tenant',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    slug: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    themeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'theme_id',
      references: { model: 'theme', key: 'id' }
    }
  },
  { tableName: 'tenant', underscored: true }
);

const Component = sequelize.define(
  'Component',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    componentKey: { type: DataTypes.STRING(120), allowNull: false, unique: true, field: 'component_key' },
    label: { type: DataTypes.STRING(120), allowNull: false },
    isThemeCustomizable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_theme_customizable'
    }
  },
  { tableName: 'component', underscored: true }
);

Theme.hasMany(Tenant, { foreignKey: 'theme_id' });
Tenant.belongsTo(Theme, { foreignKey: 'theme_id' });

export async function initializeDatabase() {
  await rootSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);

  await sequelize.authenticate();
  await sequelize.sync();

  const themeCount = await Theme.count();
  if (themeCount === 0) {
    await Theme.bulkCreate([
      {
        name: 'Aurora Retail',
        primaryColor: '#2D6A4F',
        secondaryColor: '#FF9F1C',
        baseColor: '#F1FAEE',
        headingFont: 'Poppins',
        bodyFont: 'Inter',
        monoFont: 'Fira Code'
      },
      {
        name: 'Nebula Health',
        primaryColor: '#005F73',
        secondaryColor: '#EE6C4D',
        baseColor: '#F8F9FA',
        headingFont: 'Montserrat',
        bodyFont: 'Lato',
        monoFont: 'Source Code Pro'
      },
      {
        name: 'Summit Finance',
        primaryColor: '#3A0CA3',
        secondaryColor: '#F72585',
        baseColor: '#F5F3FF',
        headingFont: 'Roboto Slab',
        bodyFont: 'Nunito Sans',
        monoFont: 'JetBrains Mono'
      }
    ]);
  }

  const tenantCount = await Tenant.count();
  if (tenantCount === 0) {
    await Tenant.bulkCreate([
      { name: 'Acme Retail', slug: 'acme-retail', themeId: 1 },
      { name: 'Bluebird Clinics', slug: 'bluebird-clinics', themeId: 2 },
      { name: 'Summit Capital', slug: 'summit-capital', themeId: 3 }
    ]);
  }

  const componentCount = await Component.count();
  if (componentCount === 0) {
    await Component.bulkCreate([
      { componentKey: 'app_header', label: 'Application Header', isThemeCustomizable: true },
      { componentKey: 'kpi_cards', label: 'KPI Cards', isThemeCustomizable: true },
      { componentKey: 'quick_actions', label: 'Quick Action Buttons', isThemeCustomizable: true },
      { componentKey: 'search_bar', label: 'Search and Filters', isThemeCustomizable: false },
      { componentKey: 'alerts_panel', label: 'Alerts Panel', isThemeCustomizable: true },
      { componentKey: 'recent_table', label: 'Recent Activity Table', isThemeCustomizable: false },
      { componentKey: 'status_chips', label: 'Status Chips', isThemeCustomizable: true },
      { componentKey: 'tabs_panel', label: 'Tabbed Insights', isThemeCustomizable: false },
      { componentKey: 'announcement_list', label: 'Announcements List', isThemeCustomizable: true },
      { componentKey: 'footer', label: 'Footer Section', isThemeCustomizable: true }
    ]);
  }
}

export async function getTenants() {
  const tenants = await Tenant.findAll({
    include: [{ model: Theme, attributes: ['name'] }],
    order: [['id', 'ASC']]
  });

  return tenants.map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    theme_id: tenant.themeId,
    theme_name: tenant.Theme?.name || null
  }));
}

export async function getThemeConfigByTenantId(tenantId) {
  const tenant = await Tenant.findOne({
    where: { id: tenantId },
    include: [{ model: Theme }]
  });

  if (!tenant || !tenant.Theme) {
    return null;
  }

  const components = await Component.findAll({ order: [['id', 'ASC']] });

  return {
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug
    },
    theme: {
      id: tenant.Theme.id,
      name: tenant.Theme.name,
      colors: {
        primary: tenant.Theme.primaryColor,
        secondary: tenant.Theme.secondaryColor,
        base: tenant.Theme.baseColor
      },
      fonts: {
        heading: tenant.Theme.headingFont,
        body: tenant.Theme.bodyFont,
        mono: tenant.Theme.monoFont
      }
    },
    components: components.map((component) => ({
      id: component.id,
      key: component.componentKey,
      label: component.label,
      isThemeCustomizable: component.isThemeCustomizable
    }))
  };
}
