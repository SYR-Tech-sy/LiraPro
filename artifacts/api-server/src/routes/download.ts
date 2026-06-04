import { Router } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

const ZIP_PATH = path.resolve('/home/runner/workspace/lirapro_final.zip');

router.get('/api/download/lirapro', (req, res) => {
  if (!fs.existsSync(ZIP_PATH)) {
    res.status(404).json({ error: 'الملف غير موجود' });
    return;
  }
  const stat = fs.statSync(ZIP_PATH);
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="lirapro-project.zip"');
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Cache-Control', 'no-cache');
  fs.createReadStream(ZIP_PATH).pipe(res);
});

export default router;
