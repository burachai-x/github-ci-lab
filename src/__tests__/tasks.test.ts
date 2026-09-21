import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('task API', () => {
  it('ตอบ health check ได้', async () => {
    const response = await request(createApp()).get('/healthz');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('สร้างงานใหม่แล้วอ่านกลับมาได้', async () => {
    const app = createApp();

    const created = await request(app)
      .post('/api/tasks')
      .send({ title: 'ตั้งค่า pipeline', owner: 'devteam' });

    expect(created.status).toBe(201);
    expect(created.body.done).toBe(false);

    const fetched = await request(app).get(`/api/tasks/${created.body.id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.title).toBe('ตั้งค่า pipeline');
  });

  it('ปฏิเสธ input ที่ไม่ผ่าน validation', async () => {
    const response = await request(createApp()).post('/api/tasks').send({ title: '', owner: 'x' });

    expect(response.status).toBe(400);
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  it('ปิดงานได้', async () => {
    const app = createApp();
    const created = await request(app)
      .post('/api/tasks')
      .send({ title: 'เขียน workflow', owner: 'devteam' });

    const completed = await request(app).post(`/api/tasks/${created.body.id}/complete`);

    expect(completed.status).toBe(200);
    expect(completed.body.done).toBe(true);
  });
});
