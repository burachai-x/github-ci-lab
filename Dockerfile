# syntax=docker/dockerfile:1

# ---------- ด่านที่ 1: build ----------
# ใช้ tag ที่ระบุเวอร์ชันชัดเจน (ไม่ใช้ :latest) เพื่อให้ build ซ้ำได้ผลเดิม
FROM node:24.21.0-alpine AS build

WORKDIR /app

# คัดลอกเฉพาะ manifest ก่อน เพื่อให้ layer ของ dependency ถูก cache ไว้
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

# รวมคำสั่งที่ทำต่อเนื่องกันไว้ใน RUN เดียว จะได้ไม่เพิ่ม layer โดยไม่จำเป็น
# (build เสร็จแล้วตัด devDependencies ออกให้เหลือเฉพาะของที่ต้องใช้ตอนรันจริง)
RUN npm run build && npm prune --omit=dev

# ---------- ด่านที่ 2: runtime ----------
FROM node:24.21.0-alpine AS runtime

ENV NODE_ENV=production

# อัปเดตแพ็กเกจของระบบ แล้วถอด npm ออกจาก image ที่จะรันจริง
#
# ทำไมต้องถอด npm: ตอนรันเราเรียกแค่ `node dist/index.js` ไม่ได้ใช้ npm เลย
# แต่ npm ที่ติดมากับ base image ลากไลบรารีของตัวเองมาด้วยหลายสิบตัว
# ซึ่งมี CVE เป็นของตัวเอง กลายเป็นพื้นที่โจมตีที่เราไม่ได้ใช้ประโยชน์อะไรเลย
RUN apk --no-cache upgrade \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

WORKDIR /app

# image ของ node มี user "node" (uid 1000) มาให้แล้ว — ใช้แทนการรันด้วย root
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node package.json ./

USER node

EXPOSE 3000

# ใช้รูปแบบ JSON (exec form) เสมอ เพื่อไม่ให้คำสั่งถูก shell ตีความซ้ำ
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "dist/index.js"]
