(function () {
  // ── Constantes ───────────────────────────────────────
  const STORAGE_KEY = "admin_users_v1";
  const pageSize = 7;

  // ── Elementos do DOM ─────────────────────────────────
  const tbody = document.getElementById("usersTbody");
  const resultsMeta = document.getElementById("resultsMeta");
  const pageMeta = document.getElementById("pageMeta");
  const pagination = document.getElementById("pagination");

  const searchInput = document.getElementById("searchInput");
  const searchInputMobile = document.getElementById("searchInputMobile");
  const statusFilter = document.getElementById("statusFilter");
  const sortBy = document.getElementById("sortBy");
  const exportCsvBtn = document.getElementById("exportCsv");
  const resetDataBtn = document.getElementById("resetData");

  // Modal de criação/edição de usuário
  const userModalEl = document.getElementById("userModal");
  const userModal = userModalEl
    ? bootstrap.Modal.getOrCreateInstance(userModalEl)
    : null;
  const userForm = document.getElementById("userForm");
  const userModalLabel = document.getElementById("userModalLabel");
  const deleteBtn = document.getElementById("deleteBtn");

  const userId = document.getElementById("userId");
  const nameEl = document.getElementById("name");
  const emailEl = document.getElementById("email");
  const statusEl = document.getElementById("status");
  const roleEl = document.getElementById("role");

  // Modal de confirmação de exclusão
  const confirmDeleteModalEl = document.getElementById("confirmDeleteModal");
  const confirmDeleteModal = confirmDeleteModalEl
    ? bootstrap.Modal.getOrCreateInstance(confirmDeleteModalEl)
    : null;
  const confirmDeleteBtn = document.getElementById("confirmUserDeleteBtn");

  // Modal de confirmação de reset
  const confirmResetModalEl = document.getElementById("confirmResetModal");
  const confirmResetModal = confirmResetModalEl
    ? bootstrap.Modal.getOrCreateInstance(confirmResetModalEl)
    : null;
  const confirmResetBtn = document.getElementById("confirmResetBtn");

  // Toast
  const toastEl = document.getElementById("usersToast");
  const toastBody = document.getElementById("usersToastBody");
  const toast = toastEl
    ? bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 2200 })
    : null;

  // ── Estado ───────────────────────────────────────────
  let allUsers = [];
  let page = 1;
  let pendingDeleteId = null;

  // ── Utilitários ──────────────────────────────────────
  function showToast(message) {
    if (!toast || !toastBody) return;
    toastBody.textContent = message;
    toast.show();
  }

  function uid() {
    // ok for demo purposes
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  // ── Storage ──────────────────────────────────────────
  function demoUsers() {
    return [
      {
        id: uid(),
        name: "Ava Johnson",
        email: "ava@demo.com",
        status: "active",
        role: "admin",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
      },
      {
        id: uid(),
        name: "Noah Smith",
        email: "noah@demo.com",
        status: "active",
        role: "manager",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
      },
      {
        id: uid(),
        name: "Mia Brown",
        email: "mia@demo.com",
        status: "inactive",
        role: "viewer",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
      },
      {
        id: uid(),
        name: "Liam Davis",
        email: "liam@demo.com",
        status: "active",
        role: "support",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 9,
      },
      {
        id: uid(),
        name: "Sophia Miller",
        email: "sophia@demo.com",
        status: "active",
        role: "viewer",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
      },
      {
        id: uid(),
        name: "Ethan Wilson",
        email: "ethan@demo.com",
        status: "inactive",
        role: "support",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
      },
      {
        id: uid(),
        name: "Isabella Moore",
        email: "isabella@demo.com",
        status: "active",
        role: "manager",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
      },
      {
        id: uid(),
        name: "Lucas Taylor",
        email: "lucas@demo.com",
        status: "active",
        role: "viewer",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
      },
    ];
  }

  function loadUsers() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = demoUsers();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return demoUsers();
    }
  }

  function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  // ── Filtros e ordenação ──────────────────────────────
  function getSearch() {
    const a = (searchInput?.value || "").trim();
    const b = (searchInputMobile?.value || "").trim();
    // prefer the one that user is typing on
    return b.length > a.length ? b : a;
  }

  function applyFilters(users) {
    const q = getSearch().toLowerCase();
    const status = statusFilter?.value || "all";

    let out = [...users];

    if (q) {
      out = out.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q),
      );
    }

    if (status !== "all") {
      out = out.filter((u) => u.status === status);
    }

    const sort = sortBy?.value || "name_asc";
    out.sort((a, b) => {
      if (sort === "name_asc") return a.name.localeCompare(b.name);
      if (sort === "name_desc") return b.name.localeCompare(a.name);
      if (sort === "newest") return b.createdAt - a.createdAt;
      if (sort === "oldest") return a.createdAt - b.createdAt;
      return 0;
    });

    return out;
  }

  // ── Renderização ─────────────────────────────────────
  function roleBadge(role) {
    const map = {
      admin: "danger",
      manager: "primary",
      support: "warning",
      viewer: "secondary",
    };
    const cls = map[role] || "secondary";
    return `<span class="badge text-bg-${cls}">${role}</span>`;
  }

  function statusBadge(status) {
    const cls = status === "active" ? "success" : "secondary";
    const label = status === "active" ? "Active" : "Inactive";
    return `<span class="badge text-bg-${cls}">${label}</span>`;
  }

  function paginate(items, currentPage, size) {
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / size));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const start = (safePage - 1) * size;
    const end = start + size;
    return {
      page: safePage,
      total,
      totalPages,
      items: items.slice(start, end),
      startIndex: total === 0 ? 0 : start + 1,
      endIndex: Math.min(end, total),
    };
  }

  function renderPagination(totalPages, currentPage) {
    if (!pagination) return;
    pagination.innerHTML = "";

    const mkItem = (label, pageNum, disabled, active) => {
      const li = document.createElement("li");
      li.className = `page-item ${disabled ? "disabled" : ""} ${active ? "active" : ""}`;
      const a = document.createElement("a");
      a.className = "page-link";
      a.href = "#";
      a.textContent = label;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        if (disabled) return;
        page = pageNum;
        render();
      });
      li.appendChild(a);
      return li;
    };

    pagination.appendChild(
      mkItem("Prev", currentPage - 1, currentPage === 1, false),
    );

    // Janela compacta de páginas — exibe no máximo 5 botões por vez
    const windowSize = 5;
    let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
    let end = Math.min(totalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);

    for (let p = start; p <= end; p++) {
      pagination.appendChild(mkItem(String(p), p, false, p === currentPage));
    }

    pagination.appendChild(
      mkItem("Next", currentPage + 1, currentPage === totalPages, false),
    );
  }

  function renderTable(rows, offsetIndex) {
    if (!tbody) return;
    tbody.innerHTML = "";

    if (rows.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-body-secondary py-5">
            No users found.
          </td>
        </tr>`;
      return;
    }

    rows.forEach((u, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="text-body-secondary">${offsetIndex + i}</td>
        <td class="fw-semibold">${u.name}</td>
        <td class="text-body-secondary">${u.email}</td>
        <td>${statusBadge(u.status)}</td>
        <td>${roleBadge(u.role)}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${u.id}">Edit</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
      btn.addEventListener("click", () =>
        openEdit(btn.getAttribute("data-id")),
      );
    });
  }

  function render() {
    const filtered = applyFilters(allUsers);
    const p = paginate(filtered, page, pageSize);
    page = p.page;

    if (resultsMeta) resultsMeta.textContent = `${p.total} total result(s)`;
    if (pageMeta)
      pageMeta.textContent = `Showing ${p.startIndex}–${p.endIndex} of ${p.total}`;
    renderTable(p.items, p.startIndex);
    renderPagination(p.totalPages, p.page);
  }

  // ── Modal ────────────────────────────────────────────
  function resetForm() {
    userForm?.classList.remove("was-validated");
    userId.value = "";
    nameEl.value = "";
    emailEl.value = "";
    statusEl.value = "active";
    roleEl.value = "viewer";
    pendingDeleteId = null;

    if (deleteBtn) deleteBtn.classList.add("d-none");
    if (userModalLabel) userModalLabel.textContent = "New user";
  }

  function openCreate() {
    resetForm();
    userModal?.show();
  }

  function openEdit(id) {
    const u = allUsers.find((x) => x.id === id);
    if (!u) return;

    userId.value = u.id;
    nameEl.value = u.name;
    emailEl.value = u.email;
    statusEl.value = u.status;
    roleEl.value = u.role;

    if (deleteBtn) deleteBtn.classList.remove("d-none");
    if (userModalLabel) userModalLabel.textContent = "Edit user";
    userModal?.show();
  }

  function upsertUser(payload) {
    const existingIndex = allUsers.findIndex((u) => u.id === payload.id);

    if (existingIndex >= 0) {
      allUsers[existingIndex] = { ...allUsers[existingIndex], ...payload };
      showToast("User updated.");
    } else {
      allUsers.unshift(payload);
      showToast("User created.");
    }

    saveUsers(allUsers);
    render();
  }

  function deleteUser(id) {
    allUsers = allUsers.filter((u) => u.id !== id);
    saveUsers(allUsers);
    render();
    showToast("User deleted.");
  }

  // ── Export ───────────────────────────────────────────
  function exportCsv(users) {
    const header = ["name", "email", "status", "role", "createdAt"];
    const lines = [
      header.join(","),
      ...users.map((u) =>
        [
          JSON.stringify(u.name),
          JSON.stringify(u.email),
          u.status,
          u.role,
          u.createdAt,
        ].join(","),
      ),
    ];

    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "users.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  // ── Eventos ──────────────────────────────────────────
  function bindEvents() {
    const onFilterChange = () => {
      page = 1;
      render();
    };

    searchInput?.addEventListener("input", onFilterChange);
    searchInputMobile?.addEventListener("input", onFilterChange);
    statusFilter?.addEventListener("change", onFilterChange);
    sortBy?.addEventListener("change", onFilterChange);

    // Confirma exclusão do usuário selecionado
    confirmDeleteBtn?.addEventListener("click", () => {
      if (!pendingDeleteId) return;
      deleteUser(pendingDeleteId);
      pendingDeleteId = null;
      confirmDeleteModal?.hide();
    });

    // Confirma reset dos dados demo
    confirmResetBtn?.addEventListener("click", () => {
      const seeded = demoUsers();
      allUsers = seeded;
      saveUsers(allUsers);
      page = 1;
      render();
      showToast("Demo reset.");
      confirmResetModal?.hide();
    });

    resetDataBtn?.addEventListener("click", () => {
      confirmResetModal?.show();
    });

    // Limpa o formulário ao fechar o modal
    userModalEl?.addEventListener("hidden.bs.modal", resetForm);

    userForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Validação nativa do Bootstrap
      if (!userForm.checkValidity()) {
        userForm.classList.add("was-validated");
        return;
      }

      const id = userId.value || uid();
      const now = Date.now();

      const payload = {
        id,
        name: nameEl.value.trim(),
        email: emailEl.value.trim().toLowerCase(),
        status: statusEl.value,
        role: roleEl.value,
        createdAt: userId.value
          ? allUsers.find((u) => u.id === id)?.createdAt || now
          : now,
      };

      // Verificação básica de email duplicado
      const isDuplicate = allUsers.some(
        (u) => u.email === payload.email && u.id !== payload.id,
      );
      if (isDuplicate) {
        showToast("Email already exists.");
        return;
      }

      upsertUser(payload);
      userModal?.hide();
    });

    // Abre confirmação antes de deletar
    deleteBtn?.addEventListener("click", () => {
      const id = userId.value;
      if (!id) return;
      pendingDeleteId = id;
      userModal?.hide();
      confirmDeleteModal?.show();
    });

    exportCsvBtn?.addEventListener("click", () => {
      const filtered = applyFilters(allUsers);
      exportCsv(filtered);
      showToast("CSV exported.");
    });
  }

  // ── Inicialização ────────────────────────────────────
  allUsers = loadUsers();
  bindEvents();
  render();
})();
