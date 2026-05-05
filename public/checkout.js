document.addEventListener("DOMContentLoaded", () => {
  const itemsContainer = document.getElementById("checkoutCartItems");
  const subtotalEl = document.getElementById("checkoutSubtotal");
  const packageFeeEl = document.getElementById("checkoutPackageFee");
  const deliveryFeeEl = document.getElementById("checkoutDeliveryFee");
  const totalEl = document.getElementById("checkoutTotal");
  const shippingCitySelect = document.getElementById("shippingCity");
  const selectedDeliveryFeeEl = document.getElementById("selectedDeliveryFee");
  const form = document.getElementById("checkoutForm");
  const errorBox = document.getElementById("checkoutError");
  const submitButton = form?.querySelector('button[type="submit"]');
  const submitButtonOriginalText = submitButton?.textContent || "Rendelés elküldése";
  let isCheckoutSubmitting = false;
  let cartSubtotal = 0;
  let cartPackageCount = 0;
  let cartPackagingFee = 0;
  let deliveryZones = [];

  const ORDER_PACKAGE_SIZE = 4;
  const ORDER_PACKAGE_FEE = 100;

  const fallbackDeliveryZones = [
    { city: "Mohács", delivery_fee: 0 },
    { city: "Lánycsók", delivery_fee: 800 },
    { city: "Szőlőhegy", delivery_fee: 800 },
    { city: "Kölked", delivery_fee: 1200 },
    { city: "Somberek", delivery_fee: 1600 },
    { city: "Sátorhely", delivery_fee: 1600 },
    { city: "Bár", delivery_fee: 1600 },
    { city: "Palotabozsok", delivery_fee: 1800 },
  ];

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

  function getBurgerPackagingLine(config) {
    if (!config || !config.baseType) {
      return null;
    }

    if (config.packagingName && Number(config.packagingPrice || 0) > 0) {
      return `Dobozolás: ${config.packagingName} (+${formatFt(config.packagingPrice)})`;
    }

    if (config.baseType === "menu") {
      return "Dobozolás: Nagy doboz (+200 Ft)";
    }

    if (config.baseType === "single") {
      return "Dobozolás: Kis doboz (+150 Ft)";
    }

    return null;
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

    const packagingLine = getBurgerPackagingLine(config);
    if (packagingLine) {
      lines.push(packagingLine);
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

  function formatFt(value) {
    return `${Math.round(Number(value || 0)).toLocaleString("hu-HU")} Ft`;
  }

  function getSelectedDeliveryZone() {
    const selectedCity = shippingCitySelect?.value || "";
    return deliveryZones.find((zone) => zone.city === selectedCity) || null;
  }

  function isBurgerCartItem(item) {
    return (
      item?.category === "burger" ||
      item?.config?.baseType === "single" ||
      item?.config?.baseType === "menu"
    );
  }

  function calculateCartPackaging(items) {
    const burgerCount = (items || []).reduce((sum, item) => {
      if (!isBurgerCartItem(item)) {
        return sum;
      }

      return sum + Number(item.quantity || 0);
    }, 0);

    const packageCount =
      burgerCount > 0 ? Math.ceil(burgerCount / ORDER_PACKAGE_SIZE) : 0;

    return {
      packageCount,
      packagingFee: packageCount * ORDER_PACKAGE_FEE,
    };
  }

  function renderCheckoutTotals() {
    const selectedZone = getSelectedDeliveryZone();
    const deliveryFee = selectedZone ? Number(selectedZone.delivery_fee || 0) : 0;
    const total = cartSubtotal + cartPackagingFee + deliveryFee;

    if (subtotalEl) {
      subtotalEl.textContent = formatFt(cartSubtotal);
    }

    if (packageFeeEl) {
      packageFeeEl.textContent =
        cartPackageCount > 0
          ? `${formatFt(cartPackagingFee)} (${cartPackageCount} csomag)`
          : formatFt(0);
    }

    if (deliveryFeeEl) {
      deliveryFeeEl.textContent = selectedZone
        ? formatFt(deliveryFee)
        : "Válassz települést";
    }

    if (selectedDeliveryFeeEl) {
      selectedDeliveryFeeEl.textContent = selectedZone
        ? formatFt(deliveryFee)
        : "válassz települést";
    }

    if (totalEl) {
      totalEl.textContent = formatFt(total);
    }
  }

  function renderDeliveryZoneOptions(zones) {
    if (!shippingCitySelect || !Array.isArray(zones) || zones.length === 0) {
      return;
    }

    const currentValue = shippingCitySelect.value;
    shippingCitySelect.innerHTML = '<option value="">Válassz települést...</option>';

    zones.forEach((zone) => {
      const option = document.createElement("option");
      option.value = zone.city;
      option.textContent = `${zone.city} (${formatFt(zone.delivery_fee)})`;
      shippingCitySelect.appendChild(option);
    });

    if (zones.some((zone) => zone.city === currentValue)) {
      shippingCitySelect.value = currentValue;
    }
  }

  async function loadDeliveryZones() {
    try {
      const res = await apiFetch("/api/delivery-zones");
      const data = await res.json();

      if (!data.success || !Array.isArray(data.zones)) {
        throw new Error(data.message || "Nem sikerült betölteni a szállítási díjakat.");
      }

      deliveryZones = data.zones.map((zone) => ({
        city: zone.city,
        delivery_fee: Number(zone.delivery_fee || 0),
      }));
    } catch (err) {
      console.error("Hiba a szállítási díjak betöltésekor:", err);
      deliveryZones = fallbackDeliveryZones;
    }

    renderDeliveryZoneOptions(deliveryZones);
    renderCheckoutTotals();
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
        cartSubtotal = 0;
        cartPackageCount = 0;
        cartPackagingFee = 0;
        renderCheckoutTotals();
        return;
      }

      const items = data.items || [];
      if (items.length === 0) {
        itemsContainer.textContent = "A kosarad üres.";
        cartSubtotal = 0;
        cartPackageCount = 0;
        cartPackagingFee = 0;
        renderCheckoutTotals();
        return;
      }

      let html = "";
      let subtotal = 0;

      items.forEach((item) => {
        const lineTotal =
          Number(item.unit_price || item.price || 0) *
          Number(item.quantity || 1);
        subtotal += lineTotal;

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

      const packaging = calculateCartPackaging(items);
      cartPackageCount = packaging.packageCount;
      cartPackagingFee = packaging.packagingFee;

      cartSubtotal = subtotal;
      itemsContainer.innerHTML = html;
      renderCheckoutTotals();
    } catch (err) {
      console.error("Hiba a checkout kosár betöltésekor:", err);
      itemsContainer.textContent = "Nem sikerült csatlakozni a szerverhez.";
      cartSubtotal = 0;
      cartPackageCount = 0;
      cartPackagingFee = 0;
      renderCheckoutTotals();
    }
  }

  if (shippingCitySelect) {
    shippingCitySelect.addEventListener("change", renderCheckoutTotals);
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (isCheckoutSubmitting) {
        return;
      }

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

      if (!getSelectedDeliveryZone()) {
        const msg = "Kérlek válassz érvényes szállítási települést.";
        if (errorBox) {
          errorBox.textContent = msg;
          errorBox.classList.remove("d-none");
        } else {
          showCheckoutToast(msg, "danger");
        }
        return;
      }

      isCheckoutSubmitting = true;
      let keepSubmitLocked = false;

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Rendelés küldése...";
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
          keepSubmitLocked = true;
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
      } finally {
        if (!keepSubmitLocked) {
          isCheckoutSubmitting = false;

          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = submitButtonOriginalText;
          }
        }
      }
    });
  }

  loadDeliveryZones();
  loadCheckoutCart();
});
