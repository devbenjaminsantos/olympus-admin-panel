$(document).ready(function () {
  const STORAGE_KEY = "olympus_orders";

  let editingRow = null;
  let editingId = null;

  const table = $("#ordersTable").DataTable({
    pageLength: 5,
    lengthMenu: [5, 10, 25, 50],
    order: [[3, "desc"]],
    language: {
      search: "Search:",
      lengthMenu: "Show *MENU* orders",
      info: "Showing *START* to *END* of *TOTAL* orders",
      paginate: {
        previous: "Prev",
        next: "Next",
      },
    },
  });

  function getDefaultOrders() {
    return [
      {
        id: crypto.randomUUID(),
        orderId: "#1001",
        customer: "Ava Johnson",
        product: "Premium Plan",
        date: "2026-03-01",
        status: "Paid",
        total: 120.0,
      },
      {
        id: crypto.randomUUID(),
        orderId: "#1002",
        customer: "Noah Smith",
        product: "Business Plan",
        date: "2026-03-02",
        status: "Pending",
        total: 250.0,
      },
      {
        id: crypto.randomUUID(),
        orderId: "#1003",
        customer: "Mia Brown",
        product: "Starter Plan",
        date: "2026-03-03",
        status: "Cancelled",
        total: 80.0,
      },
      {
        id: crypto.randomUUID(),
        orderId: "#1004",
        customer: "Liam Davis",
        product: "Enterprise Plan",
        date: "2026-03-04",
        status: "Paid",
        total: 540.0,
      },
      {
        id: crypto.randomUUID(),
        orderId: "#1005",
        customer: "Sophia Miller",
        product: "Premium Plan",
        date: "2026-03-05",
        status: "Pending",
        total: 120.0,
      },
      {
        id: crypto.randomUUID(),
        orderId: "#1006",
        customer: "Ethan Wilson",
        product: "Starter Plan",
        date: "2026-03-05",
        status: "Paid",
        total: 80.0,
      },
      {
        id: crypto.randomUUID(),
        orderId: "#1007",
        customer: "Isabella Moore",
        product: "Business Plan",
        date: "2026-03-06",
        status: "Cancelled",
        total: 250.0,
      },
      {
        id: crypto.randomUUID(),
        orderId: "#1008",
        customer: "Lucas Taylor",
        product: "Enterprise Plan",
        date: "2026-03-07",
        status: "Paid",
        total: 540.0,
      },
      {
        id: crypto.randomUUID(),
        orderId: "#1009",
        customer: "Emma White",
        product: "Premium Plan",
        date: "2026-03-07",
        status: "Pending",
        total: 120.0,
      },
      {
        id: crypto.randomUUID(),
        orderId: "#1010",
        customer: "James Harris",
        product: "Starter Plan",
        date: "2026-03-08",
        status: "Paid",
        total: 80.0,
      },
    ];
  }

  function loadOrders() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      const defaults = getDefaultOrders();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }

    try {
      return JSON.parse(saved);
    } catch {
      const defaults = getDefaultOrders();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }
  }

  function saveOrders(orders) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }

  function getOrders() {
    return loadOrders();
  }

  function getStatusBadge(status) {
    if (status === "Paid") {
      return `<span class="badge text-bg-success">Paid</span>`;
    }

    if (status === "Pending") {
      return `<span class="badge text-bg-warning">Pending</span>`;
    }

    return `<span class="badge text-bg-danger">Cancelled</span>`;
  }

  function getActionButtons() {
    return `
    <div class="d-flex gap-2">         
    <button class="btn btn-sm btn-outline-primary edit-order">Edit</button>         
    <button class="btn btn-sm btn-outline-danger delete-order">Delete</button>      
     </div>`;
  }

  function formatRow(order) {
    return [
      order.orderId,
      order.customer,
      order.product,
      order.date,
      getStatusBadge(order.status),
      `$${Number(order.total).toFixed(2)}`,
      getActionButtons(),
    ];
  }

  function renderOrders() {
    const orders = getOrders();

    table.clear();

    orders.forEach((order) => {
      const rowNode = table.row.add(formatRow(order)).draw(false).node();
      $(rowNode).attr("data-id", order.id);
    });

    table.order([3, "desc"]).draw();
  }

  function resetForm() {
    const form = document.getElementById("orderForm");
    form.reset();
    form.classList.remove("was-validated");
    editingRow = null;
    editingId = null;
    $("#orderModalLabel").text("New Order");
  }

  function findOrderById(id) {
    return getOrders().find((order) => order.id === id);
  }

  function showToast(message) {
    $("#ordersToastBody").text(message);
    const toastElement = document.getElementById("ordersToast");
    const toast = bootstrap.Toast.getOrCreateInstance(toastElement);
    toast.show();
  }

  function exportOrdersCSV() {
    const orders = getOrders();

    if (!orders.length) {
      showToast("No orders to export.");
      return;
    }

    const headers = [
      "Order ID",
      "Customer",
      "Product",
      "Date",
      "Status",
      "Total",
    ];

    const rows = orders.map((order) => [
      order.orderId,
      order.customer,
      order.product,
      order.date,
      order.status,
      order.total,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Orders exported successfully.");
  }

  function updateStatusFilter() {
    $("#statusFilter")
      .off("change")
      .on("change", function () {
        const value = $(this).val();
        if (value) {
          table.column(4).search(value).draw();
        } else {
          table.column(4).search("").draw();
        }
      });
  }

  renderOrders();
  updateStatusFilter();

  $("#orderForm").on("submit", function (e) {
    e.preventDefault();

    const form = this;

    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    const orderId = $("#orderId").val().trim();
    const customer = $("#customer").val().trim();
    const product = $("#product").val();
    const date = $("#date").val();
    const status = $("#status").val();
    const total = parseFloat($("#total").val()).toFixed(2);

    const orders = getOrders();

    if (editingId) {
      const updatedOrders = orders.map((order) =>
        order.id === editingId
          ? {
              ...order,
              orderId,
              customer,
              product,
              date,
              status,
              total: Number(total),
            }
          : order,
      );

      saveOrders(updatedOrders);
      renderOrders();
      showToast("Order updated successfully.");
    } else {
      const newOrder = {
        id: crypto.randomUUID(),
        orderId,
        customer,
        product,
        date,
        status,
        total: Number(total),
      };

      orders.push(newOrder);
      saveOrders(orders);
      renderOrders();
      showToast("Order created successfully.");
    }

    resetForm();

    const modalEl = document.getElementById("orderModal");
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    modalInstance.hide();
  });

  $("#ordersTable tbody").on("click", ".delete-order", function () {
    const row = $(this).closest("tr");
    const id = row.attr("data-id");

    if (!id) return;

    $("#confirmDeleteModal").attr("data-id", id);
    const confirmModal = new bootstrap.Modal(
      document.getElementById("confirmDeleteModal"),
    );
    confirmModal.show();
  });

  $("#confirmDeleteBtn").on("click", function () {
    const modalEl = document.getElementById("confirmDeleteModal");
    const id = $("#confirmDeleteModal").attr("data-id");

    if (!id) return;

    const orders = getOrders().filter((order) => order.id !== id);
    saveOrders(orders);
    renderOrders();
    showToast("Order deleted successfully.");

    const confirmModal = bootstrap.Modal.getInstance(modalEl);
    confirmModal.hide();
  });

  $("#ordersTable tbody").on("click", ".edit-order", function () {
    const row = $(this).closest("tr");
    const id = row.attr("data-id");

    if (!id) return;

    const order = findOrderById(id);
    if (!order) return;

    editingRow = row;
    editingId = id;

    $("#orderId").val(order.orderId);
    $("#customer").val(order.customer);
    $("#product").val(order.product);
    $("#date").val(order.date);
    $("#status").val(order.status);
    $("#total").val(order.total);

    $("#orderModalLabel").text("Edit Order");

    const modal = new bootstrap.Modal(document.getElementById("orderModal"));
    modal.show();
  });

  $("#orderModal").on("hidden.bs.modal", function () {
    resetForm();
  });

  $("#resetOrdersDemo").on("click", function () {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getDefaultOrders()));
    renderOrders();
    showToast("Sample orders restored.");
  });

  $("#exportOrderCSV").on("click", function () {
    exportOrdersCSV();
  });
});
