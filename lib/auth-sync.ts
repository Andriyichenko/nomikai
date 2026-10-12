/**
 * Cross-tab hand-off for email sign-in. The tab that opens the mail link (/auth/done) announces
 * "signed-in"; the tab that requested the link (LoginPanel, still on screen) picks it up, takes
 * the user where they were, and answers "ack" so the mail tab can step aside. Same browser
 * only — another browser / a mail app's webview has its own cookies, which is what the
 * one-time code in the mail is for.
 */
export const AUTH_CHANNEL = "nomikai:auth";
export type AuthMessage = { type: "signed-in" } | { type: "ack" };

export function openAuthChannel(onMessage: (m: AuthMessage) => void) {
  if (typeof BroadcastChannel === "undefined") return null;
  const ch = new BroadcastChannel(AUTH_CHANNEL);
  ch.onmessage = (e) => onMessage(e.data as AuthMessage);
  return ch;
}
