import { supabase } from './supabase';

// ── Profile ──────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  father_name?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  governorate?: string | null;
  city?: string | null;
  address?: string | null;
  role: 'user' | 'vendor' | 'admin' | 'moderator';
  profile_completed: boolean;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data as UserProfile;
}

export async function upsertProfile(userId: string, email: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, email, ...updates, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    .select()
    .single();
  return { data, error };
}

// ── Ban Status ────────────────────────────────────────────────────────────────

export interface BanStatus {
  banned: boolean;
  ban_reason?: string | null;
  banned_at?: string | null;
  restricted: boolean;
  restricted_until?: string | null;
  restrict_reason?: string | null;
  soft_deleted: boolean;
  deleted_at?: string | null;
  delete_reason?: string | null;
}

export async function getBanStatus(userId: string): Promise<BanStatus> {
  const { data } = await supabase
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

// ── Price Alerts ──────────────────────────────────────────────────────────────

export interface PriceAlert {
  id: number;
  user_id: string;
  code: string;
  name_ar?: string | null;
  type: 'buy' | 'sell';
  target_price: number;
  is_triggered: boolean;
  triggered_at?: string | null;
  created_at: string;
  updated_at: string;
}

export async function getAlerts(userId: string): Promise<PriceAlert[]> {
  const { data } = await supabase
    .from('price_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return (data ?? []) as PriceAlert[];
}

export async function createAlert(userId: string, alert: Omit<PriceAlert, 'id' | 'user_id' | 'is_triggered' | 'triggered_at' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('price_alerts')
    .insert({ user_id: userId, ...alert, is_triggered: false })
    .select()
    .single();
  return { data, error };
}

export async function deleteAlert(id: number, userId: string) {
  return supabase.from('price_alerts').delete().eq('id', id).eq('user_id', userId);
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  created_at: string;
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  return (data ?? []) as Notification[];
}

export async function markNotificationRead(id: string) {
  return supabase.from('notifications').update({ read: true }).eq('id', id);
}

// ── Activity log ──────────────────────────────────────────────────────────────

export async function logActivity(userId: string, action: string, meta?: Record<string, unknown>) {
  return supabase.from('activity_logs').insert({
    user_id: userId,
    action,
    meta: meta ?? {},
    created_at: new Date().toISOString(),
  });
}

// ── Wallet ────────────────────────────────────────────────────────────────────

export interface WalletEntry {
  id: string;
  user_id: string;
  currency_code: string;
  amount: number;
  label?: string | null;
  created_at: string;
  updated_at: string;
}

export async function getWallet(userId: string): Promise<WalletEntry[]> {
  const { data } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  return (data ?? []) as WalletEntry[];
}

export async function upsertWalletEntry(userId: string, entry: Omit<WalletEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('wallets')
    .upsert({ user_id: userId, ...entry, updated_at: new Date().toISOString() }, { onConflict: 'user_id,currency_code' })
    .select()
    .single();
  return { data, error };
}

// ── Saved / Favorites ─────────────────────────────────────────────────────────

export async function getSavedItems(userId: string) {
  const { data } = await supabase.from('saved_items').select('*').eq('user_id', userId);
  return data ?? [];
}

export async function saveItem(userId: string, itemType: string, itemId: string) {
  return supabase.from('saved_items').insert({ user_id: userId, item_type: itemType, item_id: itemId });
}

export async function unsaveItem(userId: string, itemType: string, itemId: string) {
  return supabase.from('saved_items').delete().match({ user_id: userId, item_type: itemType, item_id: itemId });
}
