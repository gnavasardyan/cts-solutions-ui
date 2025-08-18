import { db } from './db';
import { users } from '@shared/schema';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const roleUsers = [
  {
    email: 'customer@example.com',
    password: 'operator123',
    role: 'customer_operator',
    name: 'Клиентский оператор',
    isActive: true
  },
  {
    email: 'factory@example.com',
    password: 'operator123',
    role: 'factory_operator', 
    name: 'Заводской оператор',
    isActive: true
  },
  {
    email: 'warehouse@example.com',
    password: 'operator123',
    role: 'warehouse_keeper',
    name: 'Складской работник', 
    isActive: true
  },
  {
    email: 'site@example.com',
    password: 'operator123',
    role: 'site_master',
    name: 'Мастер участка',
    isActive: true
  },
  {
    email: 'auditor@example.com',
    password: 'operator123',
    role: 'auditor',
    name: 'Аудитор',
    isActive: true
  },
  {
    email: 'admin@example.com',
    password: 'admin123',
    role: 'administrator',
    name: 'Администратор',
    isActive: true
  }
];

export async function initializeRoleUsers() {
  console.log('🔐 Инициализация пользователей для всех ролей...');
  
  try {
    for (const userData of roleUsers) {
      // Проверяем, существует ли пользователь
      const existingUser = await db.select().from(users).where(eq(users.email, userData.email)).get();
      
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        const now = Math.floor(Date.now() / 1000);
        
        await db.insert(users).values({
          id: nanoid(),
          email: userData.email,
          password: hashedPassword,
          firstName: userData.name,
          role: userData.role as any,
          isActive: userData.isActive ? 'true' : 'false',
          createdAt: now,
          updatedAt: now
        });
        
        console.log(`✅ Создан пользователь: ${userData.name} (${userData.email}) - роль: ${userData.role}`);
      } else {
        console.log(`⚠️  Пользователь уже существует: ${userData.name} (${userData.email})`);
      }
    }
    
    console.log('🎉 Инициализация пользователей завершена!');
    console.log('\n📋 Тестовые учетные данные:');
    console.log('Клиентский оператор: customer@example.com / operator123');
    console.log('Заводской оператор: factory@example.com / operator123');
    console.log('Складской работник: warehouse@example.com / operator123');
    console.log('Мастер участка: site@example.com / operator123');
    console.log('Аудитор: auditor@example.com / operator123');
    console.log('Администратор: admin@example.com / admin123');
    
  } catch (error) {
    console.error('❌ Ошибка при инициализации пользователей:', error);
    throw error;
  }
}

// Импортируем eq из drizzle-orm
import { eq } from 'drizzle-orm';

// Запускаем инициализацию
initializeRoleUsers().catch(console.error);