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
        cartDropdownContent.innerHTML = `<div class="text-muted small">${
          data.message || "Nem sikerült betölteni a kosarat."
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

      // Checkout (rendelés véglegesítése) → átirányítás a checkout oldalra
      const checkoutBtn = e.target.closest(".cart-checkout-btn");
      if (checkoutBtn) {
        window.location.href = "checkout.html";
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
  const reservationsList = document.getElementById("reservationsList");
  const profileNameInput = document.getElementById("profileName");
  const profileEmailInput = document.getElementById("profileEmail");
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");
  const registerForm = document.getElementById("registerForm");
  const registerError = document.getElementById("registerError");

  async function checkAuth() {
    try {
      const res = await fetch("/api/me");
      const data = await res.json();

      const adminPanelBtn = document.getElementById("adminPanelBtn");

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
        if (reservationsList) {
          loadReservations();
        }

        // 🔹 Admin gomb megjelenítése adminoknak
        if (adminPanelBtn) {
          if (user.isAdmin) {
            adminPanelBtn.style.display = "inline-block";
          } else {
            adminPanelBtn.style.display = "none";
          }
        }
      } else {
        if (authSection) authSection.classList.remove("d-none");
        if (accountSection) accountSection.classList.add("d-none");

        // 🔹 Vendégként elrejtés
        const adminPanelBtn = document.getElementById("adminPanelBtn");
        if (adminPanelBtn) adminPanelBtn.style.display = "none";
      }
    } catch (err) {
      console.error("Hiba az /api/me hívásnál:", err);
      if (authSection) authSection.classList.remove("d-none");
      if (accountSection) accountSection.classList.add("d-none");

      // Biztonság kedvéért itt is rejtsük el
      const adminPanelBtn = document.getElementById("adminPanelBtn");
      if (adminPanelBtn) adminPanelBtn.style.display = "none";
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

  async function loadReservations() {
    if (!reservationsList) return;

    reservationsList.textContent = "Foglalások betöltése...";

    try {
      const res = await fetch("/api/my/reservations");
      const data = await res.json();

      if (!data.success) {
        reservationsList.textContent =
          data.message || "Nem sikerült betölteni a foglalásokat.";
        return;
      }

      const reservations = data.reservations || [];

      if (reservations.length === 0) {
        reservationsList.textContent = "Még nincs foglalásod.";
        return;
      }

      const now = new Date();
      const upcoming = [];
      const past = [];

      // Szétválogatjuk jövőbeli / múltbeli foglalásokra
      for (const r of reservations) {
        const datePart = new Date(r.date);
        let dateTime = datePart;

        if (r.timeFrom) {
          const [h, m] = r.timeFrom.toString().split(":");
          dateTime = new Date(datePart);
          dateTime.setHours(Number(h), Number(m), 0, 0);
        }

        if (dateTime >= now && r.status !== "cancelled") {
          upcoming.push(r);
        } else {
          past.push(r);
        }
      }

      reservationsList.innerHTML = "";

      const renderStatus = (status) => {
        let statusText = "";
        let statusClass = "bg-secondary";
        switch (status) {
          case "confirmed":
            statusText = "Megerősítve";
            statusClass = "bg-success";
            break;
          case "cancelled":
            statusText = "Lemondva";
            statusClass = "bg-danger";
            break;
          case "pending":
          default:
            statusText = "Függőben";
            statusClass = "bg-warning text-dark";
            break;
        }
        return { statusText, statusClass };
      };

      // 🔹 Közelgő foglalások
      if (upcoming.length > 0) {
        const title = document.createElement("h6");
        title.textContent = "Közelgő foglalásaid";
        title.className = "fw-bold mb-2";
        reservationsList.appendChild(title);

        for (const r of upcoming) {
          const wrapper = document.createElement("div");
          wrapper.className = "mb-3 p-3 border rounded";

          const created = r.createdAt ? new Date(r.createdAt) : null;
          const createdText = created ? created.toLocaleString("hu-HU") : "";

          const dateText = formatDateOnly(r.date);
          const timeRange = `${formatTimeOnly(r.timeFrom)}–${formatTimeOnly(
            r.timeTo
          )}`;

          const { statusText, statusClass } = renderStatus(r.status);
          const noteHtml = r.note
            ? `<div class="small text-muted mt-1">Megjegyzés: ${r.note}</div>`
            : "";

          wrapper.innerHTML = `
          <div class="d-flex justify-content-between mb-1">
            <div>
              <strong>Asztal #${r.tableNumber}</strong>
              <div class="text-muted small">
                ${dateText} • ${timeRange}
              </div>
              ${
                createdText
                  ? `<div class="text-muted small">Foglalás időpontja: ${createdText}</div>`
                  : ""
              }
            </div>
            <span class="badge ${statusClass} align-self-start">${statusText}</span>
          </div>
          <div class="small">
            Létszám: <strong>${r.peopleCount} fő</strong>
            ${noteHtml}
          </div>
        `;

          // 🔘 Módosítás / lemondás gombok
          const actions = document.createElement("div");
          actions.className = "mt-2 d-flex gap-2";

          actions.innerHTML = `
          <button 
            class="btn btn-sm btn-outline-primary js-edit-reservation"
            data-id="${r.id}"
            data-people="${r.peopleCount}"
            data-note="${r.note || ""}"
          >
            Módosítás
          </button>
          <button 
            class="btn btn-sm btn-outline-secondary js-edit-reservation-time"
            data-id="${r.id}"
            data-date="${r.date}"
            data-from="${r.timeFrom}"
            data-to="${r.timeTo}"
            data-table="${r.tableNumber}"
          >
            Időpont módosítása
          <button 
            class="btn btn-sm btn-outline-danger js-cancel-reservation"
            data-id="${r.id}"
          >
            Lemondás
          </button>
        `;

          wrapper.appendChild(actions);
          reservationsList.appendChild(wrapper);
        }
      }

      // 🔹 Korábbi / lemondott foglalások
      if (past.length > 0) {
        const title = document.createElement("h6");
        title.textContent = "Korábbi / lemondott foglalásaid";
        title.className = "fw-bold mt-3 mb-2";
        reservationsList.appendChild(title);

        for (const r of past) {
          const wrapper = document.createElement("div");
          wrapper.className = "mb-2 p-2 border rounded small bg-light";

          const dateText = formatDateOnly(r.date);
          const timeRange = `${formatTimeOnly(r.timeFrom)}–${formatTimeOnly(
            r.timeTo
          )}`;

          const { statusText, statusClass } = renderStatus(r.status);
          const noteHtml = r.note
            ? `<div class="small text-muted mt-1">Megjegyzés: ${r.note}</div>`
            : "";

          wrapper.innerHTML = `
          <div class="d-flex justify-content-between mb-1">
            <div>
              <strong>Asztal #${r.tableNumber}</strong>
              <div class="text-muted">
                ${dateText} • ${timeRange} • ${r.peopleCount} fő
              </div>
              ${noteHtml}
            </div>
            <span class="badge ${statusClass} align-self-start">${statusText}</span>
          </div>
        `;

          reservationsList.appendChild(wrapper);
        }
      }
    } catch (err) {
      console.error("Foglalások betöltési hiba:", err);
      reservationsList.textContent = "Nem sikerült csatlakozni a szerverhez.";
    }
  }

  if (reservationsList) {
    reservationsList.addEventListener("click", (e) => {
      const target = e.target;

      if (target.classList.contains("js-cancel-reservation")) {
        const id = target.dataset.id;
        handleCancelReservation(id);
      }

      if (target.classList.contains("js-edit-reservation-time")) {
        const id = target.dataset.id;
        const currentDate = target.dataset.date;
        const currentFrom = target.dataset.from;
        const currentTo = target.dataset.to;
        const currentTable = target.dataset.table;
        handleEditReservationTime(
          id,
          currentDate,
          currentFrom,
          currentTo,
          currentTable
        );
      }

      if (target.classList.contains("js-edit-reservation")) {
        const id = target.dataset.id;
        const currentPeople = target.dataset.people;
        const currentNote = target.dataset.note || "";
        handleEditReservation(id, currentPeople, currentNote);
      }
    });
  }

  async function handleEditReservationTime(
    id,
    currentDate,
    currentFrom,
    currentTo,
    currentTable
  ) {
    if (!id) return;

    const newDate = window.prompt("Új dátum (YYYY-MM-DD):");
    if (!newDate) return;

    const newFrom = window.prompt(
      "Új kezdési idő (HH:MM):",
      currentFrom ? currentFrom.toString().slice(0, 5) : "18:00"
    );
    if (!newFrom) return;

    const newTo = window.prompt(
      "Új befejezési idő (HH:MM):",
      currentTo ? currentTo.toString().slice(0, 5) : "20:00"
    );
    if (!newTo) return;

    const newTableStr = window.prompt("Új asztalszám:", currentTable || "1");
    if (!newTableStr) return;

    const newTable = Number(newTableStr);
    if (!Number.isInteger(newTable) || newTable <= 0) {
      alert("Érvénytelen asztalszám.");
      return;
    }

    try {
      const res = await fetch(`/api/my/reservations/${id}/time`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: newDate,
          timeFrom: newFrom,
          timeTo: newTo,
          tableNumber: newTable,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || "Nem sikerült módosítani a foglalás időpontját.");
        return;
      }

      // siker, frissítjük a listát
      await loadReservations();
    } catch (err) {
      console.error("Idősáv módosítási hiba:", err);
      alert("Nem sikerült csatlakozni a szerverhez.");
    }
  }

  async function handleCancelReservation(id) {
    if (!id) return;

    const confirmed = window.confirm(
      "Biztosan le szeretnéd mondani ezt a foglalást?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/my/reservations/${id}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || "Nem sikerült lemondani a foglalást.");
        return;
      }

      // frissítsük a listát
      await loadReservations();
    } catch (err) {
      console.error("Lemondási hiba:", err);
      alert("Nem sikerült csatlakozni a szerverhez.");
    }
  }

  async function handleEditReservation(id, currentPeople, currentNote) {
    if (!id) return;

    const newPeopleStr = window.prompt(
      "Új létszám (fő):",
      currentPeople || "2"
    );
    if (newPeopleStr === null) return; // cancel

    const newPeople = Number(newPeopleStr);
    if (!newPeople || isNaN(newPeople) || newPeople <= 0) {
      alert("Érvénytelen létszám.");
      return;
    }

    const newNote = window.prompt(
      "Megjegyzés (opcionális):",
      currentNote || ""
    );
    if (newNote === null) {
      // ha cancel, akkor ne küldjünk semmit
      return;
    }

    try {
      const res = await fetch(`/api/my/reservations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          peopleCount: newPeople,
          note: newNote,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || "Nem sikerült módosítani a foglalást.");
        return;
      }

      await loadReservations();
    } catch (err) {
      console.error("Módosítási hiba:", err);
      alert("Nem sikerült csatlakozni a szerverhez.");
    }
  }

  function formatDateOnly(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("hu-HU");
  }

  function formatTimeOnly(value) {
    if (!value) return "";
    // "HH:MM:SS" → "HH:MM"
    return value.toString().slice(0, 5);
  }

  function formatFt(value) {
    return Math.round(Number(value)).toLocaleString("hu-HU");
  }

  // Belépés kezelése fetch-csel (ne JSON oldalra dobjon)
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (loginError) {
        loginError.textContent = "";
        loginError.classList.add("d-none");
      }

      const formData = new FormData(loginForm);
      const email = formData.get("email");
      const password = formData.get("password");

      if (!email || !password) {
        if (loginError) {
          loginError.textContent = "Kérlek töltsd ki az emailt és a jelszót.";
          loginError.classList.remove("d-none");
        } else {
          alert("Kérlek töltsd ki az emailt és a jelszót.");
        }
        return;
      }

      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (data.success) {
          // sikeres login → átirányítás a fiókra
          window.location.href = "fiok.html";
        } else {
          const msg = data.message || "Hibás email vagy jelszó.";
          if (loginError) {
            loginError.textContent = msg;
            loginError.classList.remove("d-none");
          } else {
            alert(msg);
          }
        }
      } catch (err) {
        console.error("Hiba a login során:", err);
        if (loginError) {
          loginError.textContent = "Nem sikerült csatlakozni a szerverhez.";
          loginError.classList.remove("d-none");
        } else {
          alert("Nem sikerült csatlakozni a szerverhez.");
        }
      }
    });
  }

  // Regisztráció kezelése fetch-csel
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (registerError) {
        registerError.textContent = "";
        registerError.classList.add("d-none");
      }

      const formData = new FormData(registerForm);
      const name = formData.get("name");
      const email = formData.get("email");
      const password = formData.get("password");
      const passwordConfirm = formData.get("passwordConfirm");

      if (!name || !email || !password || !passwordConfirm) {
        if (registerError) {
          registerError.textContent = "Minden mező kitöltése kötelező.";
          registerError.classList.remove("d-none");
        } else {
          alert("Minden mező kitöltése kötelező.");
        }
        return;
      }

      if (password !== passwordConfirm) {
        if (registerError) {
          registerError.textContent = "A két jelszó nem egyezik.";
          registerError.classList.remove("d-none");
        } else {
          alert("A két jelszó nem egyezik.");
        }
        return;
      }

      try {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
            passwordConfirm,
          }),
        });

        const data = await res.json();

        if (data.success) {
          // ✔ backend már beléptet → mehetünk a fiókra
          window.location.href = "fiok.html";
        } else {
          const msg = data.message || "Nem sikerült regisztrálni.";
          if (registerError) {
            registerError.textContent = msg;
            registerError.classList.remove("d-none");
          } else {
            alert(msg);
          }
        }
      } catch (err) {
        console.error("Hiba a regisztrációnál:", err);
        if (registerError) {
          registerError.textContent = "Nem sikerült csatlakozni a szerverhez.";
          registerError.classList.remove("d-none");
        } else {
          alert("Nem sikerült csatlakozni a szerverhez.");
        }
      }
    });
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
