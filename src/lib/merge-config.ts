import { merge } from 'lodash';

export interface FeatureFlags {
  enableExport: boolean;
  maxTasksPerUser: number;
}

const DEFAULT_FLAGS: FeatureFlags = {
  enableExport: false,
  maxTasksPerUser: 100,
};

/**
 * รวมค่าปริยายเข้ากับค่าที่ตั้งเฉพาะลูกค้าแต่ละราย
 */
export function mergeFlags(overrides: Partial<FeatureFlags>): FeatureFlags {
  return merge({}, DEFAULT_FLAGS, overrides);
}
