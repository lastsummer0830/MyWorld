#!/usr/bin/env python3
# MyWorld 헤더 밴드 생성기 — 시안 A/B/C
#
# 왜 스크립트인가: 대화창에서 SVG를 손으로 그리면 광원·셰이딩 없는 클립아트가 된다
#   (README_디자인_기준.md §4-5). 반려되면 여기 상수만 고쳐 다시 굽는다.
#
# 방침: 오브젝트를 그리지 않는다. 색면·빛의 방향·여백·글자만으로 컨셉을 전달한다.
#   컨셉 정본 = MyWorld/REBUILD_PLAN.md §컨셉 (여름 정원 섬 · 따사롭게 내리쬐는 햇살)
#   색 정본  = MyWorld/src2/scene/palette.ts  ("색의 유일한 정본")
#
# 출력: build_{a,b,c}.html → Chrome headless 2배율 → {a,b,c}.png (2200×360)

import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent

# ── 밴드 규격 (README_디자인_기준.md §4-5) ─────────────────────────────
W, H = 1100, 180  # 6.1:1 — 실물 선례 Knowva header.svg 와 동일. 4:1은 광고판이 된다
SCALE = 2  # 레티나 대응. README 에서 width="100%" 로 축소한다
NAME = "MyWorld"
NAME_PX = 46  # 밴드 높이의 26% — §3-2 하한(6% = 10.8px)을 크게 넘는다
TRACK = 0.02  # em

# ── 색: palette.ts 에서 그대로 가져온다 (지어낸 값 0개) ────────────────
# 주석은 palette.ts 원문 요지. 행 번호는 2026-08-17 실측.
P = {
    "grass":          ("#AFD177", "COLOR.grass:11        잔디 — 햇살 아래 초록으로 읽히게 노란기"),
    "grassEdge":      ("#96B863", "COLOR.grassEdge:12    섬 가장자리·풀숲의 짙은 초록"),
    "leafDeep":       ("#4E7A42", "COLOR.leafDeep:32     깊고 선명한 초록"),
    "soil":           ("#9C7357", "COLOR.soil:13         흙 단면 (따뜻한 갈색)"),
    "soilDeep":       ("#82604A", "COLOR.soilDeep:14     흙 아래쪽"),
    "fog":            ("#E6DFD2", "DAY.fog:155           따뜻한 흰 안개. 원경을 여기로 녹인다"),
    "leafCitrusDeep": ("#5F8A49", "COLOR.leafCitrusDeep:54 레몬나무 잎 그늘"),
    "lemon":          ("#F8D95E", "COLOR.lemon:55        레몬 열매 — 채도 올린 포인트 색"),
    "petalPink":      ("#F3B9CE", "COLOR.petalPink:34    꽃밭 — 분홍"),
    "petalYellow":    ("#F4D97E", "COLOR.petalYellow:35  꽃밭 — 노랑"),
    "petalLav":       ("#C9B8E4", "COLOR.petalLav:37     꽃밭 — 라벤더"),
    "petalCoral":     ("#F3B49B", "COLOR.petalCoral:38   꽃밭 — 살구/코랄"),
    "fabric":         ("#F2E8DC", "COLOR.fabric:23       차양·쿠션의 천"),
    "petalWhite":     ("#F6F0E7", "COLOR.petalWhite:36   꽃밭 — 흰"),
    "mote":           ("#FFF0C8", "COLOR.mote:86         낮의 금빛 부유물(꽃가루)"),
    "sun":            ("#FFD190", "DAY.sun:156           금빛 햇살 (중성 흰빛이면 아침이 된다)"),
    "skyTop":         ("#86C9EC", "DAY.skyTop:153"),
    "skyBottom":      ("#FFDCB8", "DAY.skyBottom:154     복숭아빛 지평선"),
}
C = {k: v[0] for k, v in P.items()}


