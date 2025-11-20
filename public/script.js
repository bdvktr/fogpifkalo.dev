document.addEventListener("DOMContentLoaded", () => {
  // Rendelés gombok
  const buttons = document.querySelectorAll(".add-to-cart");
  const cartCountBadge = document.getElementById("cartCountBadge");
  const cartDropdownContent = document.getElementById("cartDropdownContent");
  const cartDropdownBtn = document.getElementById("cartDropdownBtn");
  const profileForm = document.getElementById("profileForm");
  const passwordForm = document.getElementById("passwordForm");
  const currentPasswordInput = document.getElementById("currentPassword");
  const newPasswordInput = document.getElementById("newPassword");

  buttons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const productId = btn.dataset.productId;

      try {
        const response = await fetch("/api/cart/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: Number(productId),
            quantity: 1,
          }),
        });

        const data = await response.json();

        if (data.success) {
          showAlert("success", "A termék bekerült a kosárba!");
          await loadCartSummary(); // frissítjük a kis kosarat és a badge-et
        } else {
          showAlert("danger", data.message || "Hiba történt.");
        }
      } catch (err) {
        showAlert("danger", "Nem sikerült csatlakozni a szerverhez.");
      }
    });
  });

  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".order-btn");
    if (!btn) return;

    const productId = btn.dataset.productId;
    if (!productId) return;

    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: Number(productId),
          quantity: 1,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // ha van ilyen függvényed, már használod a kosár ikonhoz:
        if (typeof loadCartSummary === "function") {
          await loadCartSummary();
        }
        if (typeof showAlert === "function") {
          showAlert("success", "A termék bekerült a kosaradba.");
        } else {
          alert("A termék bekerült a kosaradba.");
        }
      } else {
        if (typeof showAlert === "function") {
          showAlert(
            "danger",
            data.message || "Nem sikerült a terméket a kosárba tenni."
          );
        } else {
          alert(data.message || "Nem sikerült a terméket a kosárba tenni.");
        }
      }
    } catch (err) {
      console.error("Hiba a kosárba tételnél:", err);
      if (typeof showAlert === "function") {
        showAlert("danger", "Nem sikerült csatlakozni a szerverhez.");
      } else {
        alert("Nem sikerült csatlakozni a szerverhez.");
      }
    }
  });

  // Dropdown megnyitásakor újratöltjük a mini kosarat
  if (cartDropdownBtn) {
    cartDropdownBtn.addEventListener("click", async () => {
      await loadCartSummary();
    });
  }

  async function loadCartSummary() {
    if (!cartDropdownContent) return;

    try {
      cartDropdownContent.innerHTML =
        '<div class="text-muted small">Betöltés...</div>';

      const res = await fetch("/api/cart");
      if (res.status === 401) {
        cartDropdownContent.innerHTML =
          '<div class="text-muted small">A kosár használatához jelentkezz be.</div>';
        updateCartBadge(0);
        return;
      }

      const data = await res.json();

      if (!data.success) {
        cartDropdownContent.innerHTML = `<div class="text-muted small">${data.message || "Nem sikerült betölteni a kosarat."
          }</div>`;
        updateCartBadge(0);
        return;
      }

      const items = data.items || [];
      if (items.length === 0) {
        cartDropdownContent.innerHTML =
          '<div class="text-muted small">A kosarad jelenleg üres.</div>';
        updateCartBadge(0);
        return;
      }

      let totalQty = 0;
      let totalPrice = 0;

      const list = document.createElement("div");
      list.className = "small";

      items.forEach((item) => {
        totalQty += Number(item.quantity);
        totalPrice += Number(item.line_total);

        const row = document.createElement("div");
        row.className =
          "d-flex justify-content-between align-items-center mb-1";
        row.innerHTML = `
    <div class="me-2">
      <div>${item.name}</div>
      <div class="text-muted">x ${item.quantity}</div>
    </div>
    <div class="text-end">
      ${formatFt(item.line_total)} Ft
      <button 
        class="btn btn-link btn-sm text-danger p-0 ms-2 cart-remove-btn" 
        data-product-id="${item.product_id}"
        title="Tétel törlése"
      >
        <i class="bi bi-trash"></i>
      </button>
    </div>
  `;
        list.appendChild(row);
      });

      const footer = document.createElement("div");
      footer.className = "border-top pt-2 mt-2";

      footer.innerHTML = `
  <div class="d-flex justify-content-between align-items-center mb-2">
    <strong>Összesen:</strong>
    <strong>${formatFt(totalPrice)} Ft</strong>
  </div>
  <button class="btn btn-sm btn-success w-100 mt-1 cart-checkout-btn">
    Rendelés véglegesítése
  </button>
`;

      cartDropdownContent.innerHTML = "";
      cartDropdownContent.appendChild(list);
      cartDropdownContent.appendChild(footer);

      updateCartBadge(totalQty);
    } catch (err) {
      console.error(err);
      cartDropdownContent.innerHTML =
        '<div class="text-muted small">Nem sikerült csatlakozni a szerverhez.</div>';
      updateCartBadge(0);
    }
  }

  function updateCartBadge(count) {
    if (!cartCountBadge) return;
    if (count > 0) {
      cartCountBadge.textContent = count;
      cartCountBadge.style.display = "inline-block";
    } else {
      cartCountBadge.style.display = "none";
    }
  }

  function formatFt(value) {
    return Math.round(Number(value)).toLocaleString("hu-HU");
  }

  // Tétel törlése a kosár dropdownból (event delegation)
  if (cartDropdownContent) {
    cartDropdownContent.addEventListener("click", async (e) => {
      // Tétel törlése
      const removeBtn = e.target.closest(".cart-remove-btn");
      if (removeBtn) {
        const productId = removeBtn.dataset.productId;
        if (!productId) return;

        if (!confirm("Biztosan törlöd ezt a tételt a kosaradból?")) return;

        try {
          const res = await fetch("/api/cart/remove", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ productId: Number(productId) }),
          });

          const data = await res.json();

          if (data.success) {
            showAlert("success", "Tétel törölve a kosárból.");
            await loadCartSummary();
          } else {
            showAlert(
              "danger",
              data.message || "Nem sikerült törölni a tételt."
            );
          }
        } catch (err) {
          console.error(err);
          showAlert("danger", "Nem sikerült csatlakozni a szerverhez.");
        }

        return; // ne fusson tovább, ha ez volt
      }

      // Checkout (rendelés véglegesítése)
      const checkoutBtn = e.target.closest(".cart-checkout-btn");
      if (checkoutBtn) {
        if (!confirm("Biztosan véglegesíted a rendelést?")) return;

        try {
          const res = await fetch("/api/checkout", {
            method: "POST",
          });

          const data = await res.json();

          if (data.success) {
            showAlert("success", data.message || "Sikeres rendelés!");
            await loadCartSummary(); // kosár kiürül
          } else {
            showAlert(
              "danger",
              data.message || "Nem sikerült leadni a rendelést."
            );
          }
        } catch (err) {
          console.error(err);
          showAlert("danger", "Nem sikerült csatlakozni a szerverhez.");
        }
      }
    });
  }

  // Bootstrap alert megjelenítő
  function showAlert(type, message) {
    const alert = document.createElement("div");
    alert.className = `alert alert-${type} position-fixed top-0 end-0 m-3 shadow`;
    alert.style.zIndex = "9999";
    alert.innerText = message;

    document.body.appendChild(alert);

    setTimeout(() => {
      alert.remove();
    }, 3000);
  }

    if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const currentPassword = currentPasswordInput.value;
      const newPassword = newPasswordInput.value;

      if (!currentPassword || !newPassword) {
        alert("Kérlek töltsd ki mindkét jelszó mezőt.");
        return;
      }

      try {
        const res = await fetch("/api/account/password", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        });

        const data = await res.json();

        if (data.success) {
          alert("Jelszó frissítve.");
          passwordForm.reset();
        } else {
          alert(data.message || "Nem sikerült frissíteni a jelszót.");
        }
      } catch (err) {
        console.error("Hiba a jelszó frissítésekor:", err);
        alert("Nem sikerült csatlakozni a szerverhez.");
      }
    });
  }


  // oldal betöltéskor egyszer betöltjük a kosarat (ha be van jelentkezve)
  loadCartSummary();
});

