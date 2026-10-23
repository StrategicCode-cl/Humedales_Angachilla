import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_SECURE } = process.env;

// Sin SMTP_HOST los correos no salen: se escriben en el log para poder probar el flujo en desarrollo
const transport = SMTP_HOST
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: SMTP_SECURE === "true",
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    })
  : null;

if (!transport) {
  console.warn("SMTP no configurado: los correos se mostrarán en este log en lugar de enviarse");
}

export async function sendMail({ to, subject, text, html }) {
  if (!transport) {
    console.log(`\n[correo no enviado] Para: ${to}\nAsunto: ${subject}\n${text}\n`);
    return;
  }
  await transport.sendMail({ from: SMTP_FROM || SMTP_USER, to, subject, text, html });
}
