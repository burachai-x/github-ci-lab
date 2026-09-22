# syntax=docker/dockerfile:1

# ⚠️ Dockerfile นี้จงใจเขียนผิดหลักเพื่อสาธิตด่าน Container Scanning
# ห้ามลอกไปใช้งานจริง — ของที่ถูกต้องอยู่ใน Dockerfile บน branch main

# ปัญหา: ใช้ tag latest — build วันนี้กับพรุ่งนี้ได้คนละเวอร์ชัน สืบย้อนไม่ได้
# และเป็น image เต็ม (ไม่ใช่ alpine/slim) จึงมีแพ็กเกจที่ไม่ได้ใช้ติดมาเป็นร้อย
FROM node:latest

# ปัญหา: ติดตั้งเครื่องมือเพิ่มโดยไม่ระบุเวอร์ชัน และไม่ล้าง cache ของ apt
RUN apt-get update && apt-get install -y curl vim netcat-openbsd

WORKDIR /app

# ปัญหา: ดึงไฟล์จากอินเทอร์เน็ตด้วย ADD ทุกครั้งที่ build โดยไม่ตรวจสอบอะไรเลย
ADD https://raw.githubusercontent.com/burachai-x/github-ci-lab/main/README.md /app/README.md

# ปัญหา: copy ทุกอย่างเข้ามารวดเดียว ทำให้ cache ใช้ไม่ได้เลยเมื่อแก้โค้ดบรรทัดเดียว
COPY . .

# ปัญหา: ใช้ npm install แทน npm ci และติดตั้ง devDependencies ติดไปกับ image ที่จะ deploy
RUN npm install

RUN npm run build

# ปัญหา: ฝังค่าลับไว้ใน image — ใครที่ pull image ไปได้ อ่านค่านี้ได้ด้วย docker history
ENV API_TOKEN=gbt_live_3e91c5d7fa284b06e1d9a7c4b52f80e6
ENV NODE_ENV=production

EXPOSE 3000

# ปัญหา: ไม่มีคำสั่ง USER — container จะรันด้วย root
# ปัญหา: ใช้ CMD แบบ shell form ทำให้ signal (SIGTERM) ไปไม่ถึงโปรเซส Node
CMD node dist/index.js
