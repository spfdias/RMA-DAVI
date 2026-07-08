import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

const DATA_DIR = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

const DISK_LIMIT = 1 * 1024 * 1024 * 1024; // 1 GB

function getDirSize(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  let total = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isFile()) {
      total += fs.statSync(fullPath).size;
    } else if (entry.isDirectory()) {
      total += getDirSize(fullPath);
    }
  }
  return total;
}

router.get('/', (_req: Request, res: Response) => {
  const uploadsSize = getDirSize(UPLOADS_DIR);
  const percentage = Math.round((uploadsSize / DISK_LIMIT) * 10000) / 100;

  let imageCount = 0;
  if (fs.existsSync(UPLOADS_DIR)) {
    imageCount = fs.readdirSync(UPLOADS_DIR).filter(f => fs.statSync(path.join(UPLOADS_DIR, f)).isFile()).length;
  }

  res.json({
    usedBytes: uploadsSize,
    limitBytes: DISK_LIMIT,
    usedFormatted: formatBytes(uploadsSize),
    limitFormatted: formatBytes(DISK_LIMIT),
    percentage,
    alert: percentage >= 90,
    imageCount,
    uploadsPath: UPLOADS_DIR,
  });
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
}

export default router;
