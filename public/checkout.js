document.addEventListener("DOMContentLoaded", () => {
  const itemsContainer = document.getElementById("checkoutCartItems");
  const totalEl = document.getElementById("checkoutTotal");
  const form = document.getElementById("checkoutForm");
  const errorBox = document.getElementById("checkoutError");

  // Toast (jobb alsó sarok)
  const checkoutToastEl = document.getElementById("checkoutToast");
  const checkoutToastTextEl = document.getElementById("checkoutToastText");
  let checkoutToastInstance;
  if (checkoutToastEl && typeof bootstrap !== "undefined") {
    checkoutToastInstance = new bootstrap.Toast(checkoutToastEl);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  }

  function getBurgerConfigLines(config) {
    if (!config) {
      return [];
    }

    const lines = [];

    if (config.baseType === "menu") {
      lines.push("Menü");

      if (config.sideName) {
        lines.push(`Köret: ${config.sideName}`);
      }

      if (config.extraType === "coleslaw") {
        lines.push("Kiegészítő: Coleslaw saláta");
      } else if (config.extraType === "sauce") {
        lines.push("Kiegészítő: Szósz");
        if (config.sauceName) {
          lines.push(`Szósz: ${config.sauceName}`);
        }
      }
    }

    if (Array.isArray(config.toppingNames) && config.toppingNames.length > 0) {
      lines.push(`Extra feltétek: ${config.toppingNames.join(", ")}`);
    }

    return lines;
  }

  function renderBurgerConfigHtml(config) {
    const lines = getBurgerConfigLines(config);
    if (lines.length === 0) {
      return "";
    }

    return `
      <div class="text-muted small mt-1">
        ${lines.map((line) => `<div>${escapeHtml(line)}</div>`).join("")}
      </div>
    `;
  }

  function showCheckoutToast(message, type = "success") {
    if (
      !checkoutToastEl ||
      !checkoutToastTextEl ||
      typeof bootstrap === "undefined"
    ) {
      console.log("[" + type + "]", message);
      return;
    }
    checkoutToastTextEl.textContent = message;
    checkoutToastEl.className = `toast align-items-center text-bg-${type} border-0`;
    if (!checkoutToastInstance) {
      checkoutToastInstance = new bootstrap.Toast(checkoutToastEl);
    }
    checkoutToastInstance.show();
  }

  async function loadCheckoutCart() {
    try {
      const res = await apiFetch("/api/cart");
      if (res.status === 401) {
        showCheckoutToast("A rendeléshez előbb jelentkezz be.", "danger");
        window.location.href = "fiok.html";
        return;
      }

      const data = await res.json();
      if (!data.success) {
        itemsContainer.textContent =
          data.message || "Nem sikerült betölteni a kosarat.";
        totalEl.textContent = "0 Ft";
        return;
      }

      const items = data.items || [];
      if (items.length === 0) {
        itemsContainer.textContent = "A kosarad üres.";
        totalEl.textContent = "0 Ft";
        return;
      }

      let html = "";
      let total = 0;

      items.forEach((item) => {
        const lineTotal =
          Number(item.unit_price || item.price || 0) *
          Number(item.quantity || 1);
        total += lineTotal;

        html += `
                <div class="d-flex justify-content-between mb-2">
                  <div>
                    <div>${escapeHtml(item.name)}</div>
                    ${renderBurgerConfigHtml(item.config)}
                    <div class="text-muted">× ${item.quantity}</div>
                  </div>
                  <div>${Math.round(lineTotal).toLocaleString("hu-HU")} Ft</div>
                </div>
              `;
      });

      itemsContainer.innerHTML = html;
      totalEl.textContent = Math.round(total).toLocaleString("hu-HU") + " Ft";
    } catch (err) {
      console.error("Hiba a checkout kosár betöltésekor:", err);
      itemsContainer.textContent = "Nem sikerült csatlakozni a szerverhez.";
      totalEl.textContent = "0 Ft";
    }
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (errorBox) {
        errorBox.textContent = "";
        errorBox.classList.add("d-none");
      }

      const shippingName = document.getElementById("shippingName").value.trim();
      const shippingPhone = document
        .getElementById("shippingPhone")
        .value.trim();
      const shippingCity = document.getElementById("shippingCity").value.trim();
      const shippingStreet = document
        .getElementById("shippingStreet")
        .value.trim();
      const shippingHouseNumber = document
        .getElementById("shippingHouseNumber")
        .value.trim();
      const note = document.getElementById("orderNote").value.trim();
      const paymentMethod =
        document.querySelector('input[name="paymentMethod"]:checked')?.value ||
        "cash";

      if (
        !shippingName ||
        !shippingPhone ||
        !shippingCity ||
        !shippingStreet ||
        !shippingHouseNumber
      ) {
        const msg = "Kérlek töltsd ki a szállítási adatokat.";
        if (errorBox) {
          errorBox.textContent = msg;
          errorBox.classList.remove("d-none");
        } else {
          showCheckoutToast(msg, "danger");
        }
        return;
      }

      try {
        const res = await apiFetch("/api/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shippingName,
            shippingPhone,
            shippingCity,
            shippingStreet,
            shippingHouseNumber,
            paymentMethod,
            note,
          }),
        });

        const data = await res.json();

        if (data.success) {
          showCheckoutToast(
            data.message || "Sikeresen leadta a rendelését!",
            "success",
          );
          // Hagyd, hogy a toast látszódjon egy pillanatig, aztán átirányítunk
          setTimeout(() => {
            window.location.href = "fiok.html";
          }, 1400);
        } else {
          const msg = data.message || "Nem sikerült leadni a rendelést.";
          if (errorBox) {
            errorBox.textContent = msg;
            errorBox.classList.remove("d-none");
          } else {
            showCheckoutToast(msg, "danger");
          }
        }
      } catch (err) {
        console.error("Hiba a checkout POST-nál:", err);
        const msg = "Nem sikerült csatlakozni a szerverhez.";
        if (errorBox) {
          errorBox.textContent = msg;
          errorBox.classList.remove("d-none");
        } else {
          showCheckoutToast(msg, "danger");
        }
      }
    });
  }

  loadCheckoutCart();
});