# ── 대비 계산 (§4-5: 눈이 아니라 수치로 판정. 본문 4.5:1) ──────────────
def _lin(c):
    c /= 255
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def lum(hexstr):
    r, g, b = (int(hexstr[i:i + 2], 16) for i in (1, 3, 5))
    return 0.2126 * _lin(r) + 0.7152 * _lin(g) + 0.0722 * _lin(b)


def ratio(fg, bg):
    a, b = lum(fg), lum(bg)
    hi, lo = max(a, b), min(a, b)
    return (hi + 0.05) / (lo + 0.05)


# ★ 파스텔 팔레트의 가장 짙은 초록(leafDeep)조차 크림 배경에서 4.14:1 로 미달한다(실측).
#   palette.ts 는 "검정은 쓰지 않는다 — 어두운 색이 필요하면 그늘진 같은 색으로 간다"고 못박아 뒀고,
#   같은 파일 :127 은 그늘이 "팔레트 색의 약 37% 밝기"라고 정의한다.
#   → 새 색을 지어내지 않고, 그 그늘 규칙을 4.5:1 을 막 넘는 최소 깊이까지만 적용한다.
def shade(hexstr, bg, target=4.6):
    r, g, b = (int(hexstr[i:i + 2], 16) for i in (1, 3, 5))
    f = 1.00
    while f > 0.36:
        cur = "#%02X%02X%02X" % (round(r * f), round(g * f), round(b * f))
        if ratio(cur, bg) >= target:
            return cur, f
        f -= 0.01
    return "#%02X%02X%02X" % (round(r * 0.37), round(g * 0.37), round(b * 0.37)), 0.37



# ── 꽃밭 얼룩 생성 ────────────────────────────────────────────────────
# ★ 1차 반성: 비슷한 크기의 타원 6개를 두 줄에 번갈아 놨더니 "웅덩이가 일자로 늘어선" 패턴이 됐다.
#   화단으로 읽히려면 규칙성을 깨야 하고, 무엇보다 **원근**이 있어야 한다 —
#   먼 쪽(잔디 윗변)은 작고 옅고 촘촘하게, 가까운 쪽(밴드 아래)은 크고 진하게.
#   난수는 고정 시드라 다시 구워도 같은 그림이 나온다(생성기의 재현성).
import random


