# syntax=docker/dockerfile:1

# ---------- ด่านที่ 1: build ----------
# ใช้ tag ที่ระบุเวอร์ชันชัดเจน (ไม่ใช้ :latest) เพื่อให้ build ซ้ำได้ผลเดิม
FROM node:22.12-alpine AS build

WORKDIR /app

# คัดลอกเฉพาะ manifest ก่อน เพื่อให้ layer ของ dependency ถูก cache ไว้
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ตัด devDependencies ออกให้เหลือเฉพาะของที่ต้องใช้ตอนรันจริง
RUN npm prune --omit=dev

# ---------- ด่านที่ 2: runtime ----------
FROM node:22.12-alpine AS runtime

ENV NODE_ENV=production

# อัปเดตแพ็กเกจของระบบ แล้วล้าง cache ในคำสั่งเดียวเพื่อไม่ให้ค้างใน layer
RUN apk --no-cache upgrade

WORKDIR /app

# image ของ node มี user "node" (uid 1000) มาให้แล้ว — ใช้แทนการรันด้วย root
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node package.json ./

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
