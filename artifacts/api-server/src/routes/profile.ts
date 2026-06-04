import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  GetProfileResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/profile", requireAuth, async (req, res): Promise<void> => {
  const userId = req.supabaseUserId!;
  const email = req.supabaseUserEmail ?? "";

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  if (!user) {
    const [newUser] = await db
      .insert(usersTable)
      .values({
        clerkId: userId,
        email,
        loginProvider: "supabase",
        lastSeenAt: new Date(),
        profileCompleted: false,
      })
      .returning();
    res.json(GetProfileResponse.parse(newUser));
    return;
  }

  await db
    .update(usersTable)
    .set({ lastSeenAt: new Date(), loginProvider: "supabase" })
    .where(eq(usersTable.clerkId, userId));

  res.json(GetProfileResponse.parse({ ...user, lastSeenAt: new Date(), loginProvider: "supabase" }));
});

router.put("/profile", requireAuth, async (req, res): Promise<void> => {
  const userId = req.supabaseUserId!;
  const email = req.supabaseUserEmail ?? "";

  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { firstName, lastName, fatherName, phone, birthDate, gender, governorate, city, address, profilePhoto, latitude, longitude } = parsed.data;
  const profileCompleted = !!(firstName && lastName && fatherName && phone && birthDate && gender && governorate && city && address);

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));

  if (!existing) {
    const [newUser] = await db
      .insert(usersTable)
      .values({
        clerkId: userId,
        email,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        fatherName: fatherName ?? null,
        phone: phone ?? null,
        birthDate: birthDate ?? null,
        gender: gender ?? null,
        governorate: governorate ?? null,
        city: city ?? null,
        address: address ?? null,
        profilePhoto: profilePhoto ?? null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        lastSeenAt: new Date(),
        profileCompleted,
      })
      .returning();
    res.json(UpdateProfileResponse.parse(newUser));
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      fatherName: fatherName ?? null,
      phone: phone ?? null,
      birthDate: birthDate ?? null,
      gender: gender ?? null,
      governorate: governorate ?? null,
      city: city ?? null,
      address: address ?? null,
      profilePhoto: profilePhoto ?? null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      lastSeenAt: new Date(),
      profileCompleted,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.clerkId, userId))
    .returning();

  res.json(UpdateProfileResponse.parse(updated));
});

export default router;
