import "server-only";
import nodemailer from "nodemailer";

const configured = Boolean(process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER && process.env.EMAIL_FROM);

const transporter = configured
  ? nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
      auth: { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD },
    })
  : null;

export const mailConfigured = configured;

/** Sender name shown in the inbox; fixed so it doesn't change with the site title. */
export const FROM_NAME = process.env.EMAIL_FROM_NAME || "バース人材-飲み会予約システム";

export type Mail = { to: string; subject: string; html: string; text: string };

/** Sends each mail individually (no shared recipient lists). Failures are logged, never thrown. */
export async function sendMails(mails: Mail[]) {
  if (!transporter) return 0;
  let sent = 0;
  for (const m of mails) {
    try {
      await transporter.sendMail({ from: { name: FROM_NAME, address: process.env.EMAIL_FROM! }, ...m });
      sent++;
    } catch (e) {
      console.error("mail failed", m.to, e);
    }
  }
  return sent;
}
