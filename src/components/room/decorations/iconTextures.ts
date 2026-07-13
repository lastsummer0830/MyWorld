import * as THREE from "three";

// ── 헬퍼 ─────────────────────────────────────
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x,     y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y,         x + r, y);
  ctx.closePath();
}

function makeTexture(
  drawFn: (ctx: CanvasRenderingContext2D, size: number) => void,
): THREE.CanvasTexture {
  const size   = 512;
  const canvas = document.createElement("canvas");
  canvas.width  = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  drawFn(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ── 아이콘 드로잉 ─────────────────────────────
function drawGithub(ctx: CanvasRenderingContext2D, s: number) {
  ctx.fillStyle = "#181717";
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
  ctx.fill();

  const scale = s / 98;
  ctx.save();
  ctx.scale(scale, scale);
  ctx.fillStyle = "#ffffff";
  const p = new Path2D(
    "M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69" +
    " 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127" +
    "-13.59 2.981-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17" +
    "-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052" +
    " 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6" +
    "-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2" +
    "-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052" +
    " a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63" +
    " 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038" +
    " 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283" +
    " 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526" +
    " 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691" +
    " C97.707 22 75.788 0 48.854 0z"
  );
  ctx.fill(p);
  ctx.restore();
}

function drawGmail(ctx: CanvasRenderingContext2D, s: number) {
  const pad = s * 0.05;
  const W = s - pad * 2;
  const H = W * 0.75;
  const x0 = pad;
  const y0 = (s - H) / 2;
  const mx = x0 + W / 2;
  const my = y0 + H * 0.62;

  ctx.fillStyle = "#ffffff";
  roundRect(ctx, x0, y0, W, H, 8);
  ctx.fill();

  ctx.fillStyle = "#EA4335";
  ctx.fillRect(x0,              y0, W * 0.12, H);
  ctx.fillRect(x0 + W * 0.88,  y0, W * 0.12, H);

  ctx.fillStyle = "#4285F4";
  ctx.beginPath();
  ctx.moveTo(x0 + W * 0.12, y0); ctx.lineTo(mx, my); ctx.lineTo(x0 + W * 0.12, y0 + H);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = "#34A853";
  ctx.beginPath();
  ctx.moveTo(x0 + W * 0.88, y0); ctx.lineTo(mx, my); ctx.lineTo(x0 + W * 0.88, y0 + H);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = "#FBBC05";
  ctx.beginPath();
  ctx.moveTo(x0 + W * 0.12, y0); ctx.lineTo(mx, y0 + H * 0.48); ctx.lineTo(x0 + W * 0.88, y0);
  ctx.closePath(); ctx.fill();

  ctx.strokeStyle = "#ddd";
  ctx.lineWidth = 2;
  roundRect(ctx, x0, y0, W, H, 8);
  ctx.stroke();
}

function drawDiscord(ctx: CanvasRenderingContext2D, s: number) {
  ctx.fillStyle = "#5865F2";
  roundRect(ctx, 0, 0, s, s, s * 0.18);
  ctx.fill();

  const sc   = s / 127.14;
  const offY = (s - 96.36 * sc) / 2;
  ctx.save();
  ctx.translate(0, offY);
  ctx.scale(sc, sc);
  ctx.fillStyle = "#ffffff";
  const p = new Path2D(
    "M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83" +
    " 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0" +
    " a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21" +
    " a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11" +
    " 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2" +
    " a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2" +
    " a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1" +
    " 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15Z" +
    "M42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69Z" +
    "m42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5 12.69-11.43 12.69Z"
  );
  ctx.fill(p);
  ctx.restore();
}

// ── 외부 공개 API ──────────────────────────────
// 컴포넌트 바깥에서 한 번만 생성하고 재사용합니다.
// (Hook 안에서 호출하지 않아도 됩니다.)
export type IconKey = "github" | "gmail" | "discord";

const DRAW_FNS: Record<IconKey, (ctx: CanvasRenderingContext2D, s: number) => void> = {
  github:  drawGithub,
  gmail:   drawGmail,
  discord: drawDiscord,
};

// 모듈 레벨 캐시 — 앱 생명주기 동안 한 번만 생성
const textureCache = new Map<IconKey, THREE.CanvasTexture>();

export function getIconTexture(key: IconKey): THREE.CanvasTexture {
  if (!textureCache.has(key)) {
    textureCache.set(key, makeTexture(DRAW_FNS[key]));
  }
  return textureCache.get(key)!;
}

export const ICON_META: { key: IconKey; bg: string; url: string }[] = [
  { key: "discord", bg: "#5865F2", url: "" },  // 링크를 여기에 입력하세요
  { key: "gmail",   bg: "#f8f8f8", url: "mailto:lastsummer0830@gmail.com" },  // ex) "mailto:your@email.com"
  { key: "github",  bg: "#181717", url: "https://github.com/lastsummer0830" },  // ex) "https://github.com/yourname"
];