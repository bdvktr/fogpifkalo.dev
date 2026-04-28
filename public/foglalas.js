document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("reservationForm");
  const messageBox = document.getElementById("reservationMessage");

  if (!form) return;

  function showMessage(text, type = "success") {
    if (!messageBox) return;

    const alertClass =
      type === "success" ? "alert alert-success" : "alert alert-danger";

    messageBox.className = alertClass;
    messageBox.textContent = text;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    const name = formData.get("name")?.toString().trim();

    const phone = formData.get("phone")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const date = formData.get("date")?.toString();

    const timeFrom = formData.get("timeFrom")?.toString(); // ÚJ!
    const timeTo = formData.get("timeTo")?.toString(); // ÚJ!

    const tableNumber = formData.get("tableNumber")?.toString();
    const peopleCount = formData.get("peopleCount")?.toString();
    const note = formData.get("note")?.toString().trim() || null;

    // Kötelező mezők ellenőrzése
    if (
      !name ||
      !phone ||
      !email ||
      !date ||
      !timeFrom ||
      !timeTo ||
      !tableNumber ||
      !peopleCount
    ) {
      showMessage("Kérlek tölts ki minden kötelező mezőt.", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      showMessage("Érvénytelen email cím formátum.", "error");
      return;
    }

    // Mettől < Meddig ellenőrzés
    if (timeFrom >= timeTo) {
      showMessage("A foglalás vége legyen később, mint a kezdete.", "error");
      return;
    }

    try {
      const res = await apiFetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          email,
          date,
          timeFrom, // ⬅️ MÁR EZ MEGY A BACKENDNEK
          timeTo, // ⬅️ ÉS EZ IS
          tableNumber: Number(tableNumber),
          peopleCount: Number(peopleCount),
          note,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        alert("Asztalfoglaláshoz előbb be kell jelentkezned.");
        window.location.href = "/fiok.html";
        return;
      }

      if (!res.ok || !data.success) {
        showMessage(
          data.message || "Nem sikerült rögzíteni a foglalást.",
          "error",
        );
        return;
      }

      showMessage(
        data.message || "Foglalásod rögzítettük, hamarosan visszaigazoljuk. 🙂",
        "success",
      );

      form.reset();
    } catch (err) {
      console.error("Hiba a foglalás elküldésekor:", err);
      showMessage("Nem sikerült csatlakozni a szerverhez.", "error");
    }
  });
});
