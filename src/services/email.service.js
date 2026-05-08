import nodemailer from "nodemailer";
import "../config/env.js";
import {
  escapeEmailHtml,
  renderEmailTemplate,
} from "../utils/email-template.renderer.js";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, APP_URL } =
  process.env;

const BRAND_NAME = "FogPifkáló";
const DEFAULT_CTA_URL = APP_URL || "#";

// 1) Transporter létrehozása
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT) || 587,
  secure: false, // ha 465-ös port, akkor true
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

function formatMailFt(value) {
  return `${Math.round(Number(value || 0)).toLocaleString("hu-HU")} Ft`;
}

function formatPaymentMethod(value) {
  if (value === "card") {
    return "Bankkártya a futárnál";
  }

  if (value === "cash") {
    return "Készpénz a futárnál";
  }

  return value || "Nincs megadva";
}

function normalizeReservation(reservation) {
  return {
    email: reservation.email,
    name: reservation.name || "Vendég",
    date: reservation.date || "Nincs megadva",
    timeFrom: reservation.timeFrom || "Nincs megadva",
    timeTo: reservation.timeTo || "",
    tableNumber: reservation.tableNumber || "Nincs megadva",
    peopleCount: reservation.peopleCount || "Nincs megadva",
  };
}

function normalizeOrder(order) {
  return {
    email: order.email,
    name: order.name || "Vendég",
    orderId: order.orderId || "—",
    subtotal: Number(order.subtotal || 0),
    packageCount: Number(order.packageCount || 0),
    packagingFee: Number(order.packagingFee || 0),
    deliveryCity: order.deliveryCity || "",
    deliveryFee: Number(order.deliveryFee || 0),
    totalPrice: Number(order.totalPrice || 0),
    shippingAddress: order.shippingAddress || "Nincs megadva",
    paymentMethod: order.paymentMethod || "Nincs megadva",
  };
}

function renderPriceText(order) {
  const subtotal = Number(order.subtotal || 0);
  const packageCount = Number(order.packageCount || 0);
  const packagingFee = Number(order.packagingFee || 0);
  const deliveryFee = Number(order.deliveryFee || 0);

  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    return `Végösszeg: ${formatMailFt(order.totalPrice)}`;
  }

  const lines = [`Termékek: ${formatMailFt(subtotal)}`];

  lines.push(
    `Csomagolás${packageCount > 0 ? ` (${packageCount} csomag)` : ""}: ${formatMailFt(packagingFee)}`,
  );

  lines.push(
    `Szállítás${order.deliveryCity ? ` (${order.deliveryCity})` : ""}: ${formatMailFt(deliveryFee)}`,
  );

  lines.push(`Végösszeg: ${formatMailFt(order.totalPrice)}`);

  return lines.join("\n");
}

function renderSummaryRow(label, value) {
  return `
    <tr>
      <td style="padding:13px 16px; border-bottom:1px solid #eee8df; color:#4b4b4b; font-size:15px;">
        ${escapeEmailHtml(label)}
      </td>
      <td align="right" style="padding:13px 16px; border-bottom:1px solid #eee8df; color:#222222; font-size:15px; font-weight:600;">
        ${escapeEmailHtml(value)}
      </td>
    </tr>
  `;
}

function renderOrderSummaryRows(order) {
  return [
    renderSummaryRow("Termékek", formatMailFt(order.subtotal)),
    renderSummaryRow(
      `Csomagolás${order.packageCount > 0 ? ` (${order.packageCount} csomag)` : ""}`,
      formatMailFt(order.packagingFee),
    ),
    renderSummaryRow(
      `Szállítás${order.deliveryCity ? ` (${order.deliveryCity})` : ""}`,
      formatMailFt(order.deliveryFee),
    ),
  ].join("");
}

