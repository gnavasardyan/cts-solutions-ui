import Database from 'better-sqlite3';

const sqlite = new Database('./database.sqlite');

// Update factory operator user
console.log('Updating factory operator...');
sqlite.exec(`
  UPDATE users SET factory_id = 'C8E4F5C8A1234567' WHERE email = 'factory-test@example.com';
`);

// Update some orders to belong to factory
console.log('Updating orders to belong to factory...');
sqlite.exec(`
  UPDATE orders SET factory_id = 'C8E4F5C8A1234567' WHERE id IN (
    SELECT id FROM orders LIMIT 2
  );
`);

// Check users
console.log('Users with factory assignments:');
const users = sqlite.prepare(`SELECT email, role, factory_id FROM users WHERE factory_id IS NOT NULL`).all();
console.log(users);

// Check orders
console.log('Orders assigned to factories:');
const orders = sqlite.prepare(`SELECT id, order_number, status, factory_id FROM orders WHERE factory_id IS NOT NULL`).all();
console.log(orders);

sqlite.close();
console.log('Database updates completed!');