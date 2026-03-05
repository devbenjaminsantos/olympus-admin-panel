// assets/js/app.js

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
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function renderSalesChart() {
    if (!chartCanvas || !window.Chart) return;

    const ctx = chartCanvas.getContext("2d");

    // Pega cores do Bootstrap conforme o tema atual
    const textColor = getCssVar("--bs-body-color") || "#212529";
    const gridColor = getCssVar("--bs-border-color") || "rgba(0,0,0,.1)";
    const primary = getCssVar("--bs-primary") || "#0d6efd";

    // Destrói se já existe (evita duplicar)
    if (chartCanvas._chart) chartCanvas._chart.destroy();

    chartCanvas._chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
        datasets: [
          {
            label: "Sales",
            data: [1200, 1400, 1350, 1600, 1550, 1700, 1650, 1800, 2100, 1950, 2200, 2400],
            tension: 0.35,
            fill: false,
            borderColor: primary,     // fica bem visível nos dois temas
            borderWidth: 2,
            pointRadius: 2,
            pointHoverRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: textColor },
            grid: { color: gridColor }
          },
          y: {
            ticks: {
              color: textColor,
              callback: (v) => `$${v}`
            },
            grid: { color: gridColor }
          }
        }
      }
    });
  }

  // Render inicial
  renderSalesChart();
})();