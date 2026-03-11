(function () {
  const html = document.documentElement;
  const btn = document.getElementById("themeToggle");
  const year = document.getElementById("year");

  // year footer
  if (year) year.textContent = new Date().getFullYear();

  // init theme from localStorage or default
  const saved = localStorage.getItem("theme");
  const initialTheme = saved || "light";
  html.setAttribute("data-bs-theme", initialTheme);

  // set icon
  if (btn) btn.textContent = initialTheme === "dark" ? "☀️" : "🌙";

  // toggle
  if (btn) {
    btn.addEventListener("click", () => {
      const current = html.getAttribute("data-bs-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      html.setAttribute("data-bs-theme", next);
      localStorage.setItem("theme", next);
      btn.textContent = next === "dark" ? "☀️" : "🌙";
      renderSalesChart();
    });
  }
  // Chart.js (Dashboard) - theme aware
  const chartCanvas = document.getElementById("salesChart");

  function getCssVar(name) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
  }

  function renderSalesChart() {
    if (!chartCanvas || !window.Chart) return;

    const ctx = chartCanvas.getContext("2d");

    // Pega cores do Bootstrap conforme o tema atual
    const textColor = getCssVar("--bs-body-color") || "#212529";
    const gridColor = getCssVar("--bs-border-color") || "rgba(0,0,0,.1)";
    const primary = getCssVar("--bs-primary") || "#0d6efd";

    // Destroy if already exists (avoid duplicationn)
    if (chartCanvas._chart) chartCanvas._chart.destroy();

    chartCanvas._chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
          "Jan",
          "Feb",
          "Mar",
        ],
        datasets: [
          {
            label: "Sales",
            data: [
              1200, 1400, 1350, 1600, 1550, 1700, 1650, 1800, 2100, 1950, 2200,
              2400,
            ],
            tension: 0.35,
            fill: false,
            borderColor: primary,
            borderWidth: 2,
            pointRadius: 2,
            pointHoverRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: textColor },
            grid: { color: gridColor },
          },
          y: {
            ticks: {
              color: textColor,
              callback: (v) => `$${v}`,
            },
            grid: { color: gridColor },
          },
        },
      },
    });
  }

  function loadDashboardMetrics() {
    const usersRaw = localStorage.getItem("admin_users_v1");
    const ordersRaw = localStorage.getItem("olympus_orders");

    let users = [];
    let orders = [];

    try {
      users = usersRaw ? JSON.parse(usersRaw) : [];
    } catch {
      users = [];
    }

    try {
      orders = ordersRaw ? JSON.parse(ordersRaw) : [];
    } catch {
      orders = [];
    }

    const totalUsers = users.length;
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(
      (order) => order.status === "Pending",
    ).length;
    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0,
    );

    const totalUsersEl = document.getElementById("totalUsers");
    const totalOrdersEl = document.getElementById("totalOrders");
    const pendingOrdersEl = document.getElementById("pendingOrders");
    const totalRevenueEl = document.getElementById("totalRevenue");

    if (totalUsersEl) totalUsersEl.textContent = totalUsers;
    if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
    if (pendingOrdersEl) pendingOrdersEl.textContent = pendingOrders;
    if (totalRevenueEl)
      totalRevenueEl.textContent = `$${totalRevenue.toFixed(2)}`;
  }

  function updateCurrentDateTime() {
    const dateTimeEl = document.getElementById("currentDateTime");
    if (!dateTimeEl) return;

    const now = new Date();

    const formatted = now.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    dateTimeEl.textContent = formatted;
  }

  function loadStoredSettings() {
    const raw = localStorage.getItem("olympus_settings");

    if (!raw) {
      return {
        companyName: "Olympus Admin Inc.",
      };
    }

    try {
      const parsed = JSON.parse(raw);
      return {
        companyName: parsed.companyName || "Olympus Admin Inc.",
      };
    } catch {
      return {
        companyName: "Olympus Admin Inc.",
      };
    }
  }

  function applyBranding() {
    const settings = loadStoredSettings();
    const companyName = settings.companyName || "Olympus Admin Inc.";

    const brandNameEls = document.querySelectorAll("[data-brand-name]");
    const brandSubtitleEls = document.querySelectorAll("[data-brand-subtitle]");
    const pageTitleEls = document.querySelectorAll("[data-brand-title]");

    brandNameEls.forEach((el) => {
      el.textContent = companyName;
    });

    brandSubtitleEls.forEach((el) => {
      el.textContent = "Control Center";
    });

    pageTitleEls.forEach((el) => {
      if (!document.title.includes("•")) return;
      const currentSection = document.title.split("•")[0].trim();
      document.title = `${currentSection} • ${companyName}`;
    });
  }

  function updateSidebarCounts() {
    const usersRaw = localStorage.getItem("admin_users_v1");
    const ordersRaw = localStorage.getItem("olympus_orders");

    let users = [];
    let orders = [];

    try {
      users = usersRaw ? JSON.parse(usersRaw) : [];
    } catch {
      users = [];
    }

    try {
      orders = ordersRaw ? JSON.parse(ordersRaw) : [];
    } catch {
      orders = [];
    }

    const usersCountEl = document.getElementById("usersCount");
    const ordersCountEl = document.getElementById("ordersCount");

    if (usersCountEl) usersCountEl.textContent = users.length;
    if (ordersCountEl) ordersCountEl.textContent = orders.length;
  }

  // Render inicial
  renderSalesChart();
  loadDashboardMetrics();
  updateSidebarCounts();
  updateCurrentDateTime();
  setInterval(updateCurrentDateTime, 60000);
  applyBranding();
})();
