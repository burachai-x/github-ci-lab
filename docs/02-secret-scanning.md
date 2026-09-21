# 02 — Secret Scanning

> workflow: [`.github/workflows/secret-scan.yml`](../.github/workflows/secret-scan.yml) · คอนฟิก: [`.gitleaks.toml`](../.gitleaks.toml) · สถานะ: **บล็อกการ merge**

## กติกาข้อแรกที่ต้องจำ

**ค่าลับที่ถูก push ขึ้น remote แล้ว = รั่วแล้ว** ไม่ว่าจะรีบลบเร็วแค่ไหน

เพราะระหว่างนั้น repo อาจถูก clone, fork, มิเรอร์, เข้า cache ของ GitHub, หรือถูกบอตที่ไล่ scan
GitHub ตลอด 24 ชั่วโมงเก็บไปแล้ว (บอตพวกนี้เจอคีย์ใหม่ภายในเวลาเป็นวินาที ไม่ใช่เป็นวัน)

ดังนั้นลำดับการแก้จึงเป็น

1. **เพิกถอนคีย์เดิมและออกคีย์ใหม่ (rotate) — ทำก่อนอย่างอื่นเสมอ**
2. ย้ายค่าไปไว้ในที่ที่ควรอยู่ (GitHub Actions secrets / Vault / AWS Secrets Manager)
3. ลบออกจากโค้ด เพิ่มลง `.gitignore`
4. ล้างประวัติด้วย `git filter-repo` ถ้าจำเป็น แล้วแจ้งทุกคนให้ clone ใหม่

ข้อ 4 เป็นข้อที่เจ็บที่สุดและเป็นเหตุผลว่าทำไมเราถึงอยากกันไว้ตั้งแต่ต้น

## สองชั้นที่ repo นี้เปิดใช้

### ชั้นที่ 1 — GitHub Secret Scanning + Push Protection (ของ GitHub เอง)

GitHub ร่วมมือกับผู้ให้บริการหลายร้อยราย (AWS, Google, Stripe, Slack, npm, …)
เพื่อรู้จัก "หน้าตา" ของคีย์แต่ละยี่ห้อ เมื่อเปิด **push protection** GitHub จะ
**ปฏิเสธ `git push` ตั้งแต่ต้นทาง** ถ้าเจอคีย์ของผู้ให้บริการเหล่านั้น

```
remote: error: GH013: Repository rule violations found for refs/heads/feature.
remote: — GITHUB PUSH PROTECTION —
remote:   Push cannot contain secrets
remote:    —— Stripe API Key ————————————————————
remote:     locations:
remote:       - commit: 8f2c1d...
remote:         path: src/payment.ts:12
```

เปิดใช้: **Settings → Code security → Secret protection** (ฟรีสำหรับ public repository)

> เพราะกลไกนี้ทำงานตั้งแต่ตอน push ตัวอย่างใน repo นี้จึง**จงใจไม่ใส่คีย์ที่มีรูปแบบของผู้ให้บริการจริง**
> (เช่น `AKIA…` ของ AWS หรือ `sk_live_…` ของ Stripe) เพราะจะ push ขึ้น GitHub ไม่ได้เลย
> เราจึงใช้คีย์รูปแบบภายในองค์กรสมมุติ (`gbt_live_…`) กับรหัสผ่านฐานข้อมูลแทน

### ชั้นที่ 2 — Gitleaks ใน CI (ของเราเอง)

GitHub ไม่รู้จักรูปแบบโทเคนของระบบภายในบริษัทเรา — เราต้องสอนมันเอง
ใน [`.gitleaks.toml`](../.gitleaks.toml) จึงมีกฎที่เขียนเพิ่ม เช่น

```toml
[[rules]]
id = "gbtech-internal-token"
description = "โทเคนของระบบภายใน"
regex = '''gbt_(?:live|test)_[0-9a-zA-Z]{24,}'''
keywords = ["gbt_live_", "gbt_test_"]
```

> เขียน regex ให้ใช้ `(?:...)` แทน `(...)` เพราะ Gitleaks เอา capture group แรกไปเป็น "ค่าที่เจอ"
> ถ้าใช้ capture group ธรรมดา รายงานจะโชว์แค่คำว่า `live` แทนที่จะเป็นโทเคนทั้งตัว

## ตรวจสองขอบเขต: ไฟล์ปัจจุบัน กับ ประวัติ git

| คำสั่ง                          | ตรวจอะไร               | จับกรณีไหนได้                                     |
| ------------------------------- | ---------------------- | ------------------------------------------------- |
| `gitleaks dir .`                | ไฟล์ที่มีอยู่ ณ ตอนนี้ | คีย์ที่เพิ่ง commit เข้ามา                        |
| `gitleaks git . --log-opts=...` | ทุก commit ในประวัติ   | **คีย์ที่ลบออกจากไฟล์ไปแล้ว แต่ยังอยู่ในประวัติ** |

กรณีที่สองคือกับดักที่เจอบ่อยที่สุด: dev เผลอ commit `.env` แล้ว commit ถัดมาลบออก
คิดว่าเรียบร้อยแล้ว ทั้งที่ค่ายังอ่านได้จาก `git log -p` ตลอดไป

ใน PR เราสแกนเฉพาะช่วง `base..HEAD` (เร็ว ตรงประเด็น) ส่วนบน `main` และรอบ schedule รายสัปดาห์
สแกนย้อนทั้งประวัติด้วย `--all`

## จัดการ false positive

เรียงจาก "ควรใช้" ไป "ใช้เมื่อจำเป็นจริง ๆ"

| วิธี                                       | ใช้เมื่อ                                                  |
| ------------------------------------------ | --------------------------------------------------------- |
| แก้โค้ดให้ไม่หน้าตาเหมือนค่าลับ            | ทำได้เสมอ ควรเลือกก่อน                                    |
| คอมเมนต์ `// gitleaks:allow` ตรงบรรทัดนั้น | ยกเว้นเฉพาะจุด เห็นบริบทชัดที่สุด                         |
| `[rules.allowlist]` ใน `.gitleaks.toml`    | ยกเว้นตาม pattern เช่น ค่า placeholder                    |
| `.gitleaksignore` (ใส่ fingerprint)        | ยกเว้นเฉพาะ finding ที่ระบุแล้ว                           |
| `--baseline-path`                          | repo เก่าที่มีของค้างเยอะ ต้องการ "เริ่มนับใหม่จากวันนี้" |

ทุกครั้งที่เพิ่มข้อยกเว้น **ให้เขียนคอมเมนต์ว่าทำไม** ไม่งั้นอีกหกเดือนจะไม่มีใครกล้าลบทิ้ง

## กันตั้งแต่ในเครื่องตัวเอง (ดีกว่าให้ CI จับ)

```bash
# ติดตั้ง gitleaks แล้วผูกเป็น pre-commit hook
gitleaks git --pre-commit --staged --no-banner
```

หรือใช้ผ่าน [pre-commit](https://pre-commit.com/) ด้วย hook `gitleaks`

## สิ่งที่ Secret Scanning **ไม่ได้** ช่วย

- ค่าลับที่เก็บถูกที่แล้วแต่ตั้งสิทธิ์กว้างเกินไป
- ค่าลับใน environment variable ของ production ที่หลุดผ่าน log
- คีย์ที่ถูกต้องตามรูปแบบแต่เป็นของทีมอื่น

ด่านนี้แก้ปัญหา "อย่าเอาค่าลับใส่ git" เท่านั้น เรื่องการจัดการวงจรชีวิตของค่าลับเป็นอีกเรื่องหนึ่ง
