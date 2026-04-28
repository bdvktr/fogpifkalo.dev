async function updateAccountLabel() {
  const accountLink = document.getElementById("accountLink");
  if (!accountLink) return;

  try {
    const res = await apiFetch("/api/me");
    if (!res.ok) return;

    const data = await res.json();
    const fullName = String(data?.user?.name || "").trim();
    if (!data?.loggedIn || !fullName) return;

    const parts = fullName.split(/\s+/).filter(Boolean);
    const secondName = parts[1] || parts[0];

    const labelSpan = accountLink.querySelector("span");
    if (labelSpan) labelSpan.textContent = secondName;

    accountLink.title = fullName; // tooltipben teljes név
  } catch (_) {}
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", updateAccountLabel);
} else {
  updateAccountLabel();
}
