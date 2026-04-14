(function () {
  const api = window.OlympusAPI;

  const defaults = {
    companyName: "Olympus Admin Inc.",
    supportEmail: "support@example.com",
    defaultRole: "user",
    dashboardView: "overview",
    emailNotifications: true,
    weeklyReports: false,
  };

  const form = document.getElementById("settingsForm");
  const companyName = document.getElementById("companyName");
  const supportEmail = document.getElementById("supportEmail");
  const defaultRole = document.getElementById("defaultRole");
  const dashboardView = document.getElementById("dashboardView");
  const emailNotifications = document.getElementById("emailNotifications");
  const weeklyReports = document.getElementById("weeklyReports");
  const resetBtn = document.getElementById("resetSettings");

  function fillForm(data) {
    companyName.value = data.companyName;
    supportEmail.value = data.supportEmail;
    defaultRole.value = data.defaultRole;
    dashboardView.value = data.dashboardView;
    emailNotifications.checked = data.emailNotifications;
    weeklyReports.checked = data.weeklyReports;
  }

  function showToast(message) {
    document.getElementById("settingsToastBody").textContent = message;
    const toast = bootstrap.Toast.getOrCreateInstance(
      document.getElementById("settingsToast"),
    );
    toast.show();
  }

  function getPayload() {
    return {
      companyName: companyName.value.trim(),
      supportEmail: supportEmail.value.trim(),
      defaultRole: defaultRole.value,
      dashboardView: dashboardView.value,
      emailNotifications: emailNotifications.checked,
      weeklyReports: weeklyReports.checked,
    };
  }

  function notifySettingsChanged(settings) {
    window.dispatchEvent(
      new CustomEvent("olympus:settings-updated", {
        detail: settings,
      }),
    );
  }

  async function loadSettings() {
    if (!api) return defaults;

    try {
      const settings = await api.request("/settings");
      return { ...defaults, ...settings };
    } catch {
      return defaults;
    }
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    try {
      const data = getPayload();
      await api.request("/settings", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      notifySettingsChanged(data);
      showToast("Settings saved successfully.");
    } catch (error) {
      showToast(error.message || "Unable to save settings.");
    }
  });

  resetBtn.addEventListener("click", async function () {
    try {
      const response = await api.request("/settings/reset", {
        method: "POST",
      });
      fillForm({ ...defaults, ...response.settings });
      notifySettingsChanged(response.settings);
      showToast("Default settings restored.");
    } catch (error) {
      showToast(error.message || "Unable to restore settings.");
    }
  });

  loadSettings().then(fillForm);
})();
