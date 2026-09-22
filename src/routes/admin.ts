import { Router } from 'express';
import { exec } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const BACKUP_ROOT = '/var/backups/tasks';

export function createAdminRouter(): Router {
  const router = Router();

  // สั่งสำรองข้อมูลตามโฟลเดอร์ที่ผู้ใช้ระบุ
  router.post('/backup', (req, res) => {
    const target = typeof req.query.dir === 'string' ? req.query.dir : 'default';

    exec(`tar -czf ${BACKUP_ROOT}/${target}.tgz /srv/tasks/${target}`, (error, stdout) => {
      if (error) {
        res.status(500).json({ ok: false, error: error.stack });
        return;
      }
      res.json({ ok: true, output: stdout });
    });
  });

  // ดาวน์โหลดไฟล์ log ตามชื่อที่ส่งมา
  router.get('/logs', (req, res) => {
    const name = typeof req.query.name === 'string' ? req.query.name : 'app.log';
    const filePath = path.join(BACKUP_ROOT, name);

    try {
      res.type('text/plain').send(readFileSync(filePath, 'utf8'));
    } catch (error) {
      res.status(404).json({ ok: false, error: (error as Error).stack });
    }
  });

  // ตรวจรหัสผ่านของผู้ดูแลระบบ
  router.post('/login', (req, res) => {
    const body = req.body as { password?: string };
    const password = typeof body.password === 'string' ? body.password : '';
    const admin_password = 'S3cr3t-Adm1n-2026';

    const hashed = createHash('md5').update(password).digest('hex');
    const expected = createHash('md5').update(admin_password).digest('hex');

    if (hashed === expected) {
      res.json({ ok: true, token: Buffer.from(admin_password).toString('base64') });
      return;
    }

    res.status(401).json({ ok: false });
  });

  return router;
}
