import initSqlJs, { Database } from 'sql.js';

let db: Database | null = null;
let SQL: any = null;

// Initialize the database
export async function initDatabase() {
  if (db) return db;

  try {
    SQL = await initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`
    });

    // Try to load existing database from localStorage
    const savedDb = localStorage.getItem('dermaDB');
    if (savedDb) {
      const buffer = Uint8Array.from(atob(savedDb), c => c.charCodeAt(0));
      db = new SQL.Database(buffer);
      console.log('Database loaded from localStorage');
    } else {
      db = new SQL.Database();
      await createTables();
      await seedInitialData();
      saveDatabase();
      console.log('New database created');
    }

    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Create all tables
async function createTables() {
  if (!db) return;

  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('clinician', 'patient')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Patients table
  db.run(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      clinician_id INTEGER NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      date_of_birth DATE,
      gender TEXT,
      phone TEXT,
      email TEXT,
      medical_history TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (clinician_id) REFERENCES users(id)
    )
  `);

  // Visits table
  db.run(`
    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      clinician_id INTEGER NOT NULL,
      visit_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      diagnosis TEXT,
      notes TEXT,
      treatment_plan TEXT,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (clinician_id) REFERENCES users(id)
    )
  `);

  // Images table
  db.run(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visit_id INTEGER NOT NULL,
      image_data TEXT NOT NULL,
      image_type TEXT,
      body_part TEXT,
      notes TEXT,
      ai_analysis TEXT,
      heatmap_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (visit_id) REFERENCES visits(id)
    )
  `);

  // Progress metrics table
  db.run(`
    CREATE TABLE IF NOT EXISTS progress_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      visit_id INTEGER NOT NULL,
      metric_type TEXT,
      metric_value REAL,
      comparison_data TEXT,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (visit_id) REFERENCES visits(id)
    )
  `);

  // Reports table
  db.run(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      clinician_id INTEGER NOT NULL,
      report_type TEXT,
      report_data TEXT,
      status TEXT DEFAULT 'draft',
      approved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (clinician_id) REFERENCES users(id)
    )
  `);

  console.log('Tables created successfully');
}

// Seed initial data
async function seedInitialData() {
  if (!db) return;

  // Create default clinician account
  db.run(`
    INSERT INTO users (email, password, role) 
    VALUES ('doctor@derma.app', 'doctor123', 'clinician')
  `);

  // Create default patient account
  db.run(`
    INSERT INTO users (email, password, role) 
    VALUES ('patient@derma.app', 'patient123', 'patient')
  `);

  // Create a sample patient profile
  db.run(`
    INSERT INTO patients (user_id, clinician_id, first_name, last_name, date_of_birth, gender, phone, email)
    VALUES (2, 1, 'John', 'Doe', '1990-05-15', 'Male', '555-0123', 'patient@derma.app')
  `);

  console.log('Initial data seeded');
}

// Save database to localStorage
export function saveDatabase() {
  if (!db) return;
  
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    const base64 = buffer.toString('base64');
    localStorage.setItem('dermaDB', base64);
    console.log('Database saved to localStorage');
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

// Get database instance
export function getDatabase() {
  return db;
}

// Execute query
export function executeQuery(sql: string, params: any[] = []) {
  if (!db) throw new Error('Database not initialized');
  
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    
    saveDatabase(); // Auto-save after each query
    return results;
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
}

// Execute single query without return
export function runQuery(sql: string, params: any[] = []) {
  if (!db) throw new Error('Database not initialized');
  
  try {
    db.run(sql, params);
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
}

// Clear all data (for testing)
export function clearDatabase() {
  localStorage.removeItem('dermaDB');
  db = null;
  console.log('Database cleared');
}
