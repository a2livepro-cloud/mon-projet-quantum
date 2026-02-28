import { createClient } from "@supabase/supabase-js";

/**
 * Admin client with service_role key — bypasses RLS.
 * Only use in server-side API routes after verifying the caller is an admin.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
