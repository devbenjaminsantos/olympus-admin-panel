import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "../config/config.js";
import { hashPassword } from "../utils/auth.js";
import { generateId } from "../utils/helpers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../../admin-panel.db");

let db = null;
let SQL = null;

async function initializeDatabase() {
  SQL = await initSqlJs();

  // Tentar carregar BD existente
  if (fs.existsSync(dbPath)) {
    const filebuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(filebuffer);
  } else {
    db = new SQL.Database();
  }

  // Criar tabelas
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'manager', 'user')),
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_id TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL,
      product TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      date DATE NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'cancelled')),
      total REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS analytics (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      resource TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  await seedDefaultAdmin();

  console.log("✅ Database initialized successfully");
}

async function seedDefaultAdmin() {
  const stmt = db.prepare("SELECT id FROM users WHERE email = ?");
  stmt.bind([config.DEFAULT_ADMIN_EMAIL]);
  const hasAdmin = stmt.step();
  stmt.free();

  if (hasAdmin) return;

  const password = await hashPassword(config.DEFAULT_ADMIN_PASSWORD);

  db.run(
    `
      INSERT INTO users (id, name, email, password, role, status)
      VALUES (?, ?, ?, ?, 'admin', 'active')
    `,
    [
      generateId(),
      config.DEFAULT_ADMIN_NAME,
      config.DEFAULT_ADMIN_EMAIL,
      password,
    ],
  );

  saveDatabase();
  console.log(
    `🔐 Default admin created: ${config.DEFAULT_ADMIN_EMAIL} / ${config.DEFAULT_ADMIN_PASSWORD}`,
  );
}

// Wrapper para interface compatível
const dbWrapper = {
  prepare: (sql) => ({
    run: (...params) => {
      db.run(sql, params);
      saveDatabase();
      return { changes: db.getRowsModified() };
    },
    get: (...params) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
      return null;
    },
    all: (...params) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const result = [];
      while (stmt.step()) {
        result.push(stmt.getAsObject());
      }
      stmt.free();
      return result;
    },
  }),
  exec: (sql) => {
    db.run(sql);
    saveDatabase();
  },
};

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

export { initializeDatabase, SQL };
export default dbWrapper;