def build_meadow(seed=5):
    """꽃밭 — 흩뿌리지 않고 화단 매스로 뭉친다.

    ★ 3차 반성 (여기서 두 번 헛돌았다):
      ① 얼룩을 밴드 전폭에 흩뿌렸더니 VISUAL_ACCEPTANCE.md:31 이 금지한 scatter 그 자체가 됐다.
         원문은 "멀리서 **하나의 화단 매스**로 읽혀야 한다" — 매스가 요점이었다.
      ② 파스텔 꽃잎색(petalPink 등)을 잔디 위에 옅게 얹으면 회탁색이 된다. 흰 얼룩은 대머리로 보였다.
         → palette.ts 가 "꽃잎보다 채도 높은 포인트"로 지정한 pollen·rose 를 쓰고 알파를 올린다.
    구성: 화단 2구역(좌·우), 사이는 열린 잔디로 비운다(VISUAL_ACCEPTANCE.md:25 "의도적인 이동 흐름과 열린 잔디").
    """
    rng = random.Random(seed)
    # (x0, x1, 중심 y, 꽃송이 수, 배율) — y 작을수록 멀다. 먼 화단은 배율을 낮춰 작게 찍는다.
    # ★ 조아진 요청(더 많이): 송이 수를 대폭 올리고, 지평선 쪽에 먼 화단 하나를 더 얹어 깊이를 만든다.
    #   가운데 아래는 계속 비워 둔다 — VISUAL_ACCEPTANCE.md:25 "의도적인 이동 흐름과 열린 잔디".
    beds = [
        (2, 41, 66, 40, 1.00),   # 좌 근경
        (58, 101, 53, 32, 0.86),  # 우 중경
        (38, 62, 38, 16, 0.52),   # 중앙 원경 — 지평선 가까이, 작고 옅게
    ]
    dot_colors = [
        (232, 169, 188),  # rose:33      파스텔 로즈 (포인트 색)
        (242, 193, 78),   # pollen:39    꽃 수술 — 꽃잎보다 채도 높은 포인트
        (243, 185, 206),  # petalPink:34
        (243, 180, 155),  # petalCoral:38
        (201, 184, 228),  # petalLav:37
    ]
    parts = []
    for x0, x1, cy, n, sc in beds:
        cx = (x0 + x1) / 2
        span = x1 - x0
        # ① 매스 밑칠 — 화단이 하나의 덩어리로 앉게 하는 바탕
        parts.append(
            f"radial-gradient(ellipse {span * 5.6 * sc:.0f}px {26 * sc:.0f}px at {cx:.1f}% {cy}%,"
            f" rgba(232,169,188,{.26 * sc:.2f}), transparent 74%)"
        )
        # ② 잎 그늘 — 화단 밑동은 잔디보다 짙어야 땅에 붙는다 (leafDeep:32)
        parts.append(
            f"radial-gradient(ellipse {span * 4.8 * sc:.0f}px {14 * sc:.0f}px at {cx:.1f}% {cy + 11 * sc:.0f}%,"
            f" rgba(78,122,66,{.22 * sc:.2f}), transparent 76%)"
        )
        # ③ 꽃송이 — 작고 진하게. 크게 그리면 얼룩, 작고 진해야 꽃으로 읽힌다
        for _ in range(n):
            x = rng.uniform(x0, x1)
            y = cy + rng.uniform(-11, 9) * sc
            w = rng.uniform(9, 22) * sc
            h = rng.uniform(4, 8) * sc
            a = rng.uniform(0.42, 0.72) * (0.55 + 0.45 * sc)
            r, g, b = dot_colors[rng.randrange(len(dot_colors))]
            parts.append(
                f"radial-gradient(ellipse {w:.0f}px {h:.0f}px at {x:.1f}% {y:.1f}%,"
                f" rgba({r},{g},{b},{a:.2f}), transparent 70%)"
            )
    return ",\n    ".join(parts)


MEADOW = build_meadow()


# ── 공통 CSS ──────────────────────────────────────────────────────────
BASE = """
@font-face {{
  font-family: 'Fraunces';
  src: url('../fonts/Fraunces.ttf') format('truetype');
  font-weight: 100 900;
}}
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
html, body {{ width: {W}px; height: {H}px; overflow: hidden; }}
.band {{
  position: relative; width: {W}px; height: {H}px; overflow: hidden;
  display: flex; align-items: center;
}}
.name {{
  position: relative; z-index: 5;
  font-family: 'Fraunces', serif;
  font-variation-settings: 'wght' 600, 'opsz' 144, 'SOFT' 40, 'WONK' 0;
  font-size: {NAME_PX}px; letter-spacing: {TRACK}em; line-height: 1;
}}
"""


def page(css, body):
    head = BASE.format(W=W, H=H, NAME_PX=NAME_PX, TRACK=TRACK)
    return (
        "<meta charset='utf-8'>\n<style>\n" + head + css + "\n</style>\n" + body + "\n"
    )


