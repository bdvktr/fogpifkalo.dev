import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "..", "..", ".env"),
});

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

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

// 2) Foglalás visszaigazoló email küldése
export async function sendReservationConfirmedEmail(reservation) {
  const { email, name, date, timeFrom, timeTo, tableNumber, peopleCount } =
    reservation;

  if (!email) {
    console.warn("Nincs email cím a foglaláshoz, nem küldök emailt.");
    return;
  }

  const subject = "Foglalásod visszaigazolva – BurgerBázis";

  const text = `
Kedves ${name || "Vendég"}!

Örömmel értesítünk, hogy foglalásodat visszaigazoltuk.

Időpont: ${date} ${timeFrom} - ${timeTo}
Asztal: ${tableNumber}
Létszám: ${peopleCount} fő

Várunk szeretettel!
BurgerBázis
`;

  const html = `
  <p>Kedves ${name || "Vendég"}!</p>
  <p>Örömmel értesítünk, hogy foglalásodat <strong>visszaigazoltuk</strong>.</p>
  <ul>
    <li><strong>Időpont:</strong> ${date} ${timeFrom} - ${timeTo}</li>
    <li><strong>Asztal:</strong> ${tableNumber}</li>
    <li><strong>Létszám:</strong> ${peopleCount} fő</li>
  </ul>
  <p>Várunk szeretettel!<br/>BurgerBázis</p>
`;

  try {
    await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to: email,
      subject,
      text,
      html,
    });

    console.log(`Visszaigazoló email elküldve: ${email}`);
  } catch (err) {
    console.error("Hiba a visszaigazoló email küldésekor:", err);
    // Itt dönthetsz: log csak, vagy később retry, stb.
  }
}

export async function sendReservationPendingEmail(reservation) {
  const { email, name, date, timeFrom, timeTo, tableNumber, peopleCount } =
    reservation;

  if (!email) {
    console.warn("Nincs email cím a foglaláshoz (pending), nem küldök emailt.");
    return;
  }

  const subject = "Foglalásod beérkezett – BurgerBázis";

  const text = `
Kedves ${name || "Vendég"}!

Foglalásod adatai megérkeztek rendszerünkbe, jelenleg a státusza: FÜGGŐBEN.

Időpont: ${date} ${timeFrom} - ${timeTo}
Asztal: ${tableNumber}
Létszám: ${peopleCount} fő

Hamarosan e-mailben értesítünk, ha foglalásodat visszaigazoltuk.

Üdvözlettel:
BurgerBázis
`;

  try {
    await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to: email,
      subject,
      text,
    });

    console.log(`Pending foglalás email elküldve: ${email}`);
  } catch (err) {
    console.error("Hiba a pending email küldésekor:", err);
  }
}

export async function sendReservationCancelledEmail(reservation) {
  const { email, name, date, timeFrom, timeTo, tableNumber, peopleCount } =
    reservation;

  if (!email) {
    console.warn(
      "Nincs email cím a foglaláshoz (cancelled), nem küldök emailt."
    );
    return;
  }

  const subject = "Foglalásod törlésre került – Fogpifkáló";

  const text = `
Kedves ${name || "Vendég"}!

Értesítünk, hogy az alábbi foglalásodat töröltük:

Időpont: ${date} ${timeFrom} - ${timeTo}
Asztal: ${tableNumber}
Létszám: ${peopleCount} fő

Ha szerinted ez tévedés, kérlek vedd fel velünk a kapcsolatot.

Üdvözlettel:
Fogpifkáló
`;

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to: email,
      subject,
      text,
    });

    console.log(`Törlés email elküldve: ${email}`);
    // console.log("Cancel mail info:", info); // ha debugolsz
  } catch (err) {
    console.error("Hiba a törlés email küldésekor:", err);
  }
}

// RENDELÉS: leadáskor
export async function sendOrderPlacedEmail(order) {
  const { email, name, orderId, totalPrice, shippingAddress, paymentMethod } =
    order;

  if (!email) {
    console.warn("Nincs email cím a rendeléshez (placed), nem küldök emailt.");
    return;
  }

  const subject = "Rendelésed megérkezett – Fogpifkáló";

  const text = `
Kedves ${name || "Vendég"}!

Köszönjük a rendelésedet, megkaptuk a rendszerünkben.

Rendelésszám: ${orderId}
Végösszeg: ${Number(totalPrice).toFixed(2)} Ft
Cím: ${shippingAddress || "nincs megadva"}
Fizetés módja: ${paymentMethod || "nincs megadva"}

Futárunk várhatóan 45 percen belül kiszállítja a rendelést
(a pontos idő a forgalomtól és terheltségtől függően változhat).

Üdvözlettel:
Fogpifkáló
`;

  try {
    await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to: email,
      subject,
      text,
    });

    console.log(`Order placed email elküldve: ${email}`);
  } catch (err) {
    console.error("Hiba az order placed email küldésekor:", err);
  }
}

