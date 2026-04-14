import db from "../db/database.js";
import { generateId, generateOrderId } from "../utils/helpers.js";

export function getAllOrders(req, res) {
  try {
    const orders = db
      .prepare(
        `
      SELECT 
        o.id, o.order_id, o.customer_id, u.name as customer, 
        o.product, o.quantity, o.date, o.status, o.total, o.created_at
      FROM orders o
      LEFT JOIN users u ON o.customer_id = u.id
    `,
      )
      .all();

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function getOrderById(req, res) {
  try {
    const { id } = req.params;
    const order = db
      .prepare(
        `
      SELECT 
        o.id, o.order_id, o.customer_id, u.name as customer,
        o.product, o.quantity, o.date, o.status, o.total, o.created_at
      FROM orders o
      LEFT JOIN users u ON o.customer_id = u.id
      WHERE o.id = ?
    `,
      )
      .get(id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function createOrder(req, res) {
  try {
    const { customer_id, product, quantity, date, total } = req.body;

    if (!customer_id || !product || !quantity || !date || !total) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const id = generateId();
    const orderId = generateOrderId();

    const stmt = db.prepare(`
      INSERT INTO orders (id, order_id, customer_id, product, quantity, date, status, total)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    `);

    stmt.run(id, orderId, customer_id, product, quantity, date, total);

    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    res.status(201).json({ message: "Order created", order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function updateOrder(req, res) {
  try {
    const { id } = req.params;
    const { product, quantity, date, status, total } = req.body;

    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const stmt = db.prepare(`
      UPDATE orders SET 
        product = ?, 
        quantity = ?, 
        date = ?, 
        status = ?, 
        total = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      product || order.product,
      quantity || order.quantity,
      date || order.date,
      status || order.status,
      total || order.total,
      id,
    );

    const updated = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    res.json({ message: "Order updated", order: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function deleteOrder(req, res) {
  try {
    const { id } = req.params;

    const stmt = db.prepare("DELETE FROM orders WHERE id = ?");
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ message: "Order deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function getOrderStats(req, res) {
  try {
    const stats = {
      total: db.prepare("SELECT COUNT(*) as count FROM orders").get().count,
      totalRevenue:
        db.prepare("SELECT SUM(total) as total FROM orders").get().total || 0,
      pending: db
        .prepare(
          "SELECT COUNT(*) as count FROM orders WHERE status = 'pending'",
        )
        .get().count,
      paid: db
        .prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'paid'")
        .get().count,
      cancelled: db
        .prepare(
          "SELECT COUNT(*) as count FROM orders WHERE status = 'cancelled'",
        )
        .get().count,
      byMonth: db
        .prepare(
          `
        SELECT 
          strftime('%Y-%m', date) as month,
          COUNT(*) as orders,
          SUM(total) as revenue
        FROM orders
        GROUP BY month
        ORDER BY month DESC
        LIMIT 12
      `,
        )
        .all(),
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
