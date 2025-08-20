import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import crypto from 'crypto';

const sqlite = new Database('./database.sqlite');
const db = drizzle(sqlite);

async function migrateProduction() {
  console.log('Starting production tables migration...');
  
  try {
    // Create production markings table
    const createProductionMarkings = `
      CREATE TABLE IF NOT EXISTS production_markings (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        order_item_id TEXT NOT NULL,
        marking_code TEXT NOT NULL UNIQUE,
        marking_type TEXT NOT NULL,
        operator_id TEXT NOT NULL,
        marked_at INTEGER DEFAULT (unixepoch()),
        printer_model TEXT,
        is_valid TEXT NOT NULL DEFAULT 'true'
      )
    `;
    
    // Create shipments table
    const createShipments = `
      CREATE TABLE IF NOT EXISTS shipments (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        shipment_number TEXT NOT NULL UNIQUE,
        factory_id TEXT NOT NULL,
        transport_type TEXT NOT NULL,
        transport_unit TEXT,
        weight REAL,
        dimensions TEXT,
        status TEXT NOT NULL DEFAULT 'preparing',
        created_at INTEGER DEFAULT (unixepoch()),
        shipped_at INTEGER,
        operator_id TEXT NOT NULL
      )
    `;
    
    // Create shipment items table
    const createShipmentItems = `
      CREATE TABLE IF NOT EXISTS shipment_items (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        shipment_id TEXT NOT NULL,
        order_id TEXT NOT NULL,
        sscc_code TEXT NOT NULL UNIQUE
      )
    `;
    
    sqlite.exec(createProductionMarkings);
    sqlite.exec(createShipments);
    sqlite.exec(createShipmentItems);
    
    console.log('Production tables migration completed successfully!');
    console.log('Added:');
    console.log('- production_markings table');
    console.log('- shipments table');
    console.log('- shipment_items table');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

migrateProduction();