document.addEventListener("DOMContentLoaded", () => {
  const adminError = document.getElementById("adminError");
  const adminContent = document.getElementById("adminContent");
  const productsList = document.getElementById("productsList");
  const ordersAdminList = document.getElementById("ordersAdminList");
  const newProductForm = document.getElementById("newProductForm");
  const editProductModalEl = document.getElementById("editProductModal");
  const editProductForm = document.getElementById("editProductForm");
  const editProductIdInput = document.getElementById("editProductId");
  const editProductNameInput = document.getElementById("editProductName");
  const editProductDescriptionInput = document.getElementById(
    "editProductDescription"
  );
  const editProductPriceInput = document.getElementById("editProductPrice");
  const editProductImageUrlInput = document.getElementById(
    "editProductImageUrl"
  );
  const editProductCategorySelect = document.getElementById(
    "editProductCategory"
  );
  const reservationsAdminList = document.getElementById(
    "reservationsAdminList"
  );

  // Új termék kép feltöltés (drag & drop)
  const newProductImageUrlInput = document.getElementById("newProductImageUrl");
  const newImageDropZone = document.getElementById("newImageDropZone");
  const newImageFileInput = document.getElementById("newImageFileInput");
  const newImageBrowseTrigger = document.getElementById(
    "newImageBrowseTrigger"
  );
  const newImageUploadStatus = document.getElementById("newImageUploadStatus");
  const newImagePreview = document.getElementById("newImagePreview");

  // Szerkesztés kép feltöltés (drag & drop)
  const editImageDropZone = document.getElementById("editImageDropZone");
  const editImageFileInput = document.getElementById("editImageFileInput");
  const editImageBrowseTrigger = document.getElementById(
    "editImageBrowseTrigger"
  );
  const editImageUploadStatus = document.getElementById(
    "editImageUploadStatus"
  );
  const editImagePreview = document.getElementById("editImagePreview");

  // Toast elemek
  const toastEl = document.getElementById("adminToast");
  const toastTextEl = document.getElementById("adminToastText");
  let toastInstance;

  if (toastEl && typeof bootstrap !== "undefined") {
    toastInstance = new bootstrap.Toast(toastEl);
  }

  // Confirm modal elemek
  const confirmModalEl = document.getElementById("confirmModal");
  const confirmModalMessageEl = document.getElementById("confirmModalMessage");
  const confirmModalConfirmBtn = document.getElementById(
    "confirmModalConfirmBtn"
  );
  let confirmModal;
  if (confirmModalEl && typeof bootstrap !== "undefined") {
    confirmModal = new bootstrap.Modal(confirmModalEl);
  }

  let editProductModal;
  if (editProductModalEl && typeof bootstrap !== "undefined") {
    editProductModal = new bootstrap.Modal(editProductModalEl);
  }

  const orderDetailsModalEl = document.getElementById("orderDetailsModal");
  const orderDetailsTitle = document.getElementById("orderDetailsTitle");
  const orderDetailsBody = document.getElementById("orderDetailsBody");

  const adminLogsList = document.getElementById("adminLogsList");

  let orderDetailsModal;
  if (orderDetailsModalEl && typeof bootstrap !== "undefined") {
    orderDetailsModal = new bootstrap.Modal(orderDetailsModalEl);
  }

  // Kis helper az Ft formázáshoz
  function formatFt(value) {
    return Math.round(Number(value)).toLocaleString("hu-HU");
  }

  function showError(message) {
    if (!adminError) return;
    adminError.textContent = message;
    adminError.classList.remove("d-none");
    adminContent.classList.add("d-none");
  }

  function hideError() {
    if (!adminError) return;
    adminError.textContent = "";
    adminError.classList.add("d-none");
  }

  // Toast helper
  function showToast(message, type = "success") {
    if (!toastEl || !toastTextEl || typeof bootstrap === "undefined") {
      console.log(`[${type}]`, message);
      return;
    }

    toastTextEl.textContent = message;
    toastEl.className = `toast align-items-center text-bg-${type} border-0`;

    if (!toastInstance) {
      toastInstance = new bootstrap.Toast(toastEl);
    }

    toastInstance.show();
  }

  // Confirm helper – Promise-t ad vissza (true/false)
  function showConfirm(message) {
    return new Promise((resolve) => {
      if (
        !confirmModal ||
        !confirmModalMessageEl ||
        !confirmModalConfirmBtn ||
        typeof bootstrap === "undefined"
      ) {
        const result = window.confirm(message);
        resolve(result);
        return;
      }

      confirmModalMessageEl.textContent = message;

      const handleConfirm = () => {
        cleanup();
        resolve(true);
        confirmModal.hide();
      };

      const handleHidden = () => {
        cleanup();
        resolve(false);
      };

      function cleanup() {
        confirmModalConfirmBtn.removeEventListener("click", handleConfirm);
        confirmModalEl.removeEventListener("hidden.bs.modal", handleHidden);
      }

      confirmModalConfirmBtn.addEventListener("click", handleConfirm, {
        once: true,
      });
      confirmModalEl.addEventListener("hidden.bs.modal", handleHidden, {
        once: true,
      });

      confirmModal.show();
    });
  }

  function setupImageUpload({
    dropZone,
    fileInput,
    browseTrigger,
    statusEl,
    previewImg,
  }) {
    if (!dropZone || !fileInput) {
      return {
        getSelectedFile: () => null,
        clearSelectedFile: () => { },
      };
    }

    let selectedFile = null;

    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      dropZone.addEventListener(eventName, preventDefaults, false);
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      dropZone.addEventListener(
        eventName,
        () => dropZone.classList.add("bg-light"),
        false
      );
    });

    ["dragleave", "drop"].forEach((eventName) => {
      dropZone.addEventListener(
        eventName,
        () => dropZone.classList.remove("bg-light"),
        false
      );
    });

    dropZone.addEventListener("click", () => fileInput.click());

    if (browseTrigger) {
      browseTrigger.addEventListener("click", (e) => {
        e.preventDefault();
        fileInput.click();
      });
    }

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        handleSelectedFile(file);
      }
    });

    dropZone.addEventListener("drop", (e) => {
      const dt = e.dataTransfer;
      const file = dt.files && dt.files[0];
      if (file) {
        handleSelectedFile(file);
      }
    });

    function handleSelectedFile(file) {
      if (!file.type.startsWith("image/")) {
        selectedFile = null;
        if (statusEl) statusEl.textContent = "Csak képfájlt tölthetsz fel.";
        if (previewImg) {
          previewImg.classList.add("d-none");
          previewImg.src = "";
        }
        return;
      }

      selectedFile = file;
      if (statusEl) statusEl.textContent = `Kiválasztott fájl: ${file.name}`;

      if (previewImg) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          previewImg.src = ev.target.result;
          previewImg.classList.remove("d-none");
        };
        reader.readAsDataURL(file);
      }
    }

    return {
      getSelectedFile() {
        return selectedFile;
      },
      clearSelectedFile() {
        selectedFile = null;
        if (statusEl) statusEl.textContent = "";
        if (previewImg) {
          previewImg.classList.add("d-none");
          previewImg.src = "";
        }
        fileInput.value = "";
      },
    };
  }

  //Admin logok szépítése
  function beautifyDetails(action, detailsObj) {
    if (!detailsObj || typeof detailsObj !== "object") return "";

    let result = [];

    switch (action) {
      case "product.create":
        if (detailsObj.name) result.push(`Név: ${detailsObj.name}`);
        if (detailsObj.price) result.push(`Ár: ${detailsObj.price} Ft`);
        if (detailsObj.category)
          result.push(`Kategória: ${detailsObj.category}`);
        break;

      case "product.update":
        if (detailsObj.name) result.push(`Új név: ${detailsObj.name}`);
        if (detailsObj.price) result.push(`Új ár: ${detailsObj.price} Ft`);
        if (detailsObj.category)
          result.push(`Kategória: ${detailsObj.category}`);
        break;

      case "product.softDelete":
        result.push(`Termék inaktiválva`);
        break;

      case "product.activate":
        result.push(`Termék újra aktiválva`);
        break;

      case "order.status.update":
        if (detailsObj.newStatus)
          result.push(`Új státusz: ${detailsObj.newStatus}`);
        break;

      case "reservation.status.update":
        if (detailsObj.newStatus)
          result.push(`Új státusz: ${detailsObj.newStatus}`);
        break;

      default:
        // fallback – ha nincs speciális formátum, stringeljük ki szépen
        result.push(JSON.stringify(detailsObj, null, 2));
    }

    return result.join("<br>");
  }

  const newImageUpload = setupImageUpload({
    dropZone: newImageDropZone,
    fileInput: newImageFileInput,
    browseTrigger: newImageBrowseTrigger,
    statusEl: newImageUploadStatus,
    previewImg: newImagePreview,
  });

  const editImageUpload = setupImageUpload({
    dropZone: editImageDropZone,
    fileInput: editImageFileInput,
    browseTrigger: editImageBrowseTrigger,
    statusEl: editImageUploadStatus,
    previewImg: editImagePreview,
  });

  // 🔹 1. Auth + admin ellenőrzés
  async function checkAdmin() {
    try {
      const res = await fetch("api/me/admin");
      const data = await res.json();

      if (!data.loggedIn) {
        showError("Ehhez az oldalhoz be kell jelentkezned admin fiókkal.");
        return;
      }

      if (!data.user || !data.user.isAdmin) {
        showError("Nincs jogosultságod az admin felület megtekintéséhez.");
        return;
      }

      // Ha idáig eljutunk → admin
      hideError();
      if (adminContent) adminContent.classList.remove("d-none");

      // Betöltjük a termékeket + rendeléseket
      await Promise.all([
        loadProducts(),
        loadOrders(),
        loadReservations(),
        loadAdminLogs(),
      ]);
    } catch (err) {
      console.error("Hiba az /api/me ellenőrzésnél:", err);
      showError("Nem sikerült csatlakozni a szerverhez.");
    }
  }

  // 🔹 2. Termékek betöltése
  async function loadProducts() {
    if (!productsList) return;
    productsList.textContent = "Termékek betöltése...";

    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();

      if (!data.success) {
        productsList.textContent =
          data.message || "Nem sikerült betölteni a termékeket.";
        return;
      }

      const products = data.products || [];

      if (products.length === 0) {
        productsList.textContent = "Még nincsenek termékek az adatbázisban.";
        return;
      }

      productsList.innerHTML = "";
      products.forEach((p) => {
        const isActive = Number(p.is_active) === 1;

        const wrapper = document.createElement("div");
        wrapper.className =
          "d-flex justify-content-between align-items-center border rounded p-2 mb-2";

        wrapper.innerHTML = `
        <div>
          <strong>${p.name}</strong>
          <div class="text-muted small">${p.description || ""}</div>
          <div class="small fw-semibold">${formatFt(p.price)} Ft</div>
          ${!isActive
            ? '<div class="badge bg-secondary mt-1">Inaktív</div>'
            : ""
          }
        </div>
        <div class="text-end">
          <button 
            class="btn btn-sm btn-outline-secondary me-1 admin-edit-product-btn"
            data-product-id="${p.id}"
            data-name="${p.name ? String(p.name).replace(/"/g, "&quot;") : ""}"
            data-description="${p.description ? String(p.description).replace(/"/g, "&quot;") : ""
          }"
            data-price="${p.price}"
            data-image-url="${p.image_url ? String(p.image_url).replace(/"/g, "&quot;") : ""
          }"
            data-category="${p.category || "burger"}"
            title="Szerkesztés"
          >
            <i class="bi bi-pencil"></i>
          </button>

          ${isActive
            ? `
            <button 
              class="btn btn-sm btn-outline-danger admin-delete-product-btn"
              data-product-id="${p.id}"
              title="Törlés"
            >
              <i class="bi bi-trash"></i>
            </button>`
            : `
            <button 
              class="btn btn-sm btn-outline-success admin-activate-product-btn"
              data-product-id="${p.id}"
              title="Újraaktiválás"
            >
              <i class="bi bi-arrow-counterclockwise"></i>
            </button>`
          }
        </div>
      `;

        productsList.appendChild(wrapper);
      });
    } catch (err) {
      console.error("Hiba a /api/admin/products hívásnál:", err);
      productsList.textContent =
        "Nem sikerült csatlakozni a szerverhez (termékek).";
    }
  }

  // 🔹 3. Új termék hozzáadása
  if (newProductForm) {
    newProductForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(newProductForm);
      const name = formData.get("name");
      const description = formData.get("description");
      const price = formData.get("price");
      let image_url = formData.get("image_url");
      const category = formData.get("category") || "burger";

      // Ha van feltöltött kép, először azt küldjük fel Multerrel
      const newFile = newImageUpload.getSelectedFile
        ? newImageUpload.getSelectedFile()
        : null;

      if (newFile) {
        const uploadedUrl = await uploadImageFile(
          newFile,
          newImageUploadStatus
        );
        if (!uploadedUrl) {
          // hibáról már szóltunk toastban, ne menjünk tovább
          return;
        }
        image_url = uploadedUrl;
        if (newProductImageUrlInput) {
          newProductImageUrlInput.value = image_url;
        }
      }

      if (!name || !price) {
        showToast("A név és az ár megadása kötelező.", "warning");
        return;
      }

      try {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description,
            price: Number(price),
            image_url,
            category,
          }),
        });

        const data = await res.json();

        if (data.success) {
          showToast("Termék sikeresen hozzáadva.", "success");
          newProductForm.reset();
          await loadProducts();
          if (newImageUpload && newImageUpload.clearSelectedFile) {
            newImageUpload.clearSelectedFile();
          }
        } else {
          showToast(
            data.message || "Nem sikerült létrehozni a terméket.",
            "danger"
          );
        }
      } catch (err) {
        console.error("Hiba a termék hozzáadásánál:", err);
        showToast("Nem sikerült csatlakozni a szerverhez.", "danger");
      }
    });
  }

  // 🔹 4. Termék szerkesztése / Törlése
  if (productsList) {
    productsList.addEventListener("click", async (e) => {
      const deleteBtn = e.target.closest(".admin-delete-product-btn");
      const activateBtn = e.target.closest(".admin-activate-product-btn");
      const editBtn = e.target.closest(".admin-edit-product-btn");

      // 🔹 Inaktiválás (soft delete)
      if (deleteBtn) {
        const productId = deleteBtn.dataset.productId;
        if (!productId) return;

        const ok = await showConfirm("Biztosan inaktiválod ezt a terméket?");
        if (!ok) return;

        try {
          const res = await fetch(`/api/admin/products/${productId}`, {
            method: "DELETE",
          });
          const data = await res.json();

          if (data.success) {
            showToast("Termék inaktiválva.", "success");
            await loadProducts();
          } else {
            showToast(
              data.message || "Nem sikerült inaktiválni a terméket.",
              "danger"
            );
          }
        } catch (err) {
          console.error("Hiba a termék törlésekor:", err);
          showToast("Nem sikerült csatlakozni a szerverhez.", "danger");
        }

        return;
      }

      // 🔹 Újraaktiválás
      if (activateBtn) {
        const productId = activateBtn.dataset.productId;
        if (!productId) return;

        const ok = await showConfirm("Biztosan újraaktiválod ezt a terméket?");
        if (!ok) return;

        try {
          const res = await fetch(`/api/admin/products/${productId}/activate`, {
            method: "PUT",
          });
          const data = await res.json();

          if (data.success) {
            showToast("Termék újraaktiválva.", "success");
            await loadProducts();
          } else {
            showToast(
              data.message || "Nem sikerült aktiválni a terméket.",
              "danger"
            );
          }
        } catch (err) {
          console.error("Hiba a termék aktiválásakor:", err);
          showToast("Nem sikerült csatlakozni a szerverhez.", "danger");
        }

        return;
      }

      // 🔹 Szerkesztés
      if (editBtn && editProductModal && editProductForm) {
        const productId = editBtn.dataset.productId;
        const name = editBtn.dataset.name || "";
        const description = editBtn.dataset.description || "";
        const price = editBtn.dataset.price || "";
        const imageUrl = editBtn.dataset.imageUrl || "";
        const category = editBtn.dataset.category || "burger";

        editProductIdInput.value = productId;
        editProductNameInput.value = name;
        editProductDescriptionInput.value = description;
        editProductPriceInput.value = price;
        editProductImageUrlInput.value = imageUrl;

        if (editProductCategorySelect) {
          editProductCategorySelect.value = category;
        }

        editProductModal.show();
      }
    });
  }

  // 🔹 Termék szerkesztésének mentése
  if (editProductForm) {
    editProductForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const id = editProductIdInput.value;
      const name = editProductNameInput.value.trim();
      const description = editProductDescriptionInput.value.trim();
      const price = editProductPriceInput.value;
      let image_url = editProductImageUrlInput.value.trim();
      const category = editProductCategorySelect
        ? editProductCategorySelect.value
        : "burger";

      // Ha szerkesztéskor új képet választottunk, töltsük fel Multerrel
      const editFile = editImageUpload.getSelectedFile
        ? editImageUpload.getSelectedFile()
        : null;

      if (editFile) {
        const uploadedUrl = await uploadImageFile(
          editFile,
          editImageUploadStatus
        );
        if (!uploadedUrl) {
          return;
        }
        image_url = uploadedUrl;
        if (editProductImageUrlInput) {
          editProductImageUrlInput.value = image_url;
        }
      }

      if (!id || !name || !price) {
        showToast("A név és az ár megadása kötelező.", "warning");
        return;
      }

      try {
        const res = await fetch(`/api/admin/products/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description,
            price: Number(price),
            image_url,
            category,
          }),
        });

        const data = await res.json();

        if (data.success) {
          showToast("Termék frissítve.", "success");
          editProductModal.hide();
          await loadProducts();
          if (editImageUpload && editImageUpload.clearSelectedFile) {
            editImageUpload.clearSelectedFile();
          }
        } else {
          showToast(
            data.message || "Nem sikerült frissíteni a terméket.",
            "danger"
          );
        }
      } catch (err) {
        console.error("Hiba a termék frissítésekor:", err);
        showToast("Nem sikerült csatlakozni a szerverhez.", "danger");
      }
    });
  }

  // 🔹 5. Rendelések betöltése
  async function loadOrders() {
    if (!ordersAdminList) return;

    ordersAdminList.textContent = "Rendelések betöltése...";

    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();

      if (!data.success) {
        ordersAdminList.textContent =
          data.message || "Nem sikerült betölteni a rendeléseket.";
        return;
      }

      const orders = data.orders || [];

      if (orders.length === 0) {
        ordersAdminList.textContent = "Még nincsenek leadott rendelések.";
        return;
      }

      // 🔹 Szétválogatjuk státusz szerint
      const pendingOrders = orders.filter((o) => o.status === "pending");
      const completedOrders = orders.filter((o) => o.status === "completed");
      const cancelledOrders = orders.filter((o) => o.status === "cancelled");

      // 🔹 Konténer kiürítése
      ordersAdminList.innerHTML = "";

      function renderSection(title, list, emptyText) {
        const section = document.createElement("div");
        section.className = "mb-4";

        const heading = document.createElement("h3");
        heading.className = "h6 mb-2";
        heading.textContent = title;
        section.appendChild(heading);

        const container = document.createElement("div");
        container.className = "small";
        section.appendChild(container);

        if (!list || list.length === 0) {
          container.textContent = emptyText;
        } else {
          list.forEach((o) => {
            const wrapper = document.createElement("div");
            wrapper.className = "border rounded p-2 mb-2";

            const createdAt = new Date(o.created_at);
            const formattedDate = createdAt.toLocaleString("hu-HU");

            let statusText = "";
            switch (o.status) {
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
                statusText = o.status;
            }

            wrapper.innerHTML = `
            <div class="d-flex justify-content-between mb-1">
              <div>
                <strong>Rendelés #${o.id}</strong>
                <div class="text-muted small">${formattedDate}</div>
                <div class="text-muted small">Vevő: ${o.user_email}</div>
              </div>
              <div class="text-end" style="min-width: 190px;">
                <div class="mb-1">
                  <span class="badge bg-secondary">${statusText}</span>
                </div>
                <select 
                  class="form-select form-select-sm admin-order-status mb-1"
                  data-order-id="${o.id}"
                  data-original-status="${o.status}"
                >
                  <option value="pending"   ${o.status === "pending" ? "selected" : ""
              }>Folyamatban</option>
                  <option value="completed" ${o.status === "completed" ? "selected" : ""
              }>Teljesítve</option>
                  <option value="cancelled" ${o.status === "cancelled" ? "selected" : ""
              }>Törölve</option>
                </select>

                <div class="d-flex justify-content-between align-items-center mt-1">
                  <span class="fw-semibold">${formatFt(o.total_price)} Ft</span>
                  <button 
                    type="button"
                    class="btn btn-sm btn-outline-primary ms-2 admin-order-details-btn"
                    data-order-id="${o.id}"
                  >
                    Részletek
                  </button>
                </div>
              </div>
            </div>
          `;

            container.appendChild(wrapper);
          });
        }

        ordersAdminList.appendChild(section);
      }

      // 🔹 Három blokk egymás alatt
      renderSection(
        "Folyamatban",
        pendingOrders,
        "Nincs folyamatban lévő rendelés."
      );
      renderSection(
        "Teljesítve",
        completedOrders,
        "Nincs teljesített rendelés."
      );
      renderSection("Törölve", cancelledOrders, "Nincs törölt rendelés.");
    } catch (err) {
      console.error("Hiba a /api/admin/orders hívásnál:", err);
      ordersAdminList.textContent =
        "Nem sikerült csatlakozni a szerverhez (rendelések).";
    }
  }

  // 🔹 6. Asztalfoglalások betöltése
  async function loadReservations() {
    if (!reservationsAdminList) return;

    reservationsAdminList.textContent = "Foglalások betöltése...";

    try {
      const res = await fetch("/api/admin/reservations");
      const data = await res.json();

      if (!data.success) {
        reservationsAdminList.textContent =
          data.message || "Nem sikerült betölteni a foglalásokat.";
        return;
      }

      const reservations = data.reservations || [];

      if (reservations.length === 0) {
        reservationsAdminList.textContent = "Még nincsenek foglalások.";
        return;
      }

      const pending = reservations.filter((r) => r.status === "pending");
      const confirmed = reservations.filter((r) => r.status === "confirmed");
      const cancelled = reservations.filter((r) => r.status === "cancelled");

      reservationsAdminList.innerHTML = "";

      function formatDateAndTimeRange(r) {
        let datePart = "";
        let timeFrom = "";
        let timeTo = "";

        // Dátum normalizálás (lehet string "YYYY-MM-DD" vagy Date)
        if (r.reservation_date) {
          const d = new Date(r.reservation_date);
          datePart = d.toLocaleDateString("hu-HU");
        }

        // Kezdő idő (reservation_time)
        if (typeof r.reservation_time === "string") {
          timeFrom = r.reservation_time.slice(0, 5); // "HH:MM"
        } else if (r.reservation_time instanceof Date) {
          timeFrom = r.reservation_time.toTimeString().slice(0, 5);
        }

        // Vég idő (end_time) – ha nincs, fallback: +2 óra
        if (r.end_time) {
          if (typeof r.end_time === "string") {
            timeTo = r.end_time.slice(0, 5);
          } else if (r.end_time instanceof Date) {
            timeTo = r.end_time.toTimeString().slice(0, 5);
          }
        } else {
          // régi foglalás – számoljunk +2 órát
          const tmpStart = new Date(`${datePart}T${timeFrom}:00`);
          if (!isNaN(tmpStart.getTime())) {
            const tmpEndMs = tmpStart.getTime() + 120 * 60 * 1000;
            const tmpEnd = new Date(tmpEndMs);
            timeTo = tmpEnd.toTimeString().slice(0, 5);
          }
        }

        let dateLabel = "";
        try {
          const d = new Date(`${datePart}T00:00:00`);
          if (!isNaN(d.getTime())) {
            dateLabel = d.toLocaleDateString("hu-HU", {
              year: "numeric",
              month: "short",
              day: "2-digit",
            });
          } else {
            dateLabel = datePart;
          }
        } catch (e) {
          dateLabel = datePart;
        }

        const timeRange =
          timeFrom && timeTo ? `${timeFrom}–${timeTo}` : timeFrom || "";

        return {
          dateLabel,
          timeRange,
        };
      }

      function renderSection(title, list, emptyText) {
        const section = document.createElement("div");
        section.className = "mb-4";

        const heading = document.createElement("h3");
        heading.className = "h6 mb-2";
        heading.textContent = title;
        section.appendChild(heading);

        const container = document.createElement("div");
        container.className = "small";
        section.appendChild(container);

        if (!list || list.length === 0) {
          container.textContent = emptyText;
        } else {
          list.forEach((r) => {
            const wrapper = document.createElement("div");
            wrapper.className = "border rounded p-2 mb-2";

            const { dateLabel, timeRange } = formatDateAndTimeRange(r);

            wrapper.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div><strong>${dateLabel}${timeRange ? " • " + timeRange : ""
              }</strong></div>
                <div>Asztal: <strong>${r.table_number}.</strong> • ${r.people_count
              } fő</div>
                <div>${r.name} – ${r.phone}</div>
                ${r.note
                ? `<div class="text-muted small mt-1">Megjegyzés: ${r.note}</div>`
                : ""
              }
              </div>
              <div class="text-end">
                <div class="mb-1">
                  ${r.status === "pending"
                ? '<span class="badge bg-warning text-dark">Függőben</span>'
                : r.status === "confirmed"
                  ? '<span class="badge bg-success">Megerősítve</span>'
                  : '<span class="badge bg-secondary">Lemondva</span>'
              }
                </div>
                <div>
                  ${r.status === "pending"
                ? `
                    <button 
                      class="btn btn-sm btn-outline-success me-1 admin-reservation-confirm-btn"
                      data-reservation-id="${r.id}"
                    >
                      Jóváhagyás
                    </button>
                    <button 
                      class="btn btn-sm btn-outline-danger admin-reservation-cancel-btn"
                      data-reservation-id="${r.id}"
                    >
                      Lemondás
                    </button>
                  `
                : ""
              }
                </div>
              </div>
            </div>
          `;

            container.appendChild(wrapper);
          });
        }

        reservationsAdminList.appendChild(section);
      }

      renderSection(
        "Függőben lévő foglalások",
        pending,
        "Nincs függőben lévő foglalás."
      );
      renderSection(
        "Megerősített foglalások",
        confirmed,
        "Nincs megerősített foglalás."
      );
      renderSection(
        "Lemondott foglalások",
        cancelled,
        "Nincs lemondott foglalás."
      );
    } catch (err) {
      console.error("Hiba a /api/admin/reservations hívásnál:", err);
      reservationsAdminList.textContent =
        "Nem sikerült csatlakozni a szerverhez (foglalások).";
    }
  }

  // 🔹 7. Admin log betöltése (read-only)
  async function loadAdminLogs() {
    const detailLabels = {
      name: "Név",
      price: "Ár",
      category: "Kategória",
      is_active: "Aktív",
      newStatus: "Új státusz",
      oldStatus: "Régi státusz",
      description: "Leírás",
    };

    const statusTranslations = {
      completed: "teljesítve",
      cancelled: "törölve",
      pending: "függőben",
      confirmed: "megerősítve",
      preparing: "készítés alatt",
      delivered: "kiszállítva",
    };

    const entityTranslations = {
      product: "termék",
      order: "rendelés",
      reservation: "foglalás",
    };

    const statusIcons = {
      completed: "🟢",
      cancelled: "🔴",
      pending: "🟡",
      preparing: "🟠",
      confirmed: "🔵",
      delivered: "📦",
    };

    if (!adminLogsList) return;

    adminLogsList.textContent = "Admin log betöltése...";

    try {
      const res = await fetch("/api/admin/logs");
      const data = await res.json();

      if (!data.success) {
        adminLogsList.textContent =
          data.message || "Nem sikerült betölteni az admin logot.";
        return;
      }

      const logs = data.logs || [];

      if (logs.length === 0) {
        adminLogsList.textContent = "Még nincsenek log bejegyzések.";
        return;
      }

      adminLogsList.innerHTML = "";

      logs.forEach((log) => {
        const wrapper = document.createElement("div");
        wrapper.className = "border rounded p-2 mb-2";

        const dateLabel = log.created_at
          ? new Date(log.created_at).toLocaleString("hu-HU")
          : "";

        const adminLabel =
          log.admin_name || log.admin_email || "Ismeretlen admin";

        let detailsData = null;

        if (log.details_json) {
          try {
            const parsed =
              typeof log.details_json === "string"
                ? JSON.parse(log.details_json)
                : log.details_json;

            detailsData = parsed; // ❗ OBJEKTUM marad, nem string!
          } catch {
            detailsData = null;
          }
        }

        const entityLabel =
          entityTranslations[log.entity_type] || log.entity_type || "-";
        const entityDisplay = `${entityLabel}${log.entity_id ? " #" + log.entity_id : ""
          }`;

        wrapper.innerHTML = `
          <div class="d-flex justify-content-between">
            <div>
              <div><strong>${log.action}</strong></div>
              <div class="text-muted small">
                Admin: ${adminLabel}
              </div>
              <div class="text-muted small">
              Entitás: ${entityDisplay}
            </div>
            ${Object.entries(detailsData)
              .map(([key, val]) => {
              const label = detailLabels[key] || key;

              // Státusz magyarítása
              const translatedVal =
                typeof val === "string" && statusTranslations[val]
                  ? statusTranslations[val]
                  : val;

              // Státusz ikon
              const icon =
                typeof val === "string" && statusIcons[val] ? statusIcons[val] + " " : "";

              // Ár formázása
              if (key === "price") {
                return `<li><strong>${label}:</strong> ${translatedVal} Ft</li>`;
              }

              // Boolean (1/0) formázás
              if (val === 1 || val === 0) {
                return `<li><strong>${label}:</strong> ${val === 1 ? "igen" : "nem"
                  }</li>`;
              }

              return `<li><strong>${label}:</strong> ${icon}${translatedVal}</li>`;
              })
            .join("")}
            </div>
            <div class="text-end small text-muted">
              ${dateLabel}
            </div>
          </div>
        `;

        adminLogsList.appendChild(wrapper);
      });
    } catch (err) {
      console.error("Hiba az admin log betöltésekor:", err);
      adminLogsList.textContent =
        "Nem sikerült csatlakozni a szerverhez (admin log).";
    }
  }

  // 🔹 Foglalások státuszának módosítása (Jóváhagyás / Lemondás)
  if (reservationsAdminList) {
    reservationsAdminList.addEventListener("click", async (e) => {
      const confirmBtn = e.target.closest(".admin-reservation-confirm-btn");
      const cancelBtn = e.target.closest(".admin-reservation-cancel-btn");

      if (confirmBtn) {
        const id = confirmBtn.dataset.reservationId;
        if (!id) return;

        const ok = await showConfirm("Biztosan jóváhagyod ezt a foglalást?");
        if (!ok) return;

        try {
          const res = await fetch(`/api/admin/reservations/${id}/status`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "confirmed" }),
          });

          const data = await res.json();

          if (data.success) {
            showToast("Foglalás jóváhagyva.", "success");
            await loadReservations();
          } else {
            showToast(
              data.message || "Nem sikerült módosítani a foglalás státuszát.",
              "danger"
            );
          }
        } catch (err) {
          console.error("Hiba a foglalás jóváhagyásakor:", err);
          showToast("Nem sikerült csatlakozni a szerverhez.", "danger");
        }

        return;
      }

      if (cancelBtn) {
        const id = cancelBtn.dataset.reservationId;
        if (!id) return;

        const ok = await showConfirm("Biztosan lemondod ezt a foglalást?");
        if (!ok) return;

        try {
          const res = await fetch(`/api/admin/reservations/${id}/status`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "cancelled" }),
          });

          const data = await res.json();

          if (data.success) {
            showToast("Foglalás lemondva.", "success");
            await loadReservations();
          } else {
            showToast(
              data.message || "Nem sikerült módosítani a foglalás státuszát.",
              "danger"
            );
          }
        } catch (err) {
          console.error("Hiba a foglalás lemondásakor:", err);
          showToast("Nem sikerült csatlakozni a szerverhez.", "danger");
        }

        return;
      }
    });
  }

  // 🔹 Rendelés státusz váltása (event delegation)
  if (ordersAdminList) {
    ordersAdminList.addEventListener("change", async (e) => {
      const select = e.target.closest(".admin-order-status");
      if (!select) return;

      const orderId = select.dataset.orderId;
      const newStatus = select.value;
      const originalStatus = select.dataset.originalStatus || newStatus;

      if (!orderId || !newStatus) return;

      // Magyar szöveg a státuszhoz (a modal üzenethez)
      let statusTextHu = "";
      switch (newStatus) {
        case "pending":
          statusTextHu = "Folyamatban";
          break;
        case "completed":
          statusTextHu = "Teljesítve";
          break;
        case "cancelled":
          statusTextHu = "Törölve";
          break;
        default:
          statusTextHu = newStatus;
      }

      const ok = await showConfirm(
        `Biztosan módosítod a rendelés státuszát erre: "${statusTextHu}"?`
      );

      if (!ok) {
        // Ha mégse, állítsuk vissza a selectet az eredeti értékre
        select.value = originalStatus;
        return;
      }

      try {
        const res = await fetch(`/api/admin/orders/${orderId}/status`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        });

        const data = await res.json();

        if (data.success) {
          showToast("Rendelés státusza frissítve.", "success");
          // Siker esetén frissítjük az "eredeti" státuszt is
          select.dataset.originalStatus = newStatus;
          await loadOrders();
        } else {
          showToast(
            data.message || "Nem sikerült frissíteni a státuszt.",
            "danger"
          );
          // Ha szerver hiba, állítsuk vissza a régire
          select.value = originalStatus;
        }
      } catch (err) {
        console.error("Hiba a rendelés státusz módosításakor:", err);
        showToast("Nem sikerült csatlakozni a szerverhez.", "danger");
        // Hiba esetén is visszaállítjuk a selectet
        select.value = originalStatus;
      }
    });
  }

  // 🔹 Rendelés részletek megnyitása
  if (ordersAdminList) {
    ordersAdminList.addEventListener("click", async (e) => {
      const btn = e.target.closest(".admin-order-details-btn");
      if (!btn || !orderDetailsModal || !orderDetailsBody) return;

      const orderId = btn.dataset.orderId;
      if (!orderId) return;

      // Alapértelmezett szöveg a modalban
      orderDetailsTitle.textContent = `Rendelés #${orderId} – részletek`;
      orderDetailsBody.innerHTML = `<div class="text-muted small">Részletek betöltése...</div>`;
      orderDetailsModal.show();

      try {
        const res = await fetch(`/api/admin/orders/${orderId}`);
        const data = await res.json();

        if (!data.success) {
          orderDetailsBody.innerHTML = `
          <div class="alert alert-danger small mb-0">
            ${data.message || "Nem sikerült betölteni a rendelés részleteit."}
          </div>
        `;
          return;
        }

        const order = data.order;
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

        // Fejléc infók
        const headerHtml = `
        <div class="mb-3">
          <div><strong>Rendelés azonosító:</strong> #${order.id}</div>
          <div><strong>Dátum:</strong> ${formattedDate}</div>
          <div><strong>Státusz:</strong> ${statusText}</div>
          <div><strong>Vevő:</strong> ${order.user.name || ""} &lt;${order.user.email
          }&gt;</div>
        </div>
      `;

        // Tételek táblázat
        let itemsRows = "";
        order.items.forEach((item) => {
          const lineTotal = item.unit_price * item.quantity;
          itemsRows += `
          <tr>
            <td>${item.name}</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-end">${formatFt(item.unit_price)} Ft</td>
            <td class="text-end">${formatFt(lineTotal)} Ft</td>
          </tr>
        `;
        });

        const itemsTable = `
        <div class="table-responsive mb-3">
          <table class="table table-sm align-middle">
            <thead>
              <tr>
                <th>Termék</th>
                <th class="text-center">Mennyiség</th>
                <th class="text-end">Egységár</th>
                <th class="text-end">Összesen</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
        </div>
      `;

        const footerHtml = `
        <div class="d-flex justify-content-end">
          <div class="fw-semibold">
            Végösszeg: ${formatFt(order.total_price)} Ft
          </div>
        </div>
      `;

        orderDetailsBody.innerHTML = headerHtml + itemsTable + footerHtml;
      } catch (err) {
        console.error("Hiba a rendelés részleteinek lekérdezésénél:", err);
        orderDetailsBody.innerHTML = `
        <div class="alert alert-danger small mb-0">
          Nem sikerült csatlakozni a szerverhez.
        </div>
      `;
      }
    });
  }

  async function uploadImageFile(file, statusEl) {
    if (!file) return null;

    const formData = new FormData();
    formData.append("image", file);

    if (statusEl) statusEl.textContent = "Kép feltöltése folyamatban...";

    try {
      const res = await fetch("/api/admin/products/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.imageUrl) {
        if (statusEl) statusEl.textContent = "Képfeltöltés sikertelen.";
        showToast(data.message || "Nem sikerült feltölteni a képet.", "danger");
        return null;
      }

      if (statusEl) statusEl.textContent = "Kép sikeresen feltöltve.";
      return data.imageUrl;
    } catch (err) {
      console.error("Képfeltöltési hiba:", err);
      if (statusEl) statusEl.textContent = "Képfeltöltés sikertelen.";
      showToast("Nem sikerült csatlakozni a szerverhez.", "danger");
      return null;
    }
  }

  // 🔹 Indításkor: ellenőrizzük, hogy admin-e a user
  checkAdmin();
});
