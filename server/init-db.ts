import { runMigrations } from './migrate-db';
import { db } from './db';
import { users, products, controlPoints } from '@shared/schema';
import bcrypt from 'bcryptjs';

async function initializeDatabase() {
  console.log('Initializing database with updated schema...');

  try {
    // First run migrations to create tables
    await runMigrations();
    
    // Check if database already has data
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log('Database already initialized, skipping data creation...');
      return;
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await db.insert(users).values({
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'Администратор',
      lastName: 'Системы',
      role: 'administrator',
    });

    // Create test users for each role
    const operatorPassword = await bcrypt.hash('operator123', 10);
    
    await db.insert(users).values([
      {
        email: 'customer@example.com',
        password: operatorPassword,
        firstName: 'Иван',
        lastName: 'Заказчик',
        role: 'customer_operator',
      },
      {
        email: 'production@example.com',
        password: operatorPassword,
        firstName: 'Петр',
        lastName: 'Производственник',
        role: 'production_operator',
      },
      {
        email: 'logistics@example.com',
        password: operatorPassword,
        firstName: 'Сергей',
        lastName: 'Логист',
        role: 'logistics_operator',
      },
      {
        email: 'construction@example.com',
        password: operatorPassword,
        firstName: 'Алексей',
        lastName: 'Строитель',
        role: 'construction_operator',
      },
    ]);

    // Create control points
    await db.insert(controlPoints).values([
      {
        name: 'Главный завод',
        type: 'factory',
        address: 'г. Москва, ул. Промышленная, 1',
        latitude: 55.751244,
        longitude: 37.618423,
      },
      {
        name: 'Склад №1',
        type: 'storage',
        address: 'г. Москва, ул. Складская, 15',
        latitude: 55.756244,
        longitude: 37.628423,
      },
      {
        name: 'Строительная площадка А',
        type: 'usage_site',
        address: 'г. Москва, ул. Строительная, 25',
        latitude: 55.761244,
        longitude: 37.638423,
      },
    ]);

    // Create test products for catalog
    await db.insert(products).values([
      {
        name: 'Двутавровая балка 20Б1',
        description: 'Стальная двутавровая балка для строительных конструкций',
        category: 'beam',
        price: 15000,
        weight: 120.5,
        dimensions: '{"length": 6000, "height": 200, "width": 100, "thickness": 8}',
        gost: 'ГОСТ 8239-89',
        inStock: 50,
      },
      {
        name: 'Колонна К-1',
        description: 'Сварная колонна из двутавра для каркаса здания',
        category: 'column',
        price: 25000,
        weight: 200.0,
        dimensions: '{"length": 3000, "width": 150, "height": 150}',
        gost: 'ГОСТ 23118-2012',
        inStock: 30,
      },
      {
        name: 'Ферма покрытия Ф-1',
        description: 'Стропильная ферма для покрытия производственного здания',
        category: 'truss',
        price: 45000,
        weight: 350.0,
        dimensions: '{"length": 12000, "height": 1500, "width": 300}',
        gost: 'ГОСТ 23118-2012',
        inStock: 15,
      },
      {
        name: 'Болтовое соединение М20',
        description: 'Комплект болтового соединения высокопрочный',
        category: 'connection',
        price: 500,
        weight: 0.8,
        dimensions: '{"diameter": 20, "length": 80}',
        gost: 'ГОСТ 22353-77',
        inStock: 200,
      },
      {
        name: 'Плита перекрытия ПК 63-15',
        description: 'Железобетонная предварительно напряженная плита',
        category: 'slab',
        price: 18000,
        weight: 2800.0,
        dimensions: '{"length": 6300, "width": 1500, "height": 220}',
        gost: 'ГОСТ 9561-2016',
        inStock: 25,
      },
      {
        name: 'Двутавровая балка 30Б1',
        description: 'Стальная двутавровая балка повышенной несущей способности',
        category: 'beam',
        price: 28000,
        weight: 180.5,
        dimensions: '{"length": 6000, "height": 300, "width": 135, "thickness": 10}',
        gost: 'ГОСТ 8239-89',
        inStock: 35,
      },
      {
        name: 'Колонна К-2',
        description: 'Составная сварная колонна для многоэтажного здания',
        category: 'column',
        price: 35000,
        weight: 280.0,
        dimensions: '{"length": 4500, "width": 200, "height": 200}',
        gost: 'ГОСТ 23118-2012',
        inStock: 20,
      },
      {
        name: 'Ферма покрытия Ф-2',
        description: 'Легкая стропильная ферма для складских помещений',
        category: 'truss',
        price: 32000,
        weight: 220.0,
        dimensions: '{"length": 9000, "height": 1200, "width": 250}',
        gost: 'ГОСТ 23118-2012',
        inStock: 18,
      },
    ]);

    console.log('Database initialized successfully!');
    console.log('Test accounts:');
    console.log('- Администратор: admin@example.com / admin123');
    console.log('- Оператор заказчика: customer@example.com / operator123');
    console.log('- Оператор производства: production@example.com / operator123');
    console.log('- Оператор логистики: logistics@example.com / operator123');
    console.log('- Оператор стройки: construction@example.com / operator123');

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Run initialization if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { initializeDatabase };