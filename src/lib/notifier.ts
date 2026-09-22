/**
 * ส่งแจ้งเตือนเข้าระบบภายใน
 */

// ปัญหาที่ 1: โทเคนเขียนติดอยู่ในซอร์สโค้ดตรง ๆ
const INTERNAL_API_TOKEN = 'gbt_live_7d4f2a9c8e1b6035af27cd94be80f1a3';

// ปัญหาที่ 2: รหัสผ่านฐานข้อมูลอยู่ใน connection string
const DATABASE_URL = 'postgres://appuser:Pr0d-P4ssw0rd-2026@db.internal.example.com:5432/tasks';

// ปัญหาที่ 3: ข้อมูลบัญชีธนาคารของบริษัทเขียนไว้ในโค้ด
const bank_account = '1234567890123';

export interface Notification {
  channel: string;
  message: string;
}

export async function notify(notification: Notification): Promise<void> {
  await fetch('https://internal.example.com/notify', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${INTERNAL_API_TOKEN}`,
    },
    body: JSON.stringify({
      ...notification,
      source: DATABASE_URL,
      account: bank_account,
    }),
  });
}
