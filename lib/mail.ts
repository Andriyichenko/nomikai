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

export type Mail = { to: string; subject: string; html: string; text: string };

/** Sends each mail individually (no shared recipient lists). Failures are logged, never thrown. */
export async function sendMails(mails: Mail[], fromName: string) {
  if (!transporter) return 0;
  let sent = 0;
  for (const m of mails) {
    try {
      await transporter.sendMail({ from: { name: fromName, address: process.env.EMAIL_FROM! }, ...m });
      sent++;
    } catch (e) {
      console.error("mail failed", m.to, e);
    }
  }
  return sent;
}
