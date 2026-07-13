// ── 강아지 액자 그림 — canvas 2D 절차 생성 ────────────────
// 외부 이미지 대신 canvas로 직접 그립니다 (단순 도형 + 낙서 느낌).
// 골든 크림 강아지: 처진 귀, 둥근 코, 파스텔 배경.

import * as THREE from "three";

export type DogFrameKey = "smiling" | "sleeping" | "peeking";

// 그림에 쓰는 색 (액자 그림 전용 — 씬 COLOR 팔레트와 톤 맞춤)
const DOODLE = {
  fur:    "#F2E3C8",   // 크림 털 (COLOR.dogCream)
  ear:    "#B98A5F",   // 브라운 귀 (COLOR.dogBrown)
  nose:   "#5C4638",   // 다크 브라운 코 (COLOR.dogNose)
  line:   "#7A5C42",   // 낙서 외곽선
  tongue: "#EE9E9E",   // 분홍 혀
  blush:  "#F5C4BC",   // 볼터치
  bone:   "#F7EFE2",   // 뼈다귀
} as const;

// ── 공통 파츠 ────────────────────────────────────────────

// 처진 귀 — 머리 양옆에 늘어진 타원
function drawFloppyEars(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ([-1, 1] as number[]).forEach((s) => {
    ctx.save();
    ctx.translate(cx + s * r * 0.88, cy - r * 0.05);
    ctx.rotate(s * 0.35);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.30, r * 0.62, 0, 0, Math.PI * 2);
    ctx.fillStyle = DOODLE.ear;
    ctx.fill();
    ctx.lineWidth = 7;
    ctx.strokeStyle = DOODLE.line;
    ctx.stroke();
    ctx.restore();
  });
}