// RENDELÉS: teljesítve
export async function sendOrderCompletedEmail(order) {
  const { email, name, orderId, totalPrice, shippingAddress, paymentMethod } =
    order;

  if (!email) {
    console.warn(
      "Nincs email cím a rendeléshez (completed), nem küldök emailt."
    );
    return;
  }

  const subject = "Rendelésed teljesült – Fogpifkáló";

  const text = `
Kedves ${name || "Vendég"}!

Örömmel értesítünk, hogy az alábbi rendelésedet teljesítettük.

Rendelésszám: ${orderId}
Végösszeg: ${Number(totalPrice).toFixed(2)} Ft
Cím: ${shippingAddress || "nincs megadva"}
Fizetés módja: ${paymentMethod || "nincs megadva"}

Köszönjük, hogy minket választottál!

Üdvözlettel:
Fogpifkáló
`;

  try {
    await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to: email,
      subject,
      text,
    });

    console.log(`Order completed email elküldve: ${email}`);
  } catch (err) {
    console.error("Hiba az order completed email küldésekor:", err);
  }
}

// RENDELÉS: törölve
export async function sendOrderCancelledEmail(order) {
  const { email, name, orderId, totalPrice, shippingAddress, paymentMethod } =
    order;

  if (!email) {
    console.warn(
      "Nincs email cím a rendeléshez (cancelled), nem küldök emailt."
    );
    return;
  }

  const subject = "Rendelésed törlésre került – Fogpifkáló";

  const text = `
Kedves ${name || "Vendég"}!

Értesítünk, hogy az alábbi rendelésed törlésre került:

Rendelésszám: ${orderId}
Végösszeg: ${Number(totalPrice).toFixed(2)} Ft
Cím: ${shippingAddress || "nincs megadva"}
Fizetés módja: ${paymentMethod || "nincs megadva"}

Ha szerinted ez tévedés, kérlek vedd fel velünk a kapcsolatot.

Üdvözlettel:
Fogpifkáló
`;

  try {
    await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to: email,
      subject,
      text,
    });

    console.log(`Order cancelled email elküldve: ${email}`);
  } catch (err) {
    console.error("Hiba az order cancelled email küldésekor:", err);
  }
}

export async function sendReservationUserUpdatedEmail(reservation) {
  const { email, name, date, timeFrom, timeTo, tableNumber, peopleCount } =
    reservation;

  if (!email) {
    console.warn(
      "Nincs email cím a foglalás frissítéséhez, nem küldök emailt."
    );
    return;
  }

  const subject = "Foglalásod módosult – Fogpifkáló";

  const text = `
Kedves ${name || "Vendég"}!

Értesítünk, hogy a foglalásodat sikeresen módosítottad.

Aktuális adatok:
- Dátum: ${date}
- Időpont: ${timeFrom} - ${timeTo}
- Asztal: ${tableNumber}
- Létszám: ${peopleCount} fő

Ha nem te kezdeményezted a módosítást, kérlek mielőbb jelezd felénk.

Üdvözlettel:
Fogpifkáló
`;

  try {
    await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to: email,
      subject,
      text,
    });

    console.log(`Foglalás módosítva email elküldve: ${email}`);
  } catch (err) {
    console.error("Hiba a foglalás módosítva email küldésekor:", err);
  }
}

export async function sendReservationUserCancelledEmail(reservation) {
  const { email, name, date, timeFrom, timeTo, tableNumber, peopleCount } =
    reservation;

  if (!email) {
    console.warn("Nincs email cím a user lemondáshoz, nem küldök emailt.");
    return;
  }

  const subject = "Foglalásod lemondásra került – Fogpifkáló";

  const text = `
Kedves ${name || "Vendég"}!

Megerősítjük, hogy az alábbi foglalásodat sikeresen lemondtad:

- Dátum: ${date}
- Időpont: ${timeFrom} - ${timeTo}
- Asztal: ${tableNumber}
- Létszám: ${peopleCount} fő

Sajnáljuk, hogy most nem jössz, de reméljük, hamarosan újra találkozunk! 🙂

Üdvözlettel:
Fogpifkáló
`;

  try {
    await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to: email,
      subject,
      text,
    });

    console.log(`User lemondás email elküldve: ${email}`);
  } catch (err) {
    console.error("Hiba a user lemondás email küldésekor:", err);
  }
}