# ── 시안 A — 사광 ─────────────────────────────────────────────────────
# 정원을 보여주지 않고 "정원에 드는 빛"만 보여준다. 형태 0개.
# 빛은 왼쪽 위 → 오른쪽 아래 대각선. 글자는 그늘 쪽(왼쪽)에 앉혀 대비로 뜨게 한다.
# palette.ts:140 "★ 햇살은 밝기가 아니라 대비에서 나온다" 를 색면으로 옮긴 것.
A_BG = C["fabric"]
A_TEXT, A_F = shade(C["leafDeep"], A_BG)
A = page(
    f"""
.band {{ background: {A_BG}; }}
/* ★ 1차 렌더 반성: blur 14px + 짧은 줄기 → 방향이 안 읽히고 왼쪽 얼룩이 됐다.
   빛줄기는 밴드를 끝까지 가로질러 나가야 "들어오는 빛"이 된다. blur 를 줄이고 길이를 키운다. */
.shaft {{
  position: absolute; top: -110%; left: -14%; width: 30%; height: 320%;
  background: linear-gradient(96deg,
    rgba(255,209,144,0)   0%,
    rgba(255,240,200,.92) 46%,
    rgba(255,240,200,.92) 58%,
    rgba(255,209,144,0)  100%);
  transform: rotate(24deg); transform-origin: top left;
  filter: blur(7px);
}}
/* 두 번째 줄기 — 하나면 우연처럼 보이고, 둘이면 방향이 된다. 더 얇고 옅게 */
.shaft2 {{
  position: absolute; top: -110%; left: 26%; width: 13%; height: 320%;
  background: linear-gradient(96deg,
    rgba(255,240,200,0) 0%, rgba(255,240,200,.55) 50%, rgba(255,240,200,0) 100%);
  transform: rotate(24deg); transform-origin: top left;
  filter: blur(9px);
}}
/* 빛이 내려앉는 자리 — 오른쪽 아래. 여기가 없으면 오른쪽 절반이 죽는다 */
.pool {{
  position: absolute; right: -6%; bottom: -70%; width: 46%; height: 150%;
  background: radial-gradient(ellipse at center,
    rgba(255,209,144,.55) 0%, rgba(255,209,144,.16) 55%, rgba(255,209,144,0) 100%);
  filter: blur(10px);
}}
/* 그늘 — 빛 반대쪽. 이 낙차가 햇살이다 (palette.ts:140) */
.shade {{
  position: absolute; inset: 0;
  background: linear-gradient(102deg,
    rgba(95,138,73,.16) 0%, rgba(95,138,73,.06) 24%, rgba(95,138,73,0) 50%);
}}
.name {{ margin-left: 72px; color: {A_TEXT}; }}
""",
    "<div class='band'><div class='shade'></div><div class='shaft'></div>"
    "<div class='shaft2'></div><div class='pool'></div>"
    f"<span class='name'>{NAME}</span></div>",
)

# ── 시안 B — 지평 ─────────────────────────────────────────────────────
# 두 색면이 만나는 선이 곧 "하늘에 떠 있는 정원 섬"이다 (REBUILD_PLAN.md:17).
# 경계 위에 레몬색 얇은 획 하나 — 밴드 안 유일한 고채도 포인트.
B_BG = C["skyBottom"]
B_TEXT, B_F = shade(C["leafDeep"], B_BG)
B = page(
    f"""
.band {{
  background: linear-gradient(178deg, {C['skyTop']} 0%, {C['skyBottom']} 88%);
}}
/* 아래 1/3 = 잔디 색면. 위는 비운다.
   ★ 1차 렌더 반성: 단색 사각형 + 면도날 경계라 PPT 구분선처럼 보였다.
   윗면에 햇살을 받는 밝은 테두리를 넣어야 "빛 아래 놓인 땅"이 된다 (palette.ts:127 그늘/양지 낙차). */
.ground {{
  position: absolute; left: 0; right: 0; bottom: 0; height: 33%;
  background:
    linear-gradient(to bottom,
      rgba(255,240,200,.62) 0%, rgba(255,240,200,.10) 22%, rgba(255,240,200,0) 46%),
    linear-gradient(to bottom, {C['grass']} 0%, {C['grassEdge']} 100%);
}}
/* ★ 1차 렌더 반성: 레몬 획이 진행바처럼 떠 있었다 → 획을 지우고,
   지평선 오른쪽이 햇살을 받아 레몬색으로 물드는 것으로 바꾼다. 여전히 유일한 고채도. */
.horizonLight {{
  position: absolute; right: 4%; bottom: 33%; width: 44%; height: 92px;
  transform: translateY(50%);
  background: radial-gradient(ellipse at center,
    rgba(248,217,94,.72) 0%, rgba(248,217,94,.22) 46%, rgba(248,217,94,0) 100%);
  filter: blur(8px);
}}
/* 지면 위 공기 — 지평선 바로 위를 옅게 씻는다 */
.spill {{
  position: absolute; left: 0; right: 0; bottom: 33%; height: 40%;
  background: linear-gradient(to top, rgba(255,240,200,.45), rgba(255,240,200,0));
}}
.name {{ margin-left: 72px; margin-bottom: 18px; color: {B_TEXT}; }}
""",
    "<div class='band'><div class='spill'></div><div class='ground'></div>"
    f"<div class='horizonLight'></div><span class='name'>{NAME}</span></div>",
)

