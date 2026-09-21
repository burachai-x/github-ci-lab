# github-ci-lab — แล็บสอน CI ฝั่ง "ตรวจโค้ด" บน GitHub

repo นี้เป็นตัวอย่างสำหรับทีมพัฒนา เพื่อให้เห็นภาพว่า **CI ที่ตรวจซอร์สโค้ด** ทำงานอย่างไร
โดยไล่ทีละด่าน แยกเป็นคนละ commit และมี Pull Request ตัวอย่างที่ "จงใจทำพัง"
ให้ดูว่าเมื่อเจอปัญหาแล้ว GitHub แจ้งเตือนออกมาหน้าตาแบบไหน

> แอปในนี้ (task API เล็ก ๆ) ไม่ใช่พระเอก — พระเอกคือไฟล์ใน `.github/workflows/`

## 5 ด่านที่ pipeline นี้ตรวจ

| # | ด่าน | ตอบคำถามว่า | เครื่องมือใน repo นี้ | workflow |
|---|------|-------------|----------------------|----------|
| 1 | **Code Quality & Formatting** | โค้ดอ่านรู้เรื่อง ฟอร์แมตตรงกันทั้งทีม และ build/test ผ่านไหม | ESLint, Prettier, `tsc --noEmit`, Vitest | `quality.yml` |
| 2 | **Secret Scanning** | มีรหัสผ่าน / API key / private key หลุดเข้ามาใน git ไหม | Gitleaks + GitHub Secret Scanning (push protection) | `secret-scan.yml` |
| 3 | **SAST** (Static Application Security Testing) | โค้ด*ที่เราเขียนเอง*มีช่องโหว่ไหม เช่น SQL injection, command injection | Semgrep, CodeQL | `sast.yml`, `codeql.yml` |
| 4 | **SCA** (Software Composition Analysis) | *ไลบรารีที่เราหยิบมาใช้* มีช่องโหว่ที่ประกาศ CVE ไว้ไหม | `npm audit`, Trivy (fs), Dependabot | `sca.yml` |
| 5 | **Container Scanning** | image ที่จะเอาขึ้น production มีช่องโหว่ / เขียน Dockerfile ผิดหลักไหม | Hadolint, Trivy (image) | `container-scan.yml` |

ความต่างที่ทีมมักสับสน: **SAST ตรวจโค้ดที่เราเขียน / SCA ตรวจของที่เราติดตั้งมา / Container Scanning ตรวจของที่อยู่ใน image ตอน runtime** (ทั้ง OS package และ dependency ที่ copy เข้าไป) ทั้งสามด่านจับคนละชั้นของปัญหา ขาดด่านใดด่านหนึ่งก็ยังมีรูโหว่

## หลักคิด 4 ข้อที่อยากให้ติดตัวกลับไป

1. **Shift left** — ยิ่งเจอเร็วยิ่งถูก แก้ตอนเขียนโค้ด (ในเครื่อง/ใน PR) ถูกกว่าเจอตอนขึ้น production หลายเท่า
2. **ทุกด่านต้องรันอัตโนมัติ** — ถ้าต้องอาศัยความขยันของคน สุดท้ายจะไม่มีใครทำ
3. **เสียงเตือนต้องไปอยู่ตรงที่คนทำงานอยู่** — คอมเมนต์ใน PR, หน้า Security, Issue ไม่ใช่ log ยาว 3,000 บรรทัดที่ไม่มีใครเปิด
4. **ของที่รับไม่ได้ ต้องบล็อกจริง** — ถ้า pipeline แดงแล้วยัง merge ได้ ด่านตรวจนั้นก็เป็นแค่ของประดับ

## เจอปัญหาแล้วแจ้งทางไหน (repo นี้เปิดครบทุกช่องทาง)

| ช่องทาง | เห็นตอนไหน | ใช้กับอะไร |
|---------|------------|-----------|
| **Job Summary** ของ workflow run | ทุกครั้งที่ CI รัน | ตารางสรุปผลของแต่ละด่าน |
| **คอมเมนต์ใน PR** | เมื่อเปิด/อัปเดต PR | สรุปสั้น ๆ ให้คนรีวิวเห็นโดยไม่ต้องเปิด log |
| **แท็บ Security → Code scanning** | ทุกครั้งที่อัปโหลด SARIF | รายการ alert ที่ติดตามสถานะได้ ปักหมุดถึงบรรทัดโค้ด |
| **Issue อัตโนมัติ** | เมื่อ `main` มี alert ค้างอยู่ | ให้ปัญหามีเจ้าของและมีคิวตามงาน |
| **บล็อกไม่ให้ merge** | ตอนกดปุ่ม Merge | ด่านที่ถือเป็น "ผ่านหรือไม่ผ่าน" ตั้งเป็น required check |

## วิธีเดินดู repo นี้

ไล่ดู commit จากล่างขึ้นบน (`git log --reverse --oneline`) จะเห็นว่า pipeline ถูกประกอบขึ้นทีละด่าน
จากนั้นเปิดแท็บ Pull requests เพื่อดูตัวอย่าง PR ที่จงใจทำพังของแต่ละด่าน

รันในเครื่องก่อน push:

```bash
npm ci
npm run lint && npm run format:check && npm run typecheck && npm test
```

## รายละเอียดแต่ละด่าน

อยู่ในโฟลเดอร์ [`docs/`](docs/) — อ่านเรียงตามหมายเลขไฟล์ได้เลย