document.addEventListener("DOMContentLoaded", () => {
  const authSection = document.getElementById("authSection");
  const accountSection = document.getElementById("accountSection");
  const nameSpan = document.getElementById("accountName");
  const emailSpan = document.getElementById("accountEmail");
  const logoutBtn = document.getElementById("logoutBtn");
  const ordersList = document.getElementById("ordersList");
  const profileNameInput = document.getElementById("profileName");
  const profileEmailInput = document.getElementById("profileEmail");

  async function checkAuth() {
    try {
      const res = await fetch("/api/me");
      const data = await res.json();

      if (data.loggedIn) {
        if (authSection) authSection.classList.add("d-none");
        if (accountSection) accountSection.classList.remove("d-none");

        const user = data.user || {};
        if (nameSpan) {
          nameSpan.textContent = user.name || user.email || "Felhasználó";
        }
        if (emailSpan) {
          emailSpan.textContent = user.email || "";
        }
        if (ordersList) {
          loadOrders();
        }
      } else {
        if (authSection) authSection.classList.remove("d-none");
        if (accountSection) accountSection.classList.add("d-none");
      }
    } catch (err) {
      console.error("Hiba az /api/me hívásnál:", err);
      if (authSection) authSection.classList.remove("d-none");
      if (accountSection) accountSection.classList.add("d-none");
    }
  }

  async function loadOrders() {
    if (!ordersList) return;

    ordersList.textContent = "Rendelések betöltése...";

    try {
      const res = await fetch("/api/orders");
      const data = await res.json();

      if (!data.success) {
        ordersList.textContent =
          data.message || "Nem sikerült betölteni a rendeléseket.";
        return;
      }

      const orders = data.orders || [];

      if (orders.length === 0) {
        ordersList.textContent = "Még nincs leadott rendelésed.";
        return;
      }

      // Rendelések megjelenítése
      ordersList.innerHTML = "";

      orders.forEach((order) => {
        const wrapper = document.createElement("div");
        wrapper.className = "mb-3 p-3 border rounded";

        const createdAt = new Date(order.created_at);
        const formattedDate = createdAt.toLocaleString("hu-HU");

        let statusText = "";
        switch (order.status) {
          case "pending":
            statusText = "Folyamatban";
            break;
          case "completed":
            statusText = "Teljesítve";
            break;
          case "cancelled":
            statusText = "Törölve";
            break;
          default:
            statusText = order.status;
        }

        // tételek listája
        let itemsHtml = "";
        order.items.forEach((item) => {
          const lineTotal = Number(item.unit_price) * Number(item.quantity);
          itemsHtml += `
          <div class="d-flex justify-content-between">
            <div>
              ${item.name}
              <span class="text-muted">× ${item.quantity}</span>
            </div>
            <div>
              ${formatFt(lineTotal)} Ft
            </div>
          </div>
        `;
        });

        wrapper.innerHTML = `
        <div class="d-flex justify-content-between mb-1">
          <div>
            <strong>Rendelés #${order.id}</strong>
            <div class="text-muted small">${formattedDate}</div>
          </div>
          <span class="badge bg-secondary align-self-start">${statusText}</span>
        </div>
        <div class="mb-2 small">
          ${itemsHtml}
        </div>
        <div class="d-flex justify-content-between mt-2 pt-2 border-top">
          <strong>Összesen:</strong>
          <strong>${formatFt(order.total_price)} Ft</strong>
        </div>
      `;

        ordersList.appendChild(wrapper);
      });
    } catch (err) {
      console.error(err);
      ordersList.textContent = "Nem sikerült csatlakozni a szerverhez.";
    }
  }

  function formatFt(value) {
    return Math.round(Number(value)).toLocaleString("hu-HU");
  }

  // Kijelentkezés gomb
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await fetch("/api/logout", { method: "POST" });
      } catch (err) {
        console.error("Hiba a logout-nál:", err);
      }
      // Frissítjük az oldalt, hogy visszaváltson login/reg-re
      window.location.reload();
    });
  }

  // Induláskor ellenőrizzük, be van-e jelentkezve
  checkAuth();
});