# ── 시안 B2 — 지평, 글자 가운데 ───────────────────────────────────────
# 왜 이 안이 필요한가: 헤더 밴드 바로 아래에 가운데 정렬 한 줄 소개가 온다
#   (README_품질기준.md §1-② · 실물 pokemonJava/README.md:3 `<h3 align="center">`).
#   밴드 글자가 왼쪽이면 README 상단에 축이 둘 생긴다. 실물 선례 Knowva 는 왼쪽 정렬이지만
#   오른쪽을 행성 모티프로 채워 밴드가 좌우로 꽉 차 있다 — B 는 오른쪽이 빈 하늘이라 사정이 다르다.
# 지평선 빛은 오른쪽에 그대로 둔다. 광원은 좌우 대칭일 필요가 없다.
B2 = B.replace(
    ".name {{ margin-left: 72px;".replace("{{", "{"),
    ".name {",
).replace(
    ".band {\n  background: linear-gradient(178deg",
    ".band {\n  justify-content: center;\n  background: linear-gradient(178deg",
)

# ── 시안 B3 — 지평 다듬기 (B2 결함 4건 수정) ──────────────────────────
# B2 를 눈으로 보고 잡은 결함과 그 근거:
#  1) 지평선이 밴드 끝에서 끝까지 직선이라 "무한한 평야"로 읽힌다.
#     컨셉은 32m×32m **떠 있는 정원 섬**이다(REBUILD_PLAN.md:17). → 경계를 아주 완만한 돔으로 휜다.
#     오브젝트를 그리는 게 아니라 색면 윗변의 곡률만 바꾼다.
#  2) 잔디 아래가 그냥 잘려 끝난다. 컨셉의 핵심 문장이
#     "잔디 뚜껑 + 흙 단면 = 땅을 도려내 온 조각"(같은 줄)이다. → 흙 단면 색면 1개 추가.
#  3) 글자 하단이 지평선에 거의 닿는다(§4-3: 여백 ≥ 가장 작은 글자 높이). → 섬을 낮추고 글자를 띄운다.
#  4) 하늘 위 2/3 가 단일 그라데이션이라 밋밋하다. → 지평선 부근에 fog 안개층을 얹어 공기를 넣는다.
B3_NAME_PX = 50
B3 = page(
    f"""
.band {{
  justify-content: center;
  background: linear-gradient(178deg, {C['skyTop']} 0%, {C['skyBottom']} 90%);
}}
/* 원경 안개 — 지평선 부근을 따뜻한 흰빛으로 녹인다 (DAY.fog) */
.haze {{
  position: absolute; left: 0; right: 0; bottom: 36%; height: 34%;
  background: linear-gradient(to top,
    rgba(230,223,210,0) 0%, rgba(230,223,210,.82) 20%, rgba(230,223,210,0) 100%);
}}
/* 떠 있는 정원 섬 — 잔디 뚜껑 + 흙 단면.
   밴드보다 넓게(140%) 깔고 위 모서리에 큰 타원 반경을 줘서, 보이는 구간에는 아주 완만한 곡률만 남는다.
   직선이면 평야, 휘면 판이다.
   ★ 1차 시도 반성: 곡선 컨테이너 안에 색 정지점으로 흙 경계를 넣었더니 위는 곡선인데 경계는 직선이라
     케이크 층처럼 보였다. → 두 층을 같은 곡률의 돔 2개로 따로 깎아 겹친다. 경계도 같이 휜다.
   비율 근거: REBUILD_PLAN.md:64 "잔디층 0.8m + 흙 단면 1.6m" = 1:2. 흙은 밴드 아래로 잘려 나간다
   ("땅을 도려내 온 조각"이므로 단면이 계속되는 게 맞다). */
.grassCap {{
  position: absolute; left: -20%; width: 140%; bottom: 0; height: 40%;
  border-radius: 50% 50% 0 0 / 54px 54px 0 0;
  background:
    linear-gradient(to bottom,
      rgba(255,240,200,.40) 0%, rgba(255,240,200,.08) 26%, rgba(255,240,200,0) 52%),
    linear-gradient(to bottom, {C['grass']} 0%, {C['grassEdge']} 100%);
}}
.soilFace {{
  position: absolute; left: -20%; width: 140%; bottom: 0; height: 13%;
  border-radius: 50% 50% 0 0 / 54px 54px 0 0;
  background:
    /* 단면 윗머리에 빛이 얹힌다 — 없으면 갈색 띠가 통째로 무거워진다 */
    linear-gradient(to bottom,
      rgba(255,240,200,.34) 0%, rgba(255,240,200,0) 46%),
    linear-gradient(to bottom, {C['soil']} 0%, {C['soilDeep']} 100%);
}}
/* 지평선 오른쪽이 햇살을 받아 레몬색으로 물든다 — 밴드 안 유일한 고채도 */
.horizonLight {{
  position: absolute; right: 6%; bottom: 40%; width: 40%; height: 84px;
  transform: translateY(50%);
  background: radial-gradient(ellipse at center,
    rgba(248,217,94,.66) 0%, rgba(248,217,94,.20) 46%, rgba(248,217,94,0) 100%);
  filter: blur(9px);
}}
.name {{ font-size: {B3_NAME_PX}px; margin-bottom: 40px; color: {B_TEXT}; }}
""",
    "<div class='band'><div class='haze'></div><div class='grassCap'></div>"
    "<div class='soilFace'></div>"
    f"<div class='horizonLight'></div><span class='name'>{NAME}</span></div>",
)

