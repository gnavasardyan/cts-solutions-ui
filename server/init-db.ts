import { db } from './db';
import { users, products, controlPoints, elements, orders, orderItems, cartItems } from '@shared/schema';
import bcrypt from 'bcryptjs';

async function initializeDatabase() {
  console.log('Initializing database with updated schema...');

  try {
    // Check if database already has data
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log('Database already initialized, skipping...');
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
        name: 'Стройплощадка "Москва-Сити"',
        type: 'usage_site',
        address: 'г. Москва, Пресненская наб.',
        latitude: 55.749244,
        longitude: 37.538423,
      },
    ]);

    // Create sample products for catalog
    await db.insert(products).values([
      {
        name: 'Двутавровая балка 20Б1',
        description: 'Стальная двутавровая балка для несущих конструкций',
        category: 'beam',
        price: 15000,
        weight: 150.5,
        dimensions: JSON.stringify({ length: 6000, width: 200, height: 200 }),
        gost: 'ГОСТ 8239-89',
        inStock: 50,
      },
      {
        name: 'Колонна К-300',
        description: 'Стальная колонна круглого сечения',
        category: 'column',
        price: 25000,
        weight: 280.0,
        dimensions: JSON.stringify({ length: 3000, diameter: 300 }),
        gost: 'ГОСТ 8732-78',
        inStock: 30,
      },
      {
        name: 'Ферма треугольная Ф-12',
        description: 'Стальная ферма для кровельных конструкций',
        category: 'truss',
        price: 45000,
        weight: 420.0,
        dimensions: JSON.stringify({ length: 12000, height: 2000 }),
        gost: 'ГОСТ 23279-85',
        inStock: 15,
      },
      {
        name: 'Соединительный узел УС-1',
        description: 'Болтовое соединение для металлоконструкций',
        category: 'connection',
        price: 3500,
        weight: 12.5,
        dimensions: JSON.stringify({ width: 150, height: 150, thickness: 20 }),
        gost: 'ГОСТ 7805-70',
        inStock: 200,
      },
      {
        name: 'Двутавровая балка 30Б1',
        description: 'Усиленная стальная балка для тяжелых нагрузок',
        category: 'beam',
        price: 22000,
        weight: 220.0,
        dimensions: JSON.stringify({ length: 6000, width: 300, height: 300 }),
        gost: 'ГОСТ 8239-89',
        inStock: 25,
      },
      {
        name: 'Колонна К-400',
        description: 'Стальная колонна большого сечения',
        category: 'column',
        price: 35000,
        weight: 380.0,
        dimensions: JSON.stringify({ length: 4000, diameter: 400 }),
        gost: 'ГОСТ 8732-78',
        inStock: 20,
      },
      {
        name: 'Прогон ПР-250',
        description: 'Металлический прогон для кровли',
        category: 'beam',
        price: 8500,
        weight: 85.0,
        dimensions: JSON.stringify({ length: 6000, width: 250, height: 120 }),
        gost: 'ГОСТ 8239-89',
        inStock: 50,
      },
      {
        name: 'Анкерный болт М20х300',
        description: 'Анкерное крепление для фундамента',
        category: 'connection',
        price: 450,
        weight: 1.2,
        dimensions: JSON.stringify({ diameter: 20, length: 300 }),
        gost: 'ГОСТ 24379-80',
        inStock: 1000,
      },
      {
        name: 'Ферма ФТ-18',
        description: 'Треугольная ферма пролетом 18 метров',
        category: 'truss',
        price: 65000,
        weight: 580.0,
        dimensions: JSON.stringify({ length: 18000, height: 2800 }),
        gost: 'ГОСТ 23279-85',
        inStock: 8,
      },
      {
        name: 'Швеллер 20У',
        description: 'Стальной швеллер с уклоном полок',
        category: 'beam',
        price: 12000,
        weight: 95.0,
        dimensions: JSON.stringify({ length: 6000, width: 200, height: 76 }),
        gost: 'ГОСТ 8240-97',
        inStock: 35,
      },
      {
        name: 'Уголок равнополочный 100х100х8',
        description: 'Равнополочный стальной уголок',
        category: 'beam',
        price: 3200,
        weight: 47.1,
        dimensions: JSON.stringify({ length: 6000, width: 100, height: 100, thickness: 8 }),
        gost: 'ГОСТ 8509-93',
        inStock: 80,
      },
      {
        name: 'Плита перекрытия ПК-60.15',
        description: 'Железобетонная плита перекрытия',
        category: 'slab',
        price: 28000,
        weight: 2800.0,
        dimensions: JSON.stringify({ length: 6000, width: 1500, height: 220 }),
        gost: 'ГОСТ 9561-91',
        inStock: 12,
      },
    ]);

    // Create sample elements for tracking
    await db.insert(elements).values([
      {
        code: 'B001-2024-001',
        type: 'beam',
        status: 'production',
        drawing: 'DWG-B001',
        batch: 'BATCH-2024-01',
        gost: 'ГОСТ 8239-89',
        length: 6000,
        width: 200,
        height: 200,
        weight: 150.5,
      },
      {
        code: 'C001-2024-001',
        type: 'column',
        status: 'ready_to_ship',
        drawing: 'DWG-C001',
        batch: 'BATCH-2024-01',
        gost: 'ГОСТ 8732-78',
        length: 3000,
        width: 300,
        height: 300,
        weight: 280.0,
      },
      {
        code: 'T001-2024-001',
        type: 'truss',
        status: 'in_storage',
        drawing: 'DWG-T001',
        batch: 'BATCH-2024-02',
        gost: 'ГОСТ 23279-85',
        length: 12000,
        width: 2000,
        height: 1500,
        weight: 420.0,
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