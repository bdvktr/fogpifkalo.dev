document.addEventListener("DOMContentLoaded", () => {
    const itemsContainer = document.getElementById("checkoutCartItems");
    const totalEl = document.getElementById("checkoutTotal");
    const form = document.getElementById("checkoutForm");
    const errorBox = document.getElementById("checkoutError");

    async function loadCheckoutCart() {
        try {
            const res = await fetch("/api/cart");
            if (res.status === 401) {
                alert("A rendeléshez előbb jelentkezz be.");
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
                <div class="d-flex justify-content-between mb-1">
                  <div>
                    ${item.name}
                    <span class="text-muted">× ${item.quantity}</span>
                  </div>
                  <div>${Math.round(lineTotal).toLocaleString("hu-HU")} Ft</div>
                </div>
              `;
            });

            itemsContainer.innerHTML = html;
            totalEl.textContent =
                Math.round(total).toLocaleString("hu-HU") + " Ft";
        } catch (err) {
            console.error("Hiba a checkout kosár betöltésekor:", err);
            itemsContainer.textContent =
                "Nem sikerült csatlakozni a szerverhez.";
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

            const shippingName =
                document.getElementById("shippingName").value.trim();
            const shippingPhone =
                document.getElementById("shippingPhone").value.trim();
            const shippingAddress =
                document.getElementById("shippingAddress").value.trim();
            const note = document.getElementById("orderNote").value.trim();
            const paymentMethod =
                document.querySelector(
                    'input[name="paymentMethod"]:checked'
                )?.value || "cash";

            if (!shippingName || !shippingPhone || !shippingAddress) {
                const msg = "Kérlek töltsd ki a szállítási adatokat.";
                if (errorBox) {
                    errorBox.textContent = msg;
                    errorBox.classList.remove("d-none");
                } else {
                    alert(msg);
                }
                return;
            }

            try {
                const res = await fetch("/api/checkout", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        shippingName,
                        shippingPhone,
                        shippingAddress,
                        paymentMethod,
                        note,
                    }),
                });

                const data = await res.json();

                if (data.success) {
                    alert(data.message || "Rendelésedet fogadtuk, köszönjük!");
                    window.location.href = "fiok.html";
                } else {
                    const msg =
                        data.message || "Nem sikerült leadni a rendelést.";
                    if (errorBox) {
                        errorBox.textContent = msg;
                        errorBox.classList.remove("d-none");
                    } else {
                        alert(msg);
                    }
                }
            } catch (err) {
                console.error("Hiba a checkout POST-nál:", err);
                const msg = "Nem sikerült csatlakozni a szerverhez.";
                if (errorBox) {
                    errorBox.textContent = msg;
                    errorBox.classList.remove("d-none");
                } else {
                    alert(msg);
                }
            }
        });
    }

    loadCheckoutCart();
});