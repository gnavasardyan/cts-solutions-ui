import Database from 'better-sqlite3';

const sqlite = new Database('./database.sqlite');

async function addFactoryIdToUsers() {
  console.log('Adding factory_id column to users table...');
  
  try {
    // Add factory_id column to users table
    sqlite.exec(`
      ALTER TABLE users ADD COLUMN factory_id TEXT;
    `);
    
    console.log('Successfully added factory_id column to users table');
    
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('Column factory_id already exists in users table');
    } else {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  } finally {
    sqlite.close();
  }
}

addFactoryIdToUsers();