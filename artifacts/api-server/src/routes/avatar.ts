import { Router, type IRouter } from "express";
import { verifySupabaseToken, supabaseAdmin } from "../lib/supabase-admin";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const BUCKET = "avatars";

async function ensureBucket() {
  const { data: buckets } = await supabaseAdmin!.storage.listBuckets();
  if (!buckets?.find((b) => b.name === BUCKET)) {
    await supabaseAdmin!.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 2 * 1024 * 1024 });
  }
}

router.post("/profile/avatar", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }

  const user = await verifySupabaseToken(token);
  if (!user) { res.status(401).json({ error: "Invalid token" }); return; }

  const { dataUrl } = req.body as { dataUrl?: string };
  if (!dataUrl || !dataUrl.startsWith("data:image/")) {
    res.status(400).json({ error: "dataUrl required (image)" });
    return;
  }

  // Parse data URL → Buffer
  const matches = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!matches) { res.status(400).json({ error: "Invalid dataUrl" }); return; }
  const mimeType = matches[1]!;
  const ext = mimeType.split("/")[1] ?? "jpg";
  const buffer = Buffer.from(matches[2]!, "base64");

  if (buffer.byteLength > 2 * 1024 * 1024) {
    res.status(413).json({ error: "الصورة أكبر من 2 ميغابايت" });
    return;
  }

  await ensureBucket();

  const path = `${user.id}/avatar.${ext}`;
  const { error: uploadErr } = await supabaseAdmin!.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: true });

  if (uploadErr) {
    req.log?.error({ uploadErr }, "avatar upload failed");
    res.status(500).json({ error: "فشل رفع الصورة: " + uploadErr.message });
    return;
  }

  const { data: urlData } = supabaseAdmin!.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;

  // Save to Supabase profiles table (primary)
  try {
    await supabaseAdmin!
      .from("profiles")
      .upsert(
        { id: user.id, profile_photo: publicUrl, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );
  } catch (err) {
    req.log?.warn({ err }, "avatar: supabase profiles upsert failed");
  }

  // Also save to Drizzle DB (best-effort)
  try {
    await db
      .update(usersTable)
      .set({ profilePhoto: publicUrl, updatedAt: new Date() })
      .where(eq(usersTable.clerkId, user.id));
  } catch { /* not critical — profiles table is the primary */ }

  res.json({ url: publicUrl });
});

export default router;
