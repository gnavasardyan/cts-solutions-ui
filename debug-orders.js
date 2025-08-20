import Database from 'better-sqlite3';

const sqlite = new Database('./database.sqlite');

console.log('=== Проверка заказов и привязок к заводам ===');

// Проверяем заказы
console.log('\nВсе заказы:');
const allOrders = sqlite.prepare(`
  SELECT id, order_number, status, factory_id, customer_id 
  FROM orders
`).all();
console.log(allOrders);

// Проверяем пользователей операторов завода
console.log('\nОператоры заводов:');
const factoryOperators = sqlite.prepare(`
  SELECT id, email, role, factory_id 
  FROM users 
  WHERE role = 'factory_operator'
`).all();
console.log(factoryOperators);

// Проверяем заводы
console.log('\nЗаводы:');
const factories = sqlite.prepare(`
  SELECT id, name, location 
  FROM factories
`).all();
console.log(factories);

// Проверяем заказы с привязкой к заводам
console.log('\nЗаказы с привязкой к заводам:');
const ordersWithFactories = sqlite.prepare(`
  SELECT o.id, o.order_number, o.status, o.factory_id, f.name as factory_name
  FROM orders o 
  LEFT JOIN factories f ON o.factory_id = f.id
  WHERE o.factory_id IS NOT NULL
`).all();
console.log(ordersWithFactories);

sqlite.close();