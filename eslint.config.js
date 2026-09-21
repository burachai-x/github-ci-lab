// ESLint 9 ใช้ "flat config" — ไฟล์เดียวจบ ไม่ต้องมี .eslintrc + .eslintignore แยก
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  {
    // ของที่ไม่ต้องตรวจ
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'graft/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        // เปิดโหมดที่อ่าน type ของ TypeScript ได้ ทำให้จับบั๊กได้ลึกกว่าการดูแค่ syntax
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // --- กฎที่ตั้งใจให้เป็น "ข้อตกลงของทีม" ---
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'always'],
      'no-console': 'error',

      // --- กฎที่กันบั๊กความปลอดภัยแบบพื้นฐาน (ของหนัก ๆ ปล่อยให้ SAST จัดการ) ---
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },
  {
    // จุดเริ่มโปรแกรมเป็นที่เดียวที่อนุญาตให้พิมพ์ออกหน้าจอได้
    //
    // ทำเป็นข้อยกเว้นเชิงนโยบายใน config แทนการใส่ // eslint-disable-next-line ในโค้ด
    // เพราะรายงาน SARIF จะนับ disable comment เป็น alert ที่ยังเปิดอยู่ในแท็บ Security
    // (ทำให้มีของค้างที่ไม่มีใครกล้าปิด) ส่วนข้อยกเว้นใน config อ่านได้ชัดว่าเป็นการตัดสินใจของทีม
    files: ['src/index.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // ไฟล์เทสผ่อนกฎบางข้อได้ เพราะบริบทต่างจากโค้ด production
    files: ['src/__tests__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
  {
    // ไฟล์คอนฟิกที่ไม่ได้อยู่ใน tsconfig ไม่ต้องใช้กฎที่ต้องอ่าน type
    files: ['eslint.config.js'],
    ...tseslint.configs.disableTypeChecked,
  },
  // ต้องอยู่ท้ายสุดเสมอ: ปิดกฎของ ESLint ที่ทับซ้อนกับงานของ Prettier
  prettierConfig,
);
