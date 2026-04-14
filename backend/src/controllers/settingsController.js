import db from "../db/database.js";

function normalizeSettings(row) {
  return {
    id: row.id,
    companyName: row.company_name,
    supportEmail: row.support_email,
    defaultRole: row.default_role,
    dashboardView: row.dashboard_view,
    emailNotifications: Boolean(row.email_notifications),
    weeklyReports: Boolean(row.weekly_reports),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getSettings(req, res) {
  try {
    const settings = await db
      .prepare(
        `
        SELECT
          id, company_name, support_email, default_role, dashboard_view,
          email_notifications, weekly_reports, created_at, updated_at
        FROM settings
        WHERE id = ?
      `,
      )
      .get("global");

    if (!settings) {
      return res.status(404).json({ error: "Settings not found" });
    }

    res.json(normalizeSettings(settings));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateSettings(req, res) {
  try {
    const {
      companyName,
      supportEmail,
      defaultRole,
      dashboardView,
      emailNotifications,
      weeklyReports,
    } = req.body;

    const current = await db
      .prepare("SELECT * FROM settings WHERE id = ?")
      .get("global");

    if (!current) {
      return res.status(404).json({ error: "Settings not found" });
    }

    await db
      .prepare(
        `
        UPDATE settings SET
          company_name = ?,
          support_email = ?,
          default_role = ?,
          dashboard_view = ?,
          email_notifications = ?,
          weekly_reports = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      )
      .run(
        companyName || current.company_name,
        supportEmail || current.support_email,
        defaultRole || current.default_role,
        dashboardView || current.dashboard_view,
        Number(
          emailNotifications !== undefined
            ? emailNotifications
            : current.email_notifications,
        ),
        Number(
          weeklyReports !== undefined ? weeklyReports : current.weekly_reports,
        ),
        "global",
      );

    const updated = await db
      .prepare(
        `
        SELECT
          id, company_name, support_email, default_role, dashboard_view,
          email_notifications, weekly_reports, created_at, updated_at
        FROM settings
        WHERE id = ?
      `,
      )
      .get("global");

    res.json({ message: "Settings updated", settings: normalizeSettings(updated) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function resetSettings(req, res) {
  try {
    await db
      .prepare(
        `
        UPDATE settings SET
          company_name = ?,
          support_email = ?,
          default_role = ?,
          dashboard_view = ?,
          email_notifications = ?,
          weekly_reports = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      )
      .run(
        "Olympus Admin Inc.",
        "support@example.com",
        "user",
        "overview",
        1,
        0,
        "global",
      );

    const reset = await db
      .prepare(
        `
        SELECT
          id, company_name, support_email, default_role, dashboard_view,
          email_notifications, weekly_reports, created_at, updated_at
        FROM settings
        WHERE id = ?
      `,
      )
      .get("global");

    res.json({ message: "Settings restored", settings: normalizeSettings(reset) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