// 얼굴 베이스 — 둥근 머리 + 주둥이 + 둥근 코 + 입
function drawDogFace(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  closedEyes: boolean,
) {
  // 귀를 먼저 (머리 뒤로 깔리게)
  drawFloppyEars(ctx, cx, cy, r);

  // 머리
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 0.92, 0, 0, Math.PI * 2);
  ctx.fillStyle = DOODLE.fur;
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = DOODLE.line;
  ctx.stroke();

  // 볼터치
  ([-1, 1] as number[]).forEach((s) => {
    ctx.beginPath();
    ctx.ellipse(cx + s * r * 0.55, cy + r * 0.28, r * 0.14, r * 0.09, 0, 0, Math.PI * 2);
    ctx.fillStyle = DOODLE.blush;
    ctx.fill();
  });

  // 눈
  ctx.strokeStyle = DOODLE.nose;
  ctx.fillStyle   = DOODLE.nose;
  ([-1, 1] as number[]).forEach((s) => {
    if (closedEyes) {
      // 자는 눈 — 아래로 볼록한 곡선
      ctx.beginPath();
      ctx.lineWidth = 7;
      ctx.arc(cx + s * r * 0.36, cy - r * 0.10, r * 0.13, 0.25 * Math.PI, 0.75 * Math.PI);
      ctx.stroke();
    } else {
      // 동그란 점 눈
      ctx.beginPath();
      ctx.arc(cx + s * r * 0.36, cy - r * 0.06, r * 0.075, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // 둥근 코
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.22, r * 0.15, r * 0.11, 0, 0, Math.PI * 2);
  ctx.fillStyle = DOODLE.nose;
  ctx.fill();

  // 입 — 코에서 내려와 양쪽으로 갈라지는 ω 라인
  ctx.beginPath();
  ctx.lineWidth = 6;
  ctx.strokeStyle = DOODLE.line;
  ctx.moveTo(cx, cy + r * 0.33);
  ctx.lineTo(cx, cy + r * 0.42);
  ctx.arc(cx - r * 0.13, cy + r * 0.42, r * 0.13, 0, 0.5 * Math.PI);
  ctx.moveTo(cx, cy + r * 0.42);
  ctx.arc(cx + r * 0.13, cy + r * 0.42, r * 0.13, 0.5 * Math.PI, Math.PI);
  ctx.stroke();
}

// 뼈다귀 낙서
function drawBone(ctx: CanvasRenderingContext2D, cx: number, cy: number, len: number, rot: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  const r = len * 0.16;
  ctx.fillStyle   = DOODLE.bone;
  ctx.strokeStyle = DOODLE.line;
  ctx.lineWidth   = 5;
  // 몸통
  ctx.beginPath();
  ctx.rect(-len / 2, -r * 0.55, len, r * 1.1);
  ctx.fill();
  ctx.stroke();
  // 양끝 혹
  ([-1, 1] as number[]).forEach((sx) => {
    ([-1, 1] as number[]).forEach((sy) => {
      ctx.beginPath();
      ctx.arc(sx * len / 2, sy * r * 0.5, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  });
  ctx.restore();
}

// 하트 낙서
function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.moveTo(0, s * 0.35);
  ctx.bezierCurveTo(-s, -s * 0.45, -s * 0.35, -s * 1.05, 0, -s * 0.35);
  ctx.bezierCurveTo(s * 0.35, -s * 1.05, s, -s * 0.45, 0, s * 0.35);
  ctx.fillStyle = DOODLE.blush;
  ctx.fill();
  ctx.restore();
}

// ── 그림 3종 ─────────────────────────────────────────────

// 1) 활짝 웃는 정면 얼굴 + 혀 + 하트 (세로형 large)
function drawSmiling(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = "#F2F7EF";                 // 연민트 크림 배경
  ctx.fillRect(0, 0, size, size);
  const cx = size / 2, cy = size * 0.52, r = size * 0.30;
  drawDogFace(ctx, cx, cy, r, false);
  // 혀
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.60, r * 0.11, r * 0.17, 0, 0, Math.PI * 2);
  ctx.fillStyle = DOODLE.tongue;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = DOODLE.line;
  ctx.stroke();
  // 주변 하트 낙서
  drawHeart(ctx, size * 0.16, size * 0.18, size * 0.045);
  drawHeart(ctx, size * 0.84, size * 0.14, size * 0.035);
  drawHeart(ctx, size * 0.80, size * 0.84, size * 0.040);
}

// 2) 자는 얼굴 + zZ (정사각 small)
function drawSleeping(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = "#FCF3E8";                 // 크림 배경
  ctx.fillRect(0, 0, size, size);
  const cx = size * 0.46, cy = size * 0.56, r = size * 0.28;
  drawDogFace(ctx, cx, cy, r, true);
  // zZ 글자
  ctx.fillStyle = DOODLE.line;
  ctx.textAlign = "center";
  ctx.font = `bold ${size * 0.09}px Comic Sans MS, cursive, sans-serif`;
  ctx.fillText("z", size * 0.72, size * 0.28);
  ctx.font = `bold ${size * 0.13}px Comic Sans MS, cursive, sans-serif`;
  ctx.fillText("Z", size * 0.82, size * 0.20);
}

// 3) 뼈다귀를 올려다보는 얼굴 (가로형 medium)
function drawPeeking(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = "#EAF2F6";                 // 연하늘 배경
  ctx.fillRect(0, 0, size, size);
  // 얼굴 — 아래쪽에서 빼꼼
  const cx = size * 0.38, cy = size * 0.68, r = size * 0.26;
  drawDogFace(ctx, cx, cy, r, false);
  // 시선 위 뼈다귀
  drawBone(ctx, size * 0.72, size * 0.26, size * 0.22, -0.4);
  // 점선 시선
  ctx.setLineDash([10, 12]);
  ctx.beginPath();
  ctx.lineWidth = 5;
  ctx.strokeStyle = DOODLE.line;
  ctx.moveTo(cx + r * 0.5, cy - r * 0.5);
  ctx.lineTo(size * 0.66, size * 0.34);
  ctx.stroke();
  ctx.setLineDash([]);
}

// ── 텍스처 생성 ──────────────────────────────────────────
export function createDogTexture(key: DogFrameKey): THREE.CanvasTexture {
  const size = 512;
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d")!;

  if (key === "smiling")  drawSmiling(ctx, size);
  if (key === "sleeping") drawSleeping(ctx, size);
  if (key === "peeking")  drawPeeking(ctx, size);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace  = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// 액자별 메타 — 프레임/매트 색은 밝은 우드 + 파스텔 톤
export const DOG_FRAME_META: { key: DogFrameKey; frameColor: string; matColor: string }[] = [
  { key: "smiling",  frameColor: "#C9AE8C", matColor: "#FBF8F1" },   // 내추럴 오크 + 크림 매트
  { key: "sleeping", frameColor: "#8FBFA6", matColor: "#F4F9F4" },   // 세이지 그린 + 민트 매트
  { key: "peeking",  frameColor: "#A0805C", matColor: "#FFF6EA" },   // 미드 오크 + 아이보리 매트
];
