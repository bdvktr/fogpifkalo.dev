document.addEventListener("DOMContentLoaded", () => {
  const MIN_RESERVATION_DURATION_MINUTES = 60;
  const TABLES = [
    { number: 1, zone: "indoor", zoneLabel: "Benti", name: "1. asztal" },
    { number: 2, zone: "indoor", zoneLabel: "Benti", name: "2. asztal" },
    { number: 3, zone: "indoor", zoneLabel: "Benti", name: "3. asztal" },
    { number: 4, zone: "outdoor", zoneLabel: "Kinti", name: "4. asztal" },
    { number: 5, zone: "outdoor", zoneLabel: "Kinti", name: "5. asztal" },
    { number: 6, zone: "outdoor", zoneLabel: "Kinti", name: "6. asztal" },
  ];
  const WEEKDAY_NAMES = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];
  const MONTH_NAMES = [
    "január",
    "február",
    "március",
    "április",
    "május",
    "június",
    "július",
    "augusztus",
    "szeptember",
    "október",
    "november",
    "december",
  ];

  const form = document.getElementById("reservationForm");
  const messageBox = document.getElementById("reservationMessage");
  const stepEls = Array.from(document.querySelectorAll(".reservation-step"));
  const panelEls = Array.from(document.querySelectorAll(".reservation-step-panel"));
  const monthLabel = document.getElementById("calendarMonthLabel");
  const calendarGrid = document.getElementById("calendarGrid");
  const prevMonthBtn = document.getElementById("calendarPrevBtn");
  const nextMonthBtn = document.getElementById("calendarNextBtn");
  const tableListEl = document.getElementById("reservationTableList");
  const slotGridEl = document.getElementById("reservationSlotGrid");
  const selectedDateHint = document.getElementById("selectedDateHint");
  const selectedTableHint = document.getElementById("selectedTableHint");
  const selectedDateDisplay = document.getElementById("selectedDateDisplay");
  const selectedTableDisplay = document.getElementById("selectedTableDisplay");
  const step1NextBtn = document.getElementById("step1NextBtn");
  const step2PrevBtn = document.getElementById("step2PrevBtn");
  const step2NextBtn = document.getElementById("step2NextBtn");
  const step3PrevBtn = document.getElementById("step3PrevBtn");
  const step3NextBtn = document.getElementById("step3NextBtn");
  const step4PrevBtn = document.getElementById("step4PrevBtn");
  const submitBtn = document.getElementById("reservationSubmitBtn");

  const hiddenDateInput = form?.elements.namedItem("date");
  const hiddenTimeFromInput = form?.elements.namedItem("timeFrom");
  const hiddenTimeToInput = form?.elements.namedItem("timeTo");
  const hiddenTableInput = form?.elements.namedItem("tableNumber");

  const summaryDate = document.getElementById("summaryDate");
  const summaryTable = document.getElementById("summaryTable");
  const summaryTime = document.getElementById("summaryTime");
  const summaryPeople = document.getElementById("summaryPeople");
  const summaryGuest = document.getElementById("summaryGuest");
  const summaryNote = document.getElementById("summaryNote");

  if (!form) return;

  const today = new Date();
  const state = {
    step: 1,
    currentMonth: new Date(today.getFullYear(), today.getMonth(), 1),
    selectedDate: toISODate(today),
    selectedTable: null,
    selectedTimeFrom: "",
    selectedTimeTo: "",
    availabilityDate: "",
    reservations: [],
    loadingAvailability: false,
  };

  function showMessage(text, type = "success") {
    if (!messageBox) return;
    const alertClass = type === "success" ? "alert alert-success" : "alert alert-danger";
    messageBox.className = alertClass;
    messageBox.textContent = text;
  }

  function clearMessage() {
    if (!messageBox) return;
    messageBox.className = "";
    messageBox.textContent = "";
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function toISODate(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function parseISODate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }
    return date;
  }

  function formatDateLong(value) {
    const date = parseISODate(value);
    if (!date) return "-";

    return new Intl.DateTimeFormat("hu-HU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    }).format(date);
  }

  function formatMonthLabel(date) {
    return `${date.getFullYear()}. ${MONTH_NAMES[date.getMonth()]}`;
  }

  function getTableMeta(tableNumber) {
    return TABLES.find((table) => table.number === Number(tableNumber)) || null;
  }

  function formatTableLabel(tableNumber) {
    const table = getTableMeta(tableNumber);
    if (!table) return "-";
    return `${table.zoneLabel} • ${table.name}`;
  }

  function normalizeTime(value) {
    return typeof value === "string" ? value.slice(0, 5) : "";
  }

  function minutesFromHHMM(value) {
    const [hour, minute] = String(value).split(":").map(Number);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return NaN;
    return hour * 60 + minute;
  }

  function hhmmFromMinutes(totalMinutes) {
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    return `${pad(hour)}:${pad(minute)}`;
  }

  function addMinutes(value, minutes) {
    const start = minutesFromHHMM(value);
    if (Number.isNaN(start)) return "";
    return hhmmFromMinutes(start + minutes);
  }

  function getOpeningWindow(dateString) {
    const date = parseISODate(dateString);
    if (!date) {
      return { startMinutes: 11 * 60, endMinutes: 22 * 60 };
    }

    const day = date.getDay();
    const isWeekend = day === 0 || day === 6;
    return isWeekend
      ? { startMinutes: 12 * 60, endMinutes: 23 * 60 }
      : { startMinutes: 11 * 60, endMinutes: 22 * 60 };
  }

  function getTimeOptionsForDate(dateString) {
    const { startMinutes, endMinutes } = getOpeningWindow(dateString);
    const times = [];

    for (let value = startMinutes; value <= endMinutes; value += 30) {
      times.push(hhmmFromMinutes(value));
    }

    return times;
  }

  function isPastDate(dateString) {
    const date = parseISODate(dateString);
    if (!date) return true;
    const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return date < currentDay;
  }

  function isTimeInPast(dateString, timeFrom) {
    const date = parseISODate(dateString);
    if (!date) return true;

    const now = new Date();
    const startMinutes = minutesFromHHMM(timeFrom);
    if (Number.isNaN(startMinutes)) return true;

    const startDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      Math.floor(startMinutes / 60),
      startMinutes % 60,
      0,
      0,
    );

    return startDate.getTime() <= now.getTime();
  }

  function hasOverlap(reservations, timeFrom, timeTo) {
    const newStart = minutesFromHHMM(timeFrom);
    const newEnd = minutesFromHHMM(timeTo);

    return reservations.some((reservation) => {
      const existingStart = minutesFromHHMM(normalizeTime(reservation.timeFrom));
      const existingEnd = minutesFromHHMM(normalizeTime(reservation.timeTo));

      if (
        Number.isNaN(existingStart) ||
        Number.isNaN(existingEnd) ||
        Number.isNaN(newStart) ||
        Number.isNaN(newEnd)
      ) {
        return false;
      }

      return !(existingEnd <= newStart || existingStart >= newEnd);
    });
  }

  function getReservationsForSelectedTable() {
    if (!state.selectedTable) return [];
    return state.reservations.filter(
      (reservation) => Number(reservation.tableNumber) === Number(state.selectedTable),
    );
  }

  function getReservationsForTable(tableNumber) {
    return state.reservations.filter(
      (reservation) => Number(reservation.tableNumber) === Number(tableNumber),
    );
  }

  function isTimeInsideBookedInterval(reservations, timeValue) {
    const minutes = minutesFromHHMM(timeValue);

    if (Number.isNaN(minutes)) {
      return false;
    }

    return reservations.some((reservation) => {
      const start = minutesFromHHMM(normalizeTime(reservation.timeFrom));
      const end = minutesFromHHMM(normalizeTime(reservation.timeTo));

      if (Number.isNaN(start) || Number.isNaN(end)) {
        return false;
      }

      return minutes >= start && minutes < end;
    });
  }

  function canUseTimeAsStart(tableNumber, timeValue) {
    if (!state.selectedDate || !tableNumber) {
      return false;
    }

    const startMinutes = minutesFromHHMM(timeValue);
    const { endMinutes } = getOpeningWindow(state.selectedDate);

    if (Number.isNaN(startMinutes)) {
      return false;
    }

    if (startMinutes + MIN_RESERVATION_DURATION_MINUTES > endMinutes) {
      return false;
    }

    if (isTimeInPast(state.selectedDate, timeValue)) {
      return false;
    }

    const reservations = getReservationsForTable(tableNumber);

    if (isTimeInsideBookedInterval(reservations, timeValue)) {
      return false;
    }

    const possibleEnd = hhmmFromMinutes(startMinutes + MIN_RESERVATION_DURATION_MINUTES);
    return !hasOverlap(reservations, timeValue, possibleEnd);
  }

  function canUseTimeAsEnd(tableNumber, timeValue) {
    if (!state.selectedDate || !tableNumber || !state.selectedTimeFrom) {
      return false;
    }

    const startMinutes = minutesFromHHMM(state.selectedTimeFrom);
    const endMinutes = minutesFromHHMM(timeValue);

    if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes)) {
      return false;
    }

    if (endMinutes <= startMinutes) {
      return false;
    }

    if (endMinutes - startMinutes < MIN_RESERVATION_DURATION_MINUTES) {
      return false;
    }

    const reservations = getReservationsForTable(tableNumber);
    return !hasOverlap(reservations, state.selectedTimeFrom, timeValue);
  }

  function hasAvailableTimeRangeForTable(tableNumber) {
    return getTimeOptionsForDate(state.selectedDate).some((timeValue) =>
      canUseTimeAsStart(tableNumber, timeValue),
    );
  }

  async function loadAvailability(dateString) {
    state.loadingAvailability = true;
    renderTables();
    renderSlots();

    try {
      const res = await apiFetch(`/api/reservations/availability?date=${encodeURIComponent(dateString)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Nem sikerült lekérni a foglalási adatokat.");
      }

      state.availabilityDate = dateString;
      state.reservations = Array.isArray(data.reservations) ? data.reservations : [];

      const currentTableAvailable = state.selectedTable
        ? hasAvailableTimeRangeForTable(state.selectedTable)
        : true;

      if (state.selectedTable && !currentTableAvailable) {
        state.selectedTimeFrom = "";
        state.selectedTimeTo = "";
      }

      if (state.selectedTimeFrom && state.selectedTimeTo) {
        const stillValid =
          canUseTimeAsStart(state.selectedTable, state.selectedTimeFrom) &&
          canUseTimeAsEnd(state.selectedTable, state.selectedTimeTo);

        if (!stillValid) {
          state.selectedTimeFrom = "";
          state.selectedTimeTo = "";
        }
      }
    } catch (error) {
      console.error("Hiba a foglalási elérhetőségek lekérésekor:", error);
      state.availabilityDate = dateString;
      state.reservations = [];
      showMessage("Nem sikerült lekérni a foglalási adatokat. Próbáld újra később.", "error");
    } finally {
      state.loadingAvailability = false;
      syncHiddenInputs();
      updateSelectionTexts();
      renderTables();
      renderSlots();
    }
  }

  function syncHiddenInputs() {
    if (hiddenDateInput) hiddenDateInput.value = state.selectedDate || "";
    if (hiddenTimeFromInput) hiddenTimeFromInput.value = state.selectedTimeFrom || "";
    if (hiddenTimeToInput) hiddenTimeToInput.value = state.selectedTimeTo || "";
    if (hiddenTableInput) hiddenTableInput.value = state.selectedTable || "";
  }

  function updateSelectionTexts() {
    if (selectedDateHint) {
      selectedDateHint.textContent = state.selectedDate
        ? `Kiválasztott dátum: ${formatDateLong(state.selectedDate)}.`
        : "Válassz egy napot a foglaláshoz.";
    }

    if (selectedTableHint) {
      if (!state.selectedDate) {
        selectedTableHint.textContent = "Először válassz dátumot, utána asztalt.";
      } else if (!state.selectedTable) {
        selectedTableHint.textContent = "Válassz egy benti vagy kinti asztalt a továbblépéshez.";
      } else {
        selectedTableHint.textContent = `Kiválasztott asztal: ${formatTableLabel(state.selectedTable)}.`;
      }
    }

    if (selectedDateDisplay) {
      selectedDateDisplay.textContent = state.selectedDate ? formatDateLong(state.selectedDate) : "-";
    }

    if (selectedTableDisplay) {
      selectedTableDisplay.textContent = state.selectedTable ? formatTableLabel(state.selectedTable) : "-";
    }
  }

  function renderCalendar() {
    if (!calendarGrid || !monthLabel) return;

    monthLabel.textContent = formatMonthLabel(state.currentMonth);
    calendarGrid.innerHTML = "";

    const year = state.currentMonth.getFullYear();
    const month = state.currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstWeekday = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();

    for (let i = 0; i < firstWeekday; i += 1) {
      const emptyCell = document.createElement("div");
      emptyCell.className = "reservation-day is-empty";
      calendarGrid.appendChild(emptyCell);
    }

    const todayIso = toISODate(new Date());

    for (let day = 1; day <= totalDays; day += 1) {
      const date = new Date(year, month, day);
      const isoDate = toISODate(date);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "reservation-day";
      button.textContent = String(day);
      button.dataset.date = isoDate;

      if (isoDate === todayIso) {
        button.classList.add("is-today");
      }

      if (isoDate === state.selectedDate) {
        button.classList.add("is-selected");
      }

      if (isPastDate(isoDate)) {
        button.disabled = true;
        button.classList.add("is-disabled");
      }

      button.addEventListener("click", async () => {
        if (isoDate === state.selectedDate) return;
        state.selectedDate = isoDate;
        state.selectedTimeFrom = "";
        state.selectedTimeTo = "";
        clearMessage();
        syncHiddenInputs();
        renderCalendar();
        updateSelectionTexts();
        await loadAvailability(isoDate);
      });

      calendarGrid.appendChild(button);
    }
  }

  function renderTables() {
    if (!tableListEl) return;
    tableListEl.innerHTML = "";

    TABLES.forEach((table) => {
      const hasAvailableRange = state.selectedDate
        ? hasAvailableTimeRangeForTable(table.number)
        : false;
      const isDisabled = state.selectedDate ? !hasAvailableRange : true;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "reservation-table-card";
      button.dataset.tableNumber = String(table.number);

      if (Number(state.selectedTable) === table.number) {
        button.classList.add("is-selected");
      }

      if (isDisabled) {
        button.disabled = true;
        button.classList.add("is-disabled");
      }

      const zoneIcon = table.zone === "indoor" ? "bi-door-open" : "bi-tree";
      const statusText = !state.selectedDate
        ? "Dátum választása után látható az elérhetőség."
        : isDisabled
          ? "Erre a napra jelenleg nincs szabad idősáv."
          : "Van választható mettől-meddig idősáv";

      button.innerHTML = `
        <div class="reservation-table-title">
          <span>${table.name}</span>
          <span class="reservation-table-tag"><i class="bi ${zoneIcon}"></i>${table.zoneLabel}</span>
        </div>
        <div class="reservation-table-subtitle">${table.zone === "indoor" ? "Belső tér" : "Terasz / külső rész"}</div>
        <div class="reservation-table-status">${statusText}</div>
      `;

      button.addEventListener("click", () => {
        if (!state.selectedDate || isDisabled) return;
        state.selectedTable = table.number;
        state.selectedTimeFrom = "";
        state.selectedTimeTo = "";
        syncHiddenInputs();
        updateSelectionTexts();
        renderTables();
        renderSlots();
      });

      tableListEl.appendChild(button);
    });
  }

  function getSlotSelectionHint() {
    if (!state.selectedTimeFrom) {
      return "Első kattintás: válaszd ki, mettől szeretnél foglalni.";
    }

    if (!state.selectedTimeTo) {
      return `Kezdés: ${state.selectedTimeFrom}. Második kattintás: válaszd ki, meddig tartson a foglalás.`;
    }

    return `Kiválasztott idősáv: ${state.selectedTimeFrom} – ${state.selectedTimeTo}. Új idősáv választásához kattints egy új kezdési időpontra.`;
  }

  function renderSlots() {
    if (!slotGridEl) return;

    slotGridEl.innerHTML = "";

    if (state.loadingAvailability) {
      slotGridEl.innerHTML = '<div class="reservation-help-text">Időpontok betöltése...</div>';
      return;
    }

    if (!state.selectedDate || !state.selectedTable) {
      slotGridEl.innerHTML = '<div class="reservation-help-text">Először válaszd ki az 1. lépésben a dátumot és az asztalt.</div>';
      return;
    }

    const reservations = getReservationsForSelectedTable();
    const times = getTimeOptionsForDate(state.selectedDate);

    if (times.length === 0) {
      slotGridEl.innerHTML = '<div class="reservation-help-text">Ehhez a naphoz jelenleg nincs választható időpont.</div>';
      return;
    }

    const hint = document.createElement("div");
    hint.className = "reservation-slot-selection-hint";
    hint.textContent = getSlotSelectionHint();
    slotGridEl.appendChild(hint);

    const buttonWrap = document.createElement("div");
    buttonWrap.className = "reservation-slot-buttons";
    slotGridEl.appendChild(buttonWrap);

    times.forEach((timeValue) => {
      const timeMinutes = minutesFromHHMM(timeValue);
      const startMinutes = minutesFromHHMM(state.selectedTimeFrom);
      const endMinutes = minutesFromHHMM(state.selectedTimeTo);
      const selectingEnd = Boolean(state.selectedTimeFrom && !state.selectedTimeTo);

      const isStartSelected = state.selectedTimeFrom === timeValue;
      const isEndSelected = state.selectedTimeTo === timeValue;
      const isInSelectedRange =
        state.selectedTimeFrom &&
        state.selectedTimeTo &&
        !Number.isNaN(timeMinutes) &&
        !Number.isNaN(startMinutes) &&
        !Number.isNaN(endMinutes) &&
        timeMinutes > startMinutes &&
        timeMinutes < endMinutes;

      const isBookedPoint = isTimeInsideBookedInterval(reservations, timeValue);
      const isDisabled = selectingEnd
        ? !canUseTimeAsEnd(state.selectedTable, timeValue)
        : !canUseTimeAsStart(state.selectedTable, timeValue);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "reservation-slot-btn";
      button.textContent = timeValue;
      button.dataset.time = timeValue;

      if (isStartSelected) {
        button.classList.add("is-range-start", "is-selected");
      }

      if (isEndSelected) {
        button.classList.add("is-range-end", "is-selected");
      }

      if (isInSelectedRange) {
        button.classList.add("is-in-range");
      }

      if (isBookedPoint || isDisabled) {
        button.disabled = true;
        button.classList.add("is-booked");
      }

      if (isStartSelected && selectingEnd) {
        button.disabled = false;
        button.classList.remove("is-booked");
      }

      button.addEventListener("click", () => {
        if (button.disabled && !isStartSelected) return;

        clearMessage();

        if (!state.selectedTimeFrom || state.selectedTimeTo) {
          state.selectedTimeFrom = timeValue;
          state.selectedTimeTo = "";
          syncHiddenInputs();
          renderSlots();
          return;
        }

        if (isStartSelected) {
          state.selectedTimeFrom = "";
          state.selectedTimeTo = "";
          syncHiddenInputs();
          renderSlots();
          return;
        }

        if (minutesFromHHMM(timeValue) <= minutesFromHHMM(state.selectedTimeFrom)) {
          state.selectedTimeFrom = timeValue;
          state.selectedTimeTo = "";
          syncHiddenInputs();
          renderSlots();
          return;
        }

        if (!canUseTimeAsEnd(state.selectedTable, timeValue)) {
          showMessage("Ez az idősáv nem választható. Kérlek válassz másik befejezési időpontot.", "error");
          return;
        }

        state.selectedTimeTo = timeValue;
        syncHiddenInputs();
        renderSlots();
      });

      buttonWrap.appendChild(button);
    });
  }

  function updateSteps() {
    stepEls.forEach((stepEl) => {
      const stepNumber = Number(stepEl.dataset.step);
      stepEl.classList.toggle("is-active", stepNumber === state.step);
      stepEl.classList.toggle("is-complete", stepNumber < state.step);
    });

    panelEls.forEach((panelEl) => {
      const panelStep = Number(panelEl.dataset.stepPanel);
      const active = panelStep === state.step;
      panelEl.hidden = !active;
      panelEl.classList.toggle("is-active", active);
    });
  }

  function setStep(nextStep) {
    state.step = nextStep;
    updateSteps();
    if (nextStep === 2) {
      updateSelectionTexts();
      renderSlots();
    }
    if (nextStep === 4) {
      updateSummary();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateStep1() {
    if (!state.selectedDate) {
      showMessage("Válassz dátumot a foglaláshoz.", "error");
      return false;
    }

    if (!state.selectedTable) {
      showMessage("Válassz egy benti vagy kinti asztalt.", "error");
      return false;
    }

    return true;
  }

  function validateStep2() {
    if (!state.selectedTimeFrom || !state.selectedTimeTo) {
      showMessage("Válaszd ki a foglalás kezdési és befejezési időpontját.", "error");
      return false;
    }

    const startMinutes = minutesFromHHMM(state.selectedTimeFrom);
    const endMinutes = minutesFromHHMM(state.selectedTimeTo);

    if (
      Number.isNaN(startMinutes) ||
      Number.isNaN(endMinutes) ||
      endMinutes <= startMinutes
    ) {
      showMessage("A foglalás vége legyen később, mint a kezdete.", "error");
      return false;
    }

    if (endMinutes - startMinutes < MIN_RESERVATION_DURATION_MINUTES) {
      showMessage("A foglalás időtartama legalább 1 óra kell legyen.", "error");
      return false;
    }

    if (!canUseTimeAsEnd(state.selectedTable, state.selectedTimeTo)) {
      showMessage("A kiválasztott idősáv már ütközik egy meglévő foglalással.", "error");
      return false;
    }

    return true;
  }

  function validateStep3() {
    const formData = new FormData(form);
    const name = formData.get("name")?.toString().trim();
    const phone = formData.get("phone")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const peopleCount = formData.get("peopleCount")?.toString();

    if (!name || !phone || !email || !peopleCount) {
      showMessage("Kérlek tölts ki minden kötelező adatot.", "error");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage("Érvénytelen email cím formátum.", "error");
      return false;
    }

    const people = Number(peopleCount);
    if (!Number.isInteger(people) || people < 1 || people > 12) {
      showMessage("Érvénytelen létszám. 1 és 12 fő között foglalhatsz.", "error");
      return false;
    }

    return true;
  }

  function updateSummary() {
    const formData = new FormData(form);
    const note = formData.get("note")?.toString().trim();

    if (summaryDate) summaryDate.textContent = formatDateLong(state.selectedDate);
    if (summaryTable) summaryTable.textContent = formatTableLabel(state.selectedTable);
    if (summaryTime) summaryTime.textContent = `${state.selectedTimeFrom} – ${state.selectedTimeTo}`;
    if (summaryPeople) summaryPeople.textContent = `${formData.get("peopleCount")} fő`;
    if (summaryGuest) {
      summaryGuest.textContent = `${formData.get("name")} • ${formData.get("phone")} • ${formData.get("email")}`;
    }
    if (summaryNote) {
      summaryNote.textContent = note || "Nincs megadva.";
    }
  }

  async function resetReservationWizard() {
    form.reset();
    state.step = 1;
    state.selectedTable = null;
    state.selectedTimeFrom = "";
    state.selectedTimeTo = "";
    state.selectedDate = toISODate(new Date());
    state.currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    syncHiddenInputs();
    updateSelectionTexts();
    updateSteps();
    renderCalendar();
    await loadAvailability(state.selectedDate);
  }

  prevMonthBtn?.addEventListener("click", () => {
    state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1, 1);
    renderCalendar();
  });

  nextMonthBtn?.addEventListener("click", () => {
    state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  step1NextBtn?.addEventListener("click", () => {
    clearMessage();
    if (!validateStep1()) return;
    setStep(2);
  });

  step2PrevBtn?.addEventListener("click", () => {
    clearMessage();
    setStep(1);
  });

  step2NextBtn?.addEventListener("click", () => {
    clearMessage();
    if (!validateStep2()) return;
    setStep(3);
  });

  step3PrevBtn?.addEventListener("click", () => {
    clearMessage();
    setStep(2);
  });

  step3NextBtn?.addEventListener("click", () => {
    clearMessage();
    if (!validateStep3()) return;
    updateSummary();
    setStep(4);
  });

  step4PrevBtn?.addEventListener("click", () => {
    clearMessage();
    setStep(3);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      return;
    }

    const formData = new FormData(form);
    const payload = {
      name: formData.get("name")?.toString().trim(),
      phone: formData.get("phone")?.toString().trim(),
      email: formData.get("email")?.toString().trim(),
      date: state.selectedDate,
      timeFrom: state.selectedTimeFrom,
      timeTo: state.selectedTimeTo,
      tableNumber: Number(state.selectedTable),
      peopleCount: Number(formData.get("peopleCount")),
      note: formData.get("note")?.toString().trim() || null,
    };

    submitBtn.disabled = true;

    try {
      const res = await apiFetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 401) {
        alert("Asztalfoglaláshoz előbb be kell jelentkezned.");
        window.location.href = "/fiok.html";
        return;
      }

      if (!res.ok || !data.success) {
        showMessage(data.message || "Nem sikerült rögzíteni a foglalást.", "error");
        return;
      }

      showMessage(data.message || "Foglalásod rögzítettük, hamarosan visszaigazoljuk. Köszönjük!", "success");
      await resetReservationWizard();
    } catch (error) {
      console.error("Hiba a foglalás elküldésekor:", error);
      showMessage("Nem sikerült csatlakozni a szerverhez.", "error");
    } finally {
      submitBtn.disabled = false;
    }
  });

  (async () => {
    syncHiddenInputs();
    updateSelectionTexts();
    updateSteps();
    renderCalendar();
    renderTables();
    renderSlots();
    await loadAvailability(state.selectedDate);
  })();
});
