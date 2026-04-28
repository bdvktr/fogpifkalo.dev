function extractTimeHHMM(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value.slice(0, 5);
  }

  if (value instanceof Date) {
    return value.toTimeString().slice(0, 5);
  }

  return "";
}

function getMinutesFromHHMM(value) {
  const [hourStr, minStr] = value.split(":");
  const hour = Number(hourStr);
  const minute = Number(minStr);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return NaN;
  }

  return hour * 60 + minute;
}

function getFallbackEndHHMM(startHHMM) {
  const startMinutes = getMinutesFromHHMM(startHHMM);

  if (Number.isNaN(startMinutes)) {
    return "";
  }

  const endMinutes = startMinutes + 120;
  const endHour = Math.floor(endMinutes / 60);
  const endMinute = endMinutes % 60;

  return `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(
    2,
    "0"
  )}`;
}

export function normalizeRequiredText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeOptionalText(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function hasReservationOverlap(rows, newStartMinutes, newEndMinutes) {
  return rows.some((row) => {
    const existingStartHHMM = extractTimeHHMM(row.reservation_time);
    const existingEndHHMM = row.end_time
      ? extractTimeHHMM(row.end_time)
      : getFallbackEndHHMM(existingStartHHMM);

    if (!existingStartHHMM || !existingEndHHMM) {
      return false;
    }

    const existingStartMinutes = getMinutesFromHHMM(existingStartHHMM);
    const existingEndMinutes = getMinutesFromHHMM(existingEndHHMM);

    if (
      Number.isNaN(existingStartMinutes) ||
      Number.isNaN(existingEndMinutes)
    ) {
      return false;
    }

    const noOverlap =
      existingEndMinutes <= newStartMinutes ||
      existingStartMinutes >= newEndMinutes;

    return !noOverlap;
  });
}

export function validateReservationInput({
  tableNumber,
  date,
  timeFrom,
  timeTo,
  peopleCount,
  requirePeopleCount = true,
  now = new Date(),
}) {
  if (!tableNumber || !date || !timeFrom || !timeTo) {
    return {
      success: false,
      message:
        "Dátum, kezdési és záró idő, valamint asztalszám megadása kötelező.",
    };
  }

  const tableNum = Number(tableNumber);
  if (!Number.isInteger(tableNum) || tableNum < 1 || tableNum > 6) {
    return {
      success: false,
      message: "Érvénytelen asztalszám. 1 és 6 között választható.",
    };
  }

  let ppl = null;

  if (requirePeopleCount) {
    ppl = Number(peopleCount);

    if (!Number.isInteger(ppl) || ppl < 1 || ppl > 12) {
      return {
        success: false,
        message: "Érvénytelen létszám. 1 és 12 fő között foglalhatsz.",
      };
    }
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const timeRegex = /^\d{2}:\d{2}$/;

  if (!dateRegex.test(date)) {
    return {
      success: false,
      message:
        "Érvénytelen dátum formátum. Használd: ÉÉÉÉ-HH-NN (pl. 2025-11-21).",
    };
  }

  if (!timeRegex.test(timeFrom) || !timeRegex.test(timeTo)) {
    return {
      success: false,
      message: "Érvénytelen időpont formátum. Használd: ÓÓ:PP (pl. 18:30).",
    };
  }

  const [yearStr, monthStr, dayStr] = date.split("-");
  const [fromHourStr, fromMinStr] = timeFrom.split(":");
  const [toHourStr, toMinStr] = timeTo.split(":");

  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  const fromHour = Number(fromHourStr);
  const fromMinute = Number(fromMinStr);
  const toHour = Number(toHourStr);
  const toMinute = Number(toMinStr);

  const startDt = new Date(year, month - 1, day, fromHour, fromMinute, 0, 0);
  const endDt = new Date(year, month - 1, day, toHour, toMinute, 0, 0);

  const isValidStart =
    startDt.getFullYear() === year &&
    startDt.getMonth() === month - 1 &&
    startDt.getDate() === day &&
    startDt.getHours() === fromHour &&
    startDt.getMinutes() === fromMinute;

  const isValidEnd =
    endDt.getFullYear() === year &&
    endDt.getMonth() === month - 1 &&
    endDt.getDate() === day &&
    endDt.getHours() === toHour &&
    endDt.getMinutes() === toMinute;

  if (
    !isValidStart ||
    !isValidEnd ||
    Number.isNaN(startDt.getTime()) ||
    Number.isNaN(endDt.getTime())
  ) {
    return {
      success: false,
      message:
        "Érvénytelen dátum vagy időpont. Kérlek ellenőrizd a megadott értékeket.",
    };
  }

  if (endDt.getTime() <= startDt.getTime()) {
    return {
      success: false,
      message: "A foglalás vége legyen később, mint a kezdete.",
    };
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const reservationDay = new Date(year, month - 1, day);

  if (reservationDay < today) {
    return {
      success: false,
      message:
        "Már elmúlt napra nem tudsz foglalni. Kérlek válassz egy későbbi dátumot.",
    };
  }

  const isToday =
    reservationDay.getFullYear() === today.getFullYear() &&
    reservationDay.getMonth() === today.getMonth() &&
    reservationDay.getDate() === today.getDate();

  if (isToday && startDt.getTime() <= now.getTime()) {
    return {
      success: false,
      message:
        "Erre az időpontra már nem tudsz foglalni. Válassz későbbi időpontot a mai napra.",
    };
  }

  const newStartMinutes = fromHour * 60 + fromMinute;
  const newEndMinutes = toHour * 60 + toMinute;

  if (newEndMinutes - newStartMinutes < 60) {
    return {
      success: false,
      message: "A foglalás időtartama legalább 1 óra kell legyen.",
    };
  }

  const dayOfWeek = reservationDay.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const minStartMinutes = isWeekend ? 12 * 60 : 11 * 60;
  const maxEndMinutes = isWeekend ? 23 * 60 : 22 * 60;

  if (newStartMinutes < minStartMinutes || newEndMinutes > maxEndMinutes) {
    return {
      success: false,
      message: isWeekend
        ? "Hétvégén 12:00 és 23:00 között tudsz foglalni."
        : "Hétköznap 11:00 és 22:00 között tudsz foglalni.",
    };
  }

  return {
    success: true,
    tableNum,
    ppl,
    mysqlStart: `${timeFrom}:00`,
    mysqlEnd: `${timeTo}:00`,
    newStartMinutes,
    newEndMinutes,
  };
}

export function validatePeopleCount(value) {
  const ppl = Number(value);

  if (!Number.isInteger(ppl) || ppl < 1 || ppl > 12) {
    return {
      success: false,
      message: "Érvénytelen létszám. 1 és 12 fő között foglalhatsz.",
    };
  }

  return {
    success: true,
    ppl,
  };
}