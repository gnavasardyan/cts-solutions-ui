import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './db';
import Database from 'better-sqlite3';

async function runMigrations() {
  console.log('Running database migrations...');
  
  // Create the database file if it doesn't exist
  const sqlite = new Database('./database.sqlite');
  
  // Create tables manually since we can't use drizzle-kit
  const createTableQueries = [
    // Sessions table
    `CREATE TABLE IF NOT EXISTS sessions (
      sid TEXT PRIMARY KEY,
      sess TEXT NOT NULL,
      expire INTEGER NOT NULL
    )`,
    
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      profile_image_url TEXT,
      role TEXT NOT NULL DEFAULT 'customer_operator',
      is_active TEXT NOT NULL DEFAULT 'true',
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    )`,
    
    // Control points table
    `CREATE TABLE IF NOT EXISTS control_points (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      address TEXT,
      latitude REAL,
      longitude REAL,
      created_at INTEGER DEFAULT (unixepoch())
    )`,
    
    // Elements table
    `CREATE TABLE IF NOT EXISTS elements (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      code TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'production',
      drawing TEXT,
      batch TEXT,
      gost TEXT,
      length REAL,
      width REAL,
      height REAL,
      weight REAL,
      current_location_id TEXT,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    )`,
    
    // Movements table
    `CREATE TABLE IF NOT EXISTS movements (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      element_id TEXT NOT NULL,
      from_location_id TEXT,
      to_location_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      operator_id TEXT NOT NULL,
      comments TEXT,
      photo_url TEXT,
      latitude REAL,
      longitude REAL,
      timestamp INTEGER DEFAULT (unixepoch())
    )`,
    
    // Products table
    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      weight REAL,
      dimensions TEXT,
      image_url TEXT,
      gost TEXT,
      in_stock INTEGER NOT NULL DEFAULT 0,
      is_active TEXT NOT NULL DEFAULT 'true',
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    )`,
    
    // Orders table
    `CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      customer_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      total_amount REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    )`,
    
    // Order items table
    `CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    )`,
    
    // Cart items table
    `CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    )`,
    
    // Create indexes
    `CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire)`,
    `CREATE INDEX IF NOT EXISTS IDX_users_email ON users (email)`,
    `CREATE INDEX IF NOT EXISTS IDX_elements_code ON elements (code)`,
    `CREATE INDEX IF NOT EXISTS IDX_movements_element ON movements (element_id)`,
    `CREATE INDEX IF NOT EXISTS IDX_cart_user ON cart_items (user_id)`,
    `CREATE INDEX IF NOT EXISTS IDX_orders_customer ON orders (customer_id)`
  ];

  try {
    for (const query of createTableQueries) {
      sqlite.exec(query);
    }
    
    console.log('Database schema created successfully!');
    sqlite.close();
    
  } catch (error) {
    console.error('Error creating database schema:', error);
    sqlite.close();
    throw error;
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { runMigrations };