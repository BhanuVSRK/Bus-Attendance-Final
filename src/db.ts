import knex from 'knex';

const isProd = process.env.DATABASE_URL;

if (isProd) {
  console.log("Using PostgreSQL database (Production mode)");
} else {
  console.log("Using SQLite database (Development mode)");
}

const db = knex({
  client: isProd ? 'pg' : 'sqlite3',
  connection: isProd ? {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  } : {
    filename: process.env.DATABASE_PATH || 'bus_attendance.db'
  },
  useNullAsDefault: true
});

export async function initDb() {
  // Create buses table
  if (!await db.schema.hasTable('buses')) {
    await db.schema.createTable('buses', (table) => {
      table.string('bus_number').primary();
      table.string('driver_name').notNullable();
      table.string('driver_phone');
      table.string('route').notNullable();
      table.string('route_from_to');
      table.integer('capacity').defaultTo(50);
      table.string('password').defaultTo('driver123');
    });
  }

  // Create students table
  if (!await db.schema.hasTable('students')) {
    await db.schema.createTable('students', (table) => {
      table.string('student_id').primary();
      table.string('name').notNullable();
      table.string('department').notNullable();
      table.string('bus_number').notNullable().references('bus_number').inTable('buses');
      table.string('phone');
    });
  }

  // Create attendance table
  if (!await db.schema.hasTable('attendance')) {
    await db.schema.createTable('attendance', (table) => {
      table.increments('attendance_id').primary();
      table.string('student_id').notNullable().references('student_id').inTable('students');
      table.string('bus_number').notNullable().references('bus_number').inTable('buses');
      table.string('date').notNullable();
      table.string('time').notNullable();
      table.string('scan_type').notNullable(); // BOARD or DROP
    });
  }

  // Create admins table
  if (!await db.schema.hasTable('admins')) {
    await db.schema.createTable('admins', (table) => {
      table.string('username').primary();
      table.string('password').notNullable();
    });
    
    // Seed admin
    await db('admins').insert({ username: 'admin', password: 'admin123' }).onConflict('username').ignore();
  }

  // Seed sample buses if empty
  const busCount = await db('buses').count('bus_number as count').first();
  if (Number(busCount?.count) === 0) {
    const buses = [];
    for (let i = 1; i <= 31; i++) {
      buses.push({
        bus_number: `BUS${i.toString().padStart(2, '0')}`,
        driver_name: `Driver ${i}`,
        driver_phone: `+91 90000${i.toString().padStart(5, '0')}`,
        route: `Route ${i}`,
        route_from_to: `Campus to Point ${i}`,
        capacity: 50,
        password: 'driver123'
      });
    }
    await db('buses').insert(buses);
  }
}

export default db;
