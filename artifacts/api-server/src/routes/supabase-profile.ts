import { Router } from "express";
import { requireSupabaseAuth } from "../middlewares/requireSupabaseAuth.js";
import { supabaseAdmin, syncProfile } from "../lib/supabase-admin.js";

const router = Router();

// GET /api/profile  (matches OpenAPI spec + generated hooks)
router.get("/profile", requireSupabaseAuth, async (req, res): Promise<void> => {
  const userId = req.supabaseUserId!;
  const email = req.supabaseUserEmail!;

  // Sync profile on first access
  await syncProfile(userId, email);

  const { data, error } = await supabaseAdmin!
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    res.status(500).json({ error: "Failed to load profile" });
    return;
  }

  // Map snake_case DB columns → camelCase (matches OpenAPI UserProfile schema)
  res.json({
    id: data.id,
    email: data.email,
    firstName: data.first_name ?? null,
    lastName: data.last_name ?? null,
    fatherName: data.father_name ?? null,
    phone: data.phone ?? null,
    birthDate: data.birth_date ?? null,
    gender: data.gender ?? null,
    governorate: data.governorate ?? null,
    city: data.city ?? null,
    address: data.address ?? null,
    profilePhoto: data.avatar_url ?? null,
    role: data.role ?? null,
    accountType: data.account_type ?? null,
    profileCompleted: data.profile_completed ?? false,
    createdAt: data.created_at ?? null,
    updatedAt: data.updated_at ?? null,
  });
});

// PUT /api/profile  (matches OpenAPI spec + generated hooks)
router.put("/profile", requireSupabaseAuth, async (req, res): Promise<void> => {
  const userId = req.supabaseUserId!;
  const email = req.supabaseUserEmail!;

  // Body uses camelCase (per OpenAPI UpdateProfileBody schema)
  const {
    firstName, lastName, fatherName, phone, birthDate,
    gender, governorate, city, address, profilePhoto,
  } = req.body as Record<string, string | undefined>;

  // First load the existing profile so we don't lose fields we didn't touch
  const { data: existing } = await supabaseAdmin!
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  // Merge: only override fields that were provided in this request
  const merged = {
    first_name:   firstName  !== undefined ? firstName  : (existing?.first_name  ?? null),
    last_name:    lastName   !== undefined ? lastName   : (existing?.last_name   ?? null),
    father_name:  fatherName !== undefined ? fatherName : (existing?.father_name ?? null),
    phone:        phone      !== undefined ? phone      : (existing?.phone       ?? null),
    birth_date:   birthDate  !== undefined ? birthDate  : (existing?.birth_date  ?? null),
    gender:       gender     !== undefined ? gender     : (existing?.gender      ?? null),
    governorate:  governorate!== undefined ? governorate: (existing?.governorate ?? null),
    city:         city       !== undefined ? city       : (existing?.city        ?? null),
    address:      address    !== undefined ? address    : (existing?.address     ?? null),
    avatar_url:   profilePhoto !== undefined ? profilePhoto : (existing?.avatar_url ?? null),
  };

  // profile_completed = all 9 required fields present
  const profile_completed = !!(
    merged.first_name && merged.last_name && merged.father_name &&
    merged.phone && merged.birth_date && merged.gender &&
    merged.governorate && merged.city && merged.address
  );

  const { data, error } = await supabaseAdmin!
    .from("profiles")
    .upsert({
      id: userId,
      email,
      ...merged,
      profile_completed,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: "Failed to update profile" });
    return;
  }

  res.json({
    id: data.id,
    email: data.email,
    firstName: data.first_name ?? null,
    lastName: data.last_name ?? null,
    fatherName: data.father_name ?? null,
    phone: data.phone ?? null,
    birthDate: data.birth_date ?? null,
    gender: data.gender ?? null,
    governorate: data.governorate ?? null,
    city: data.city ?? null,
    address: data.address ?? null,
    profilePhoto: data.avatar_url ?? null,
    role: data.role ?? null,
    accountType: data.account_type ?? null,
    profileCompleted: data.profile_completed ?? false,
    createdAt: data.created_at ?? null,
    updatedAt: data.updated_at ?? null,
  });
});

// Keep v2 aliases for any legacy calls still using /v2/profile
router.get("/v2/profile", requireSupabaseAuth, async (req, res): Promise<void> => {
  res.redirect(307, "/api/profile");
});
router.put("/v2/profile", requireSupabaseAuth, async (req, res): Promise<void> => {
  res.redirect(307, "/api/profile");
});

export default router;
