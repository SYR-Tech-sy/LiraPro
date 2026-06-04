import { Router, type IRouter } from "express";
import {
  getAllVerifyRequests,
  addVerifyRequest,
  handleVerifyRequest,
} from "../services/verifyService.js";

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
  const { clerkId, lphId, fullName, email } = req.body as {
    clerkId: string;
    lphId: string;
    fullName: string;
    email: string;
  };
  if (!clerkId || !lphId) {
    res.status(400).json({ error: "clerkId and lphId are required" });
    return;
  }
  const entry = addVerifyRequest({
    clerkId,
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
  const ok = handleVerifyRequest(req.params.id ?? "", action);
  res.json({ success: ok });
});

export default router;
