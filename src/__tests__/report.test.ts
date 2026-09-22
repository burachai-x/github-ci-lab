import { describe, expect, it } from 'vitest';
import { summarize } from '../lib/report.js';

describe('summarize', () => {
  it('นับงานที่เสร็จแล้วได้ถูกต้อง', () => {
    const result = summarize([{ done: true }, { done: false }, { done: true }]);

    expect(result.done).toBe(2);
    expect(result.pending).toBe(1);
  });

  it('คืนค่า 0 เมื่อไม่มีงานเลย (เทสนี้จะไม่ผ่าน เพราะโค้ดหาร 0)', () => {
    const result = summarize([]);

    expect(result.completionRate).toBe(0);
  });
});