# ── 시안 B4 — B2 + 꽃밭 기운 (흙 없음, 수채 느낌 복원) ────────────────
# 조아진 지적 2건을 그대로 반영한다:
#  ① B3 는 과하다 — 흙 단면 뺀다. 곡률 돔도 뺀다(가장자리가 딱딱해진 원인).
#  ② B2 의 흐린 수채 느낌을 B3 에서 없앴다 — 돔·흙의 하드 엣지가 원인이었다.
#     여기서는 지평선 자체도 번지게 해서 B2 보다 오히려 더 물감처럼 만든다.
# 꽃밭은 꽃을 그리지 않는다. 잔디 위에 꽃잎 색이 옅게 번지는 얼룩만 — 멀리서 본 화단 매스다
#   (VISUAL_ACCEPTANCE.md:31 "개별 줄기 scatter 금지. 멀리서 하나의 화단 매스로").
B4 = page(
    f"""
.band {{
  justify-content: center;
  background: linear-gradient(178deg, {C['skyTop']} 0%, {C['skyBottom']} 88%);
}}
/* 잔디 색면 — 윗면에 햇살 테두리 */
.ground {{
  position: absolute; left: 0; right: 0; bottom: 0; height: 38%;
  background:
    linear-gradient(to bottom,
      rgba(255,240,200,.52) 0%, rgba(255,240,200,.08) 20%, rgba(255,240,200,0) 44%),
    linear-gradient(to bottom, {C['grass']} 0%, {C['grassEdge']} 100%);
}}
/* ★ 꽃밭 — 꽃을 그리지 않고 꽃잎 색이 번진 얼룩만 얹는다.
   높이를 낮게(타원) 눌러야 지면에 깔린 화단으로 읽히고, 세우면 풍선이 된다. */
.meadow {{
  position: absolute; left: 0; right: 0; bottom: 0; height: 38%;
  background:
    {MEADOW};
  filter: blur(2px);
}}
/* ★ 지평선을 번지게 한다 — B2 는 여기가 면도날이었다. 물감이 종이에 번지듯 경계를 풀어 준다 */
.horizonBleed {{
  position: absolute; left: 0; right: 0; bottom: 38%; height: 26px;
  transform: translateY(50%);
  background: linear-gradient(to top,
    rgba(175,209,119,.75) 0%, rgba(214,229,182,.45) 46%, rgba(230,223,210,0) 100%);
  filter: blur(6px);
}}
/* 지평선 오른쪽이 햇살을 받아 레몬색으로 물든다 — 밴드 안 유일한 고채도 */
.horizonLight {{
  position: absolute; right: 5%; bottom: 38%; width: 42%; height: 88px;
  transform: translateY(50%);
  background: radial-gradient(ellipse at center,
    rgba(248,217,94,.62) 0%, rgba(248,217,94,.20) 46%, rgba(248,217,94,0) 100%);
  filter: blur(10px);
}}
/* 지평선 위 공기 */
.spill {{
  position: absolute; left: 0; right: 0; bottom: 38%; height: 40%;
  background: linear-gradient(to top, rgba(255,240,200,.42), rgba(255,240,200,0));
}}
.name {{ margin-bottom: 20px; color: {B_TEXT}; }}
""",
    "<div class='band'><div class='spill'></div><div class='ground'></div>"
    "<div class='meadow'></div><div class='horizonBleed'></div>"
    f"<div class='horizonLight'></div><span class='name'>{NAME}</span></div>",
)

