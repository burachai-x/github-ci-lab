/**
 * ค่าคอนฟิกทั้งหมดอ่านจาก environment variable เท่านั้น
 * ห้าม hardcode ค่าลับลงในซอร์สโค้ด — เป็นกติกาที่ด่าน Secret Scanning จะคอยตรวจให้
 */
export interface AppConfig {
  port: number;
  apiToken: string;
  environment: 'development' | 'production' | 'test';
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`ไม่พบ environment variable ที่จำเป็น: ${name}`);
  }
  return value;
}

export function loadConfig(): AppConfig {
  const environment = (process.env.NODE_ENV ?? 'development') as AppConfig['environment'];

  return {
    port: Number(process.env.PORT ?? 3000),
    // ค่าลับมาจาก secret manager / GitHub Actions secrets เท่านั้น
    apiToken: environment === 'test' ? 'test-token' : requireEnv('API_TOKEN'),
    environment,
  };
}
