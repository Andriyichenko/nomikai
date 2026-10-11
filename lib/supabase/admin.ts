import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

/**
 * Service-role client: bypasses RLS. Only for server code that must act on behalf of the
 * system — sending notifications to every respondent, one-click join links from mails, and
 * the morning reminder cron. Never import from client components.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const adminConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
