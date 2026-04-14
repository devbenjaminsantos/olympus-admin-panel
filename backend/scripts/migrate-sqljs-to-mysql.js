import fs from "fs";
import path from "path";
import initSqlJs from "sql.js";
import { config } from "../src/config/config.js";
import {
  closeMysqlPool,
  getMysqlPool,
  initializeMysqlSchema,
} from "../src/db/mysql.js";

function resolveSqljsPath() {
  return path.resolve(process.cwd(), config.DATABASE_URL || "./admin-panel.db");
}

function loadRows(database, sql) {
  const statement = database.prepare(sql);
  const rows = [];

  while (statement.step()) {
    rows.push(statement.getAsObject());
  }

  statement.free();
  return rows;
}

async function main() {
  const sourcePath = resolveSqljsPath();

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`SQL.js source database not found at ${sourcePath}`);
  }

  await initializeMysqlSchema();

  const SQL = await initSqlJs();
  const filebuffer = fs.readFileSync(sourcePath);
  const sourceDb = new SQL.Database(filebuffer);
  const mysqlPool = getMysqlPool();

  const users = loadRows(sourceDb, "SELECT * FROM users");
  const orders = loadRows(sourceDb, "SELECT * FROM orders");
  const notifications = loadRows(sourceDb, "SELECT * FROM notifications");
  const analytics = loadRows(sourceDb, "SELECT * FROM analytics");

  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();

    for (const user of users) {
      await connection.execute(
        `
          INSERT INTO users (id, name, email, password, role, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            email = VALUES(email),
            password = VALUES(password),
            role = VALUES(role),
            status = VALUES(status),
            created_at = VALUES(created_at),
            updated_at = VALUES(updated_at)
        `,
        [
          user.id,
          user.name,
          user.email,
          user.password,
          user.role,
          user.status,
          user.created_at,
          user.updated_at,
        ],
      );
    }

    for (const order of orders) {
      await connection.execute(
        `
          INSERT INTO orders (id, order_id, customer_id, product, quantity, date, status, total, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            order_id = VALUES(order_id),
            customer_id = VALUES(customer_id),
            product = VALUES(product),
            quantity = VALUES(quantity),
            date = VALUES(date),
            status = VALUES(status),
            total = VALUES(total),
            created_at = VALUES(created_at),
            updated_at = VALUES(updated_at)
        `,
        [
          order.id,
          order.order_id,
          order.customer_id,
          order.product,
          order.quantity,
          order.date,
          order.status,
          order.total,
          order.created_at,
          order.updated_at,
        ],
      );
    }

    for (const notification of notifications) {
      await connection.execute(
        `
          INSERT INTO notifications (id, user_id, type, title, message, \`read\`, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            user_id = VALUES(user_id),
            type = VALUES(type),
            title = VALUES(title),
            message = VALUES(message),
            \`read\` = VALUES(\`read\`),
            created_at = VALUES(created_at)
        `,
        [
          notification.id,
          notification.user_id,
          notification.type,
          notification.title,
          notification.message,
          notification.read,
          notification.created_at,
        ],
      );
    }

    for (const item of analytics) {
      await connection.execute(
        `
          INSERT INTO analytics (id, user_id, action, resource, details, ip_address, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            user_id = VALUES(user_id),
            action = VALUES(action),
            resource = VALUES(resource),
            details = VALUES(details),
            ip_address = VALUES(ip_address),
            created_at = VALUES(created_at)
        `,
        [
          item.id,
          item.user_id || null,
          item.action,
          item.resource,
          item.details || null,
          item.ip_address || null,
          item.created_at,
        ],
      );
    }

    await connection.commit();

    console.log(`✅ Migration completed from ${sourcePath}`);
    console.log(`👥 Users: ${users.length}`);
    console.log(`📦 Orders: ${orders.length}`);
    console.log(`🔔 Notifications: ${notifications.length}`);
    console.log(`📊 Analytics: ${analytics.length}`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    sourceDb.close();
  }
}

main()
  .catch((error) => {
    console.error("❌ Failed to migrate SQL.js data to MySQL:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeMysqlPool();
  });
