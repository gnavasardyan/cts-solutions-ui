import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

const sqlite = new Database('./database.sqlite');
const db = drizzle(sqlite);

console.log('Starting database migration...');

try {
  // Create factories table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS factories (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      address TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      specializations TEXT NOT NULL,
      is_active TEXT NOT NULL DEFAULT 'true',
      created_at INTEGER DEFAULT (unixepoch())
    );
  `);
  
  // Add new columns to orders table
  const addColumns = [
    'ALTER TABLE orders ADD COLUMN order_number TEXT',
    'ALTER TABLE orders ADD COLUMN factory_id TEXT',
    'ALTER TABLE orders ADD COLUMN priority TEXT DEFAULT "normal"',
    'ALTER TABLE orders ADD COLUMN deadline INTEGER'
  ];
  
  // Add new columns to order_items table
  const addOrderItemColumns = [
    'ALTER TABLE order_items ADD COLUMN specifications TEXT',
    'ALTER TABLE order_items ADD COLUMN status TEXT DEFAULT "pending"'
  ];
  
  addColumns.forEach(query => {
    try {
      sqlite.exec(query);
    } catch (e) {
      if (!e.message.includes('duplicate column name')) {
        console.warn(`Column addition warning: ${e.message}`);
      }
    }
  });
  
  addOrderItemColumns.forEach(query => {
    try {
      sqlite.exec(query);
    } catch (e) {
      if (!e.message.includes('duplicate column name')) {
        console.warn(`Column addition warning: ${e.message}`);
      }
    }
  });

  // Insert sample factories
  const insertFactory = sqlite.prepare(`
    INSERT OR IGNORE INTO factories (name, location, address, contact_email, contact_phone, capacity, specializations)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleFactories = [
    [
      'МеталлСтрой Завод №1',
      'Москва',
      'г. Москва, Промышленная ул., д. 25',
      'factory1@metallstroy.ru',
      '+7 (495) 123-45-67',
      1000,
      JSON.stringify(['beam', 'column', 'truss'])
    ],
    [
      'СтальКонструкция Производство',
      'Санкт-Петербург', 
      'г. СПб, Заводская ул., д. 15',
      'production@steelcons.ru',
      '+7 (812) 987-65-43',
      800,
      JSON.stringify(['connection', 'slab', 'beam'])
    ],
    [
      'Промышленные Металлоконструкции',
      'Екатеринбург',
      'г. Екатеринбург, Индустриальный пр., д. 45',
      'orders@prommetal.ru',
      '+7 (343) 555-12-34',
      1200,
      JSON.stringify(['column', 'truss', 'connection'])
    ]
  ];

  sampleFactories.forEach(factory => {
    insertFactory.run(...factory);
  });

  console.log('Database migration completed successfully!');
  console.log('Added:');
  console.log('- factories table with sample data');
  console.log('- order_number, factory_id, priority, deadline columns to orders');
  console.log('- specifications, status columns to order_items');

} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
} finally {
  sqlite.close();
}