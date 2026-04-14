import mysql from "mysql2/promise";
import { config } from "../config/config.js";

let pool;

export function getMysqlConfig() {
  return {
    host: config.MYSQL_HOST,
    port: config.MYSQL_PORT,
    database: config.MYSQL_DATABASE,
    user: config.MYSQL_USER,
    password: config.MYSQL_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
}

export function getMysqlPool() {
  if (!pool) {
    pool = mysql.createPool(getMysqlConfig());
  }

  return pool;
}

export async function testMysqlConnection() {
  const mysqlPool = getMysqlPool();
  const connection = await mysqlPool.getConnection();

  try {
    await connection.ping();
    return true;
  } finally {
    connection.release();
  }
}

export async function closeMysqlPool() {
  if (!pool) return;
  await pool.end();
  pool = null;
}
