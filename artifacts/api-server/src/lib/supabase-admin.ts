import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin: SupabaseClient | null = null;

if (supabaseUrl && serviceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
} else {
  console.warn('[supabase-admin] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY — auth features disabled.');
}

export { supabaseAdmin };

/** Returns the admin client or throws a 503-style error if not configured. */
export function requireSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) throw Object.assign(new Error('Supabase admin client not configured'), { statusCode: 503 });
  return supabaseAdmin;
}

// Verify a JWT token from the Authorization header and return the user
export async function verifySupabaseToken(token: string) {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

// Get ban status from Supabase
export async function getSupabaseBanStatus(userId: string) {
  const { data } = await supabaseAdmin!
    .from('bans')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!data) return { banned: false, restricted: false, soft_deleted: false };

  const now = new Date();
  const isRestricted = !!(data.restricted && data.restricted_until && new Date(data.restricted_until) > now);

  return {
    banned: data.banned ?? false,
    ban_reason: data.ban_reason ?? null,
    banned_at: data.banned_at ?? null,
    restricted: isRestricted,
    restricted_until: isRestricted ? data.restricted_until : null,
    restrict_reason: isRestricted ? data.restrict_reason : null,
    soft_deleted: data.soft_deleted ?? false,
    deleted_at: data.deleted_at ?? null,
    delete_reason: data.delete_reason ?? null,
  };
}

// Upsert profile on first login
export async function syncProfile(userId: string, email: string) {
  if (!supabaseAdmin) return { data: null, error: new Error('Supabase not configured') };
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .upsert(
      { id: userId, email, updated_at: new Date().toISOString() },
      { onConflict: 'id', ignoreDuplicates: true }
    )
    .select()
    .single();
  return { data, error };
}