# ── 시안 C — 빛무리 ───────────────────────────────────────────────────
# 해를 그리지 않고 햇살의 번짐만 남긴다. 가장 조용하고 가장 안 낡는다.
C_BG = C["petalWhite"]
C_TEXT, C_F = shade(C["leafCitrusDeep"], C_BG)
C_ = page(
    f"""
.band {{ background: {C_BG}; }}
/* 큰 광무리 — 밴드 안으로 스며든다. 테두리가 보이면 해가 되므로 아주 부드럽게.
   ★ 1차 렌더 반성: right:-8% 로 밴드 밖에 걸쳐 놨더니 오른쪽 끝에서 색이 새는 것처럼 보였다.
   안쪽으로 들여 광무리가 밴드 안에서 닫히게 한다. */
.glow {{
  position: absolute; right: 7%; top: 50%; transform: translateY(-50%);
  width: 520px; height: 520px; border-radius: 50%;
  background: radial-gradient(circle,
    rgba(255,240,200,.95) 0%,
    rgba(255,209,144,.52) 40%,
    rgba(255,209,144,.14) 66%,
    rgba(255,209,144,0)  100%);
  filter: blur(18px);
}}
/* 잔디에서 반사돼 올라오는 빛 — palette.ts:161 hemiGround.
   이게 있어야 "정원의 빛"이고, 없으면 그냥 따뜻한 그라데이션이다. */
.bounce {{
  position: absolute; inset: 0;
  background:
    linear-gradient(to top, rgba(175,209,119,.30) 0%, rgba(175,209,119,0) 52%),
    linear-gradient(90deg, rgba(175,209,119,.18) 0%, rgba(175,209,119,0) 42%);
}}
.name {{ margin-left: 72px; color: {C_TEXT}; }}
""",
    "<div class='band'><div class='bounce'></div><div class='glow'></div>"
    f"<span class='name'>{NAME}</span></div>",
)

