import { createClient, type User } from "npm:@supabase/supabase-js@2";

// Shared-prod: env may use the website's NEXT_PUBLIC_* names. Prefer the
// canonical SUPABASE_* names, fall back to the NEXT_PUBLIC_* aliases.
function env(name: string, fallback: string): string {
  return Deno.env.get(name) ?? Deno.env.get(fallback) ?? "";
}
export function supabaseUrl(): string {
  return env("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
}
function anonKey(): string {
  return env("SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

/**
 * Extracts and verifies the Supabase JWT from the Authorization header.
 * Returns the authenticated user, or null if missing/invalid.
 */
export async function getAuthedUser(req: Request): Promise<User | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const supabase = createClient(supabaseUrl(), anonKey(), {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

/** Service-role client for privileged reads/writes inside edge functions. */
export function serviceClient() {
  return createClient(
    supabaseUrl(),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}
