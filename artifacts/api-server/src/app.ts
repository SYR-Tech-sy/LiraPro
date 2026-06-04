import express, { type Express } from "express";
import cors from "cors";
import compression from "compression";
import pinoHttp from "pino-http";
import fs from "fs";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(compression());

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

const replitDomains = (process.env.REPLIT_DOMAINS ?? "")
  .split(",")
  .map((d) => d.trim())
  .filter(Boolean);

const allowedOrigins: (string | RegExp)[] =
  replitDomains.length > 0
    ? replitDomains.flatMap((d) => [`https://${d}`, `http://${d}`])
    : [];

if (process.env.NODE_ENV !== "production") {
  allowedOrigins.push(/^http:\/\/localhost(:\d+)?$/);
}

app.use(
  cors({
    credentials: true,
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    allowedHeaders: ["Content-Type", "Authorization", "x-admin-token"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const ZIP_PATH = path.resolve("/home/runner/workspace/lirapro_final.zip");
app.get("/api/download/lirapro", (_req, res) => {
  if (!fs.existsSync(ZIP_PATH)) {
    res.status(404).json({ error: "الملف غير موجود" });
    return;
  }
  const stat = fs.statSync(ZIP_PATH);
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="lirapro-project.zip"');
  res.setHeader("Content-Length", stat.size);
  res.setHeader("Cache-Control", "no-cache");
  fs.createReadStream(ZIP_PATH).pipe(res);
});

app.use("/api", router);

export default app;