VARIANTS = [
    ("a", "사광",   A,  A_TEXT, A_BG, A_F, "leafDeep",       "정원을 안 보여주고 정원에 드는 빛만. 형태 0개"),
    ("b", "지평",   B,  B_TEXT, B_BG, B_F, "leafDeep",       "두 색면이 만나는 선 = 떠 있는 정원 섬. 레몬 획 1개"),
    ("b2", "지평·중앙", B2, B_TEXT, B_BG, B_F, "leafDeep", "B와 동일. 글자만 가운데 — 아래 한 줄 소개와 축을 맞춘다"),
    ("b3", "지평·다듬음", B3, B_TEXT, B_BG, B_F, "leafDeep", "B2 결함 4건 수정 — 섬 곡률·흙 단면·글자 여백·안개층"),
    ("b4", "B2+꽃밭", B4, B_TEXT, B_BG, B_F, "leafDeep", "흙·돔 없음. 꽃잎 색 얼룩 + 지평선 번짐 — 수채 느낌 복원"),
    ("c", "빛무리", C_, C_TEXT, C_BG, C_F, "leafCitrusDeep", "해를 그리지 않고 햇살의 번짐만"),
]

CHROME = "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"


def winpath(p: Path) -> str:
    return subprocess.run(
        ["wslpath", "-w", str(p)], capture_output=True, text=True, check=True
    ).stdout.strip()



# ── 캐시 무효화 ───────────────────────────────────────────────────────
# 파일명이 매번 같아서 브라우저가 옛 PNG 를 재사용한다. 실제로 "고친 거 맞아? 그대로 같은데"
# 라는 지적을 받았다(2026-08-17). 구울 때마다 img src 에 ?v=<mtime> 을 다시 박는다.
def stamp_index():
    idx = HERE / "index.html"
    if not idx.exists():
        return
    html = idx.read_text(encoding="utf-8")
    for png in sorted(HERE.glob("*.png")):
        v = int(png.stat().st_mtime)
        html = re.sub(
            r'src="' + re.escape(png.name) + r'(\?v=\d+)?"',
            f'src="{png.name}?v={v}"',
            html,
        )
    idx.write_text(html, encoding="utf-8")
    print(f"index.html 캐시 무효화 갱신")


def main():
    print(f"밴드 {W}×{H} = {W / H:.2f}:1  (6:1 내외 · 4:1 금지)")
    print(f"출력 {W * SCALE}×{H * SCALE}  ({SCALE}배율)")
    print(f"글자 {NAME_PX}px = 밴드 높이의 {NAME_PX / H * 100:.0f}%  (§3-2 하한 6% = {H * 0.06:.1f}px)")
    print()

    for key, label, html, fg, bg, f, src, note in VARIANTS:
        (HERE / f"build_{key}.html").write_text(html, encoding="utf-8")
        r = ratio(fg, bg)
        verdict = "PASS" if r >= 4.5 else "FAIL"
        print(f"[{key}] {label:4s} 글자 {fg} on {bg}  대비 {r:.2f}:1  {verdict}"
              f"   (= {src} × {f:.0%} 그늘)  — {note}")

    print()
    for key, *_ in VARIANTS:
        src = winpath(HERE / f"build_{key}.html")
        out = winpath(HERE / f"{key}.png")
        cmd = [
            CHROME, "--headless", "--disable-gpu", "--hide-scrollbars",
            "--allow-file-access-from-files",
            f"--force-device-scale-factor={SCALE}",
            f"--window-size={W},{H}",
            f"--screenshot={out}",
            f"file:///{src.replace(chr(92), '/')}",
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        png = HERE / f"{key}.png"
        ok = png.exists()
        print(f"[{key}] render {'OK' if ok else 'FAIL'}"
              f"{'  ' + str(png.stat().st_size // 1024) + 'KB' if ok else ''}")
        if not ok:
            print(res.stderr[-500:], file=sys.stderr)

    stamp_index()

    print("\n색 근거 (palette.ts):")
    for k, (hexv, why) in P.items():
        print(f"  {hexv}  {k:15s} {why}")


if __name__ == "__main__":
    main()