function renderReservationDetailRow(label, value) {
  return `
    <tr>
      <td style="padding:15px 18px; border-bottom:1px solid #eee8df; color:#666666; font-size:15px;">
        ${escapeEmailHtml(label)}
      </td>
      <td align="right" style="padding:15px 18px; border-bottom:1px solid #eee8df; color:#1a1a1a; font-size:15px; font-weight:700;">
        ${escapeEmailHtml(value)}
      </td>
    </tr>
  `;
}

function renderReservationDetailsRows(reservation) {
  const timeRange = reservation.timeTo
    ? `${reservation.timeFrom} - ${reservation.timeTo}`
    : reservation.timeFrom;

  return [
    renderReservationDetailRow("Dátum:", reservation.date),
    renderReservationDetailRow("Időpont:", timeRange),
    renderReservationDetailRow("Asztal:", `${reservation.tableNumber}`),
    renderReservationDetailRow("Létszám:", `${reservation.peopleCount} fő`),
  ].join("");
}

function renderNoteBlock({ tone = "info", title, text }) {
  if (!text) {
    return "";
  }

  const colors = {
    info: {
      bg: "#fbf8f2",
      border: "#e8d8ba",
      title: "#7a510f",
      text: "#5f5f5f",
    },
    success: {
      bg: "#f2f8f2",
      border: "#cfe4cf",
      title: "#2f7436",
      text: "#4f604f",
    },
    danger: {
      bg: "#fff5f5",
      border: "#f0caca",
      title: "#b73535",
      text: "#6b4d4d",
    },
  };

  const selected = colors[tone] || colors.info;

  return `
    <tr>
      <td style="padding:0 28px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${selected.bg}; border:1px solid ${selected.border}; border-radius:10px;">
          <tr>
            <td style="padding:16px 18px;">
              ${
                title
                  ? `<div style="color:${selected.title}; font-size:15px; font-weight:700; margin-bottom:5px;">${escapeEmailHtml(title)}</div>`
                  : ""
              }
              <div style="color:${selected.text}; font-size:14px; line-height:1.6;">${escapeEmailHtml(text)}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function getStatusColors(status) {
  const colors = {
    pending: {
      statusColor: "#b87a14",
      statusBgColor: "#fff8ea",
      statusBorderColor: "#e3bd75",
    },
    success: {
      statusColor: "#2f7436",
      statusBgColor: "#f2f8f2",
      statusBorderColor: "#9ec49e",
    },
    danger: {
      statusColor: "#c43d3d",
      statusBgColor: "#fff1f1",
      statusBorderColor: "#efa3a3",
    },
  };

  return colors[status] || colors.pending;
}

async function sendDesignedEmail({
  to,
  subject,
  text,
  templateName,
  templateData,
  logSuccess,
  logError,
}) {
  try {
    await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to,
      subject,
      text,
      html: renderEmailTemplate(templateName, templateData),
    });

    console.log(logSuccess);
  } catch (err) {
    console.error(logError, err);
  }
}

function getOrderTemplateData(order, variant) {
  const statusMap = {
    placed: {
      title: "Rendelésed megérkezett",
      intro: "Köszönjük a rendelésed! Már dolgozunk rajta.",
      statusLabel: "Rendelés fogadva",
      statusText: "Feldolgozás alatt",
      colorKey: "pending",
      ctaLabel: "Rendeléseim megtekintése",
      noteBlock: "",
      preheader: "Köszönjük a rendelésed, megkaptuk a rendszerünkben.",
    },
    completed: {
      title: "Rendelésed teljesült",
      intro: "Örömmel értesítünk, hogy a rendelésedet teljesítettük.",
      statusLabel: "Teljesítve",
      statusText: "Teljesítve",
      colorKey: "success",
      ctaLabel: "Rendeléseim megtekintése",
      noteBlock: renderNoteBlock({
        tone: "success",
        title: "Köszönjük, hogy minket választottál!",
        text: "Reméljük, elégedett voltál a rendeléseddel.",
      }),
      preheader: "A rendelésed teljesítve lett.",
    },
    cancelled: {
      title: "Rendelés törölve",
      intro: "Sajnáljuk, a rendelésedet töröltük.",
      statusLabel: "Rendelés törölve",
      statusText: "Törölve",
      colorKey: "danger",
      ctaLabel: "Kapcsolat felvétel",
      noteBlock: renderNoteBlock({
        tone: "danger",
        title: "Ha kérdésed van, keress minket telefonon.",
        text: "Szívesen segítünk, ha bármilyen kérdésed merül fel a rendeléseddel kapcsolatban.",
      }),
      preheader: "A rendelésed törlésre került.",
    },
  };

  const selected = statusMap[variant] || statusMap.placed;

  return {
    ...getStatusColors(selected.colorKey),
    emailTitle: selected.title,
    preheader: selected.preheader,
    title: selected.title,
    intro: selected.intro,
    statusLabel: selected.statusLabel,
    statusText: selected.statusText,
    orderId: order.orderId,
    summaryRows: renderOrderSummaryRows(order),
    totalPrice: formatMailFt(order.totalPrice),
    shippingAddress: order.shippingAddress,
    paymentMethodLabel: formatPaymentMethod(order.paymentMethod),
    noteBlock: selected.noteBlock,
    ctaLabel: selected.ctaLabel,
    ctaUrl: DEFAULT_CTA_URL,
  };
}

function getReservationTemplateData(reservation, variant) {
  const statusMap = {
    pending: {
      title: "Foglalásod beérkezett",
      intro:
        "Foglalásod megérkezett rendszerünkbe, jelenleg visszaigazolásra vár.",
      statusLabel: "Függőben",
      colorKey: "pending",
      ctaLabel: "Foglalásaim megtekintése",
      noteBlock: renderNoteBlock({
        tone: "info",
        title: "Hamarosan jelentkezünk",
        text: "E-mailben értesítünk, amint a foglalásodat visszaigazoltuk.",
      }),
      preheader: "Foglalásod beérkezett rendszerünkbe.",
    },
    confirmed: {
      title: "Foglalásod visszaigazolva",
      intro: "Várunk szeretettel az étteremben!",
      statusLabel: "Visszaigazolva",
      colorKey: "success",
      ctaLabel: "Foglalásaim megtekintése",
      noteBlock: renderNoteBlock({
        tone: "success",
        text: "Ha változás történt, kérjük jelezd nekünk időben.",
      }),
      preheader: "Foglalásodat visszaigazoltuk.",
    },
    cancelled: {
      title: "Foglalás törölve",
      intro: "Értesítünk, hogy a foglalás törlésre került.",
      statusLabel: "Törölve",
      colorKey: "danger",
      ctaLabel: "Kapcsolat felvétel",
      noteBlock: renderNoteBlock({
        tone: "danger",
        title: "Kérdésed van?",
        text: "Ha szerinted ez tévedés, kérlek vedd fel velünk a kapcsolatot.",
      }),
      preheader: "A foglalás törlésre került.",
    },
    updated: {
      title: "Foglalásod módosult",
      intro: "A foglalásod adatai sikeresen frissültek.",
      statusLabel: "Módosítva",
      colorKey: "pending",
      ctaLabel: "Foglalásaim megtekintése",
      noteBlock: renderNoteBlock({
        tone: "info",
        title: "Nem te módosítottad?",
        text: "Ha nem te kezdeményezted a módosítást, kérlek mielőbb jelezd felénk.",
      }),
      preheader: "Foglalásod adatai módosultak.",
    },
    userCancelled: {
      title: "Foglalásod lemondva",
      intro: "Megerősítjük, hogy a foglalásodat sikeresen lemondtad.",
      statusLabel: "Lemondva",
      colorKey: "danger",
      ctaLabel: "Új foglalás indítása",
      noteBlock: renderNoteBlock({
        tone: "info",
        text: "Sajnáljuk, hogy most nem jössz, de reméljük, hamarosan újra találkozunk.",
      }),
      preheader: "Foglalásod lemondásra került.",
    },
  };

  const selected = statusMap[variant] || statusMap.pending;

  return {
    ...getStatusColors(selected.colorKey),
    emailTitle: selected.title,
    preheader: selected.preheader,
    title: selected.title,
    intro: selected.intro,
    statusLabel: selected.statusLabel,
    detailsRows: renderReservationDetailsRows(reservation),
    noteBlock: selected.noteBlock,
    ctaLabel: selected.ctaLabel,
    ctaUrl: DEFAULT_CTA_URL,
  };
}

function getReservationText(reservation, intro) {
  const timeRange = reservation.timeTo
    ? `${reservation.timeFrom} - ${reservation.timeTo}`
    : reservation.timeFrom;

  return `
Kedves ${reservation.name || "Vendég"}!

${intro}

Dátum: ${reservation.date}
Időpont: ${timeRange}
Asztal: ${reservation.tableNumber}
Létszám: ${reservation.peopleCount} fő

Üdvözlettel:
${BRAND_NAME}
`;
}

function getOrderText(order, intro, outro = "") {
  return `
Kedves ${order.name || "Vendég"}!

${intro}

Rendelésszám: ${order.orderId}
${renderPriceText(order)}
Cím: ${order.shippingAddress || "Nincs megadva"}
Fizetés módja: ${formatPaymentMethod(order.paymentMethod)}

${outro}

Üdvözlettel:
${BRAND_NAME}
`;
}

export async function sendReservationConfirmedEmail(reservation) {
  const data = normalizeReservation(reservation);

  if (!data.email) {
    console.warn("Nincs email cím a foglaláshoz, nem küldök emailt.");
    return;
  }

  await sendDesignedEmail({
    to: data.email,
    subject: "Foglalásod visszaigazolva – FogPifkáló",
    text: getReservationText(
      data,
      "Örömmel értesítünk, hogy foglalásodat visszaigazoltuk.",
    ),
    templateName: "reservation-status.html",
    templateData: getReservationTemplateData(data, "confirmed"),
    logSuccess: `Visszaigazoló email elküldve: ${data.email}`,
    logError: "Hiba a visszaigazoló email küldésekor:",
  });
}

export async function sendReservationPendingEmail(reservation) {
  const data = normalizeReservation(reservation);

  if (!data.email) {
    console.warn("Nincs email cím a foglaláshoz (pending), nem küldök emailt.");
    return;
  }

  await sendDesignedEmail({
    to: data.email,
    subject: "Foglalásod beérkezett – FogPifkáló",
    text: getReservationText(
      data,
      "Foglalásod adatai megérkeztek rendszerünkbe, jelenleg a státusza: FÜGGŐBEN.",
    ),
    templateName: "reservation-status.html",
    templateData: getReservationTemplateData(data, "pending"),
    logSuccess: `Pending foglalás email elküldve: ${data.email}`,
    logError: "Hiba a pending email küldésekor:",
  });
}

export async function sendReservationCancelledEmail(reservation) {
  const data = normalizeReservation(reservation);

  if (!data.email) {
    console.warn(
      "Nincs email cím a foglaláshoz (cancelled), nem küldök emailt.",
    );
    return;
  }

  await sendDesignedEmail({
    to: data.email,
    subject: "Foglalásod törlésre került – FogPifkáló",
    text: getReservationText(
      data,
      "Értesítünk, hogy az alábbi foglalásodat töröltük.",
    ),
    templateName: "reservation-status.html",
    templateData: getReservationTemplateData(data, "cancelled"),
    logSuccess: `Törlés email elküldve: ${data.email}`,
    logError: "Hiba a törlés email küldésekor:",
  });
}

// RENDELÉS: leadáskor
export async function sendOrderPlacedEmail(order) {
  const data = normalizeOrder(order);

  if (!data.email) {
    console.warn("Nincs email cím a rendeléshez (placed), nem küldök emailt.");
    return;
  }

  await sendDesignedEmail({
    to: data.email,
    subject: "Rendelésed megérkezett – FogPifkáló",
    text: getOrderText(
      data,
      "Köszönjük a rendelésedet, megkaptuk a rendszerünkben.",
      "Futárunk várhatóan 45 percen belül kiszállítja a rendelést, a pontos idő a forgalomtól és terheltségtől függően változhat.",
    ),
    templateName: "order-status.html",
    templateData: getOrderTemplateData(data, "placed"),
    logSuccess: `Order placed email elküldve: ${data.email}`,
    logError: "Hiba az order placed email küldésekor:",
  });
}

// RENDELÉS: teljesítve
export async function sendOrderCompletedEmail(order) {
  const data = normalizeOrder(order);

  if (!data.email) {
    console.warn(
      "Nincs email cím a rendeléshez (completed), nem küldök emailt.",
    );
    return;
  }

  await sendDesignedEmail({
    to: data.email,
    subject: "Rendelésed teljesült – FogPifkáló",
    text: getOrderText(
      data,
      "Örömmel értesítünk, hogy az alábbi rendelésedet teljesítettük.",
      "Köszönjük, hogy minket választottál!",
    ),
    templateName: "order-status.html",
    templateData: getOrderTemplateData(data, "completed"),
    logSuccess: `Order completed email elküldve: ${data.email}`,
    logError: "Hiba az order completed email küldésekor:",
  });
}

// RENDELÉS: törölve
export async function sendOrderCancelledEmail(order) {
  const data = normalizeOrder(order);

  if (!data.email) {
    console.warn(
      "Nincs email cím a rendeléshez (cancelled), nem küldök emailt.",
    );
    return;
  }

  await sendDesignedEmail({
    to: data.email,
    subject: "Rendelésed törlésre került – FogPifkáló",
    text: getOrderText(
      data,
      "Értesítünk, hogy az alábbi rendelésed törlésre került.",
      "Ha szerinted ez tévedés, kérlek vedd fel velünk a kapcsolatot.",
    ),
    templateName: "order-status.html",
    templateData: getOrderTemplateData(data, "cancelled"),
    logSuccess: `Order cancelled email elküldve: ${data.email}`,
    logError: "Hiba az order cancelled email küldésekor:",
  });
}

export async function sendReservationUserUpdatedEmail(reservation) {
  const data = normalizeReservation(reservation);

  if (!data.email) {
    console.warn(
      "Nincs email cím a foglalás frissítéséhez, nem küldök emailt.",
    );
    return;
  }

  await sendDesignedEmail({
    to: data.email,
    subject: "Foglalásod módosult – FogPifkáló",
    text: getReservationText(
      data,
      "Értesítünk, hogy a foglalásodat sikeresen módosítottad.",
    ),
    templateName: "reservation-status.html",
    templateData: getReservationTemplateData(data, "updated"),
    logSuccess: `Foglalás módosítva email elküldve: ${data.email}`,
    logError: "Hiba a foglalás módosítva email küldésekor:",
  });
}

export async function sendReservationUserCancelledEmail(reservation) {
  const data = normalizeReservation(reservation);

  if (!data.email) {
    console.warn("Nincs email cím a user lemondáshoz, nem küldök emailt.");
    return;
  }

  await sendDesignedEmail({
    to: data.email,
    subject: "Foglalásod lemondásra került – FogPifkáló",
    text: getReservationText(
      data,
      "Megerősítjük, hogy az alábbi foglalásodat sikeresen lemondtad.",
    ),
    templateName: "reservation-status.html",
    templateData: getReservationTemplateData(data, "userCancelled"),
    logSuccess: `User lemondás email elküldve: ${data.email}`,
    logError: "Hiba a user lemondás email küldésekor:",
  });
}
