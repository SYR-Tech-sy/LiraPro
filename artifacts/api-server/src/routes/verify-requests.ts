import { Router, type IRouter } from "express";
import {
  getAllVerifyRequests,
  addVerifyRequest,
  handleVerifyRequest,
} from "../services/verifyService.js";
import { emitNotification } from "../services/notificationService.js";

const router: IRouter = Router();
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "SYRSYP2026ADMIN";

// GET /api/admin/verify-requests — admin only
router.get("/admin/verify-requests", (req, res): void => {
  const token = req.headers["x-admin-token"];
  if (token !== ADMIN_TOKEN) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json(getAllVerifyRequests());
});

// POST /api/admin/verify-requests — any user submits verification request
router.post("/admin/verify-requests", (req, res): void => {
  const { supabaseId, lphId, fullName, email } = req.body as {
    supabaseId: string;
    lphId: string;
    fullName: string;
    email: string;
  };
  if (!supabaseId) {
    res.status(400).json({ error: "supabaseId is required" });
    return;
  }
  const entry = addVerifyRequest({
    supabaseId,
    lphId: lphId || "",
    fullName: fullName || "",
    email: email || "",
  });
  res.json(entry);
});

// PATCH /api/admin/verify-requests/:id — admin approves or rejects
router.patch("/admin/verify-requests/:id", (req, res): void => {
  const token = req.headers["x-admin-token"];
  if (token !== ADMIN_TOKEN) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { action } = req.body as { action: "approved" | "rejected" };
  if (action !== "approved" && action !== "rejected") {
    res.status(400).json({ error: "action must be 'approved' or 'rejected'" });
    return;
  }

  // Find the request before handling so we can get the supabaseId for push
  const all = getAllVerifyRequests();
  const entry = all.find((r) => r.id === (req.params.id ?? ""));
  const ok = handleVerifyRequest(req.params.id ?? "", action);
  res.json({ success: ok });

  // Send notification to the user (type: success for approved, warning for rejected)
  if (ok && entry?.supabaseId) {
    void emitNotification({
      title: action === "approved" ? "تم قبول طلب التحقق ✓" : "تم رفض طلب التحقق",
      body: action === "approved"
        ? "تهانينا! تم التحقق من هويتك بنجاح."
        : "تم رفض طلب التحقق. يرجى مراجعة البيانات وإعادة المحاولة.",
      type: action === "approved" ? "success" : "warning",
      icon: action === "approved" ? "check-circle" : "alert-triangle",
      recipientType: "user",
      targetUserId: entry.supabaseId,
      actionUrl: "/app/profile",
    }).catch(() => {});
  }
});

export default router;
