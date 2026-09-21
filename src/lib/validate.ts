export interface ValidationResult<T> {
  ok: boolean;
  value?: T;
  errors: string[];
}

const TITLE_MAX_LENGTH = 200;
const OWNER_PATTERN = /^[a-z0-9._-]{3,40}$/i;

export function validateTaskInput(
  body: unknown,
): ValidationResult<{ title: string; owner: string }> {
  const errors: string[] = [];

  if (typeof body !== 'object' || body === null) {
    return { ok: false, errors: ['body ต้องเป็น JSON object'] };
  }

  const { title, owner } = body as Record<string, unknown>;

  if (typeof title !== 'string' || title.trim().length === 0) {
    errors.push('title ต้องเป็นข้อความและห้ามว่าง');
  } else if (title.length > TITLE_MAX_LENGTH) {
    errors.push(`title ต้องยาวไม่เกิน ${TITLE_MAX_LENGTH} ตัวอักษร`);
  }

  if (typeof owner !== 'string' || !OWNER_PATTERN.test(owner)) {
    errors.push('owner ต้องเป็น a-z, 0-9, จุด, ขีดกลาง หรือขีดล่าง ความยาว 3-40 ตัวอักษร');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: { title: (title as string).trim(), owner: owner as string },
    errors: [],
  };
}
