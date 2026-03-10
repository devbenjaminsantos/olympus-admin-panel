(function () {
const STORAGE_KEY = "olympus_settings";

const defaults = {
companyName: "Olympus Admin Inc.",
supportEmail: "[support@example.com](mailto:support@example.com)",
defaultRole: "viewer",
dashboardView: "overview",
emailNotifications: true,
weeklyReports: false
};

const form = document.getElementById("settingsForm");
const companyName = document.getElementById("companyName");
const supportEmail = document.getElementById("supportEmail");
const defaultRole = document.getElementById("defaultRole");
const dashboardView = document.getElementById("dashboardView");
const emailNotifications = document.getElementById("emailNotifications");
const weeklyReports = document.getElementById("weeklyReports");
const resetBtn = document.getElementById("resetSettings");

function loadSettings() {
const saved = localStorage.getItem(STORAGE_KEY);
if (!saved) return defaults;

```
try {
  return { ...defaults, ...JSON.parse(saved) };
} catch {
  return defaults;
}
```

}

function saveSettings(data) {
localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

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
const toast = bootstrap.Toast.getOrCreateInstance(document.getElementById("settingsToast"));
toast.show();
}

form.addEventListener("submit", function (e) {
e.preventDefault();

```
const data = {
  companyName: companyName.value.trim(),
  supportEmail: supportEmail.value.trim(),
  defaultRole: defaultRole.value,
  dashboardView: dashboardView.value,
  emailNotifications: emailNotifications.checked,
  weeklyReports: weeklyReports.checked
};

saveSettings(data);
showToast("Settings saved successfully.");
```

});

resetBtn.addEventListener("click", function () {
saveSettings(defaults);
fillForm(defaults);
showToast("Default settings restored.");
});

fillForm(loadSettings());
})();