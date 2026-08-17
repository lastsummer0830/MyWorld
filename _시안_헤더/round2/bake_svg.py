#!/usr/bin/env python3
# MyWorld 헤더 밴드 — 확정안 B4 를 SVG 로 굽는다 (글자는 path)
#
# ══ 왜 다시 굽나 ═════════════════════════════════════════════════════
#  08-17 3세션은 B4 를 PNG(2200×360)로 내보냈다. 그런데 형제 repo 실물 3건이 전부 SVG 다:
#    Knowva/docs/portfolio/images/header.svg   viewBox 0 0 1100 180 · <text> 0건
#    pokemonJava/docs/images/header.svg        viewBox 0 0 1100 180 · <text> 0건
#    webProj_Popflex/docs/images/header.svg    viewBox 0 0 1100 180 · <text> 0건
#  `README_품질기준.md` §1-① 도 "글자는 path 로 굽는다"가 본문이고 PNG 는 예외 조항이다.
#  → 디자인은 바꾸지 않는다. **확정된 B4 를 그대로 SVG 로 옮기고 글자만 path 로 굽는다.**
#
# ══ 검증 방법 ════════════════════════════════════════════════════════
#  눈으로 "비슷하다"고 하지 않는다. 구운 SVG 를 같은 조건으로 렌더해
#  **확정 PNG(b4.png)와 픽셀 단위로 비교**하고 차이를 수치로 낸다.
#
# ── 원본 실측값 (build_b4.html 을 Chrome 으로 렌더해 getBoundingClientRect 로 뽑음) ──
#  글자 상자  x=458.578  y=57  w=182.828  h=46
#  font-size 46px · letter-spacing 0.92px · line-height 46px · color rgb(69,109,59)
#
# 출력: header_baked.svg  (→ 승인되면 MyWorld/docs/images/header.svg 로 배선)

import random
import re
import subprocess
import sys
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

HERE = Path(__file__).resolve().parent
FONT = HERE.parent / "fonts" / "Fraunces.ttf"

W, H = 1100, 180
NAME = "MyWorld"
NAME_PX = 46
TRACK_PX = 0.92          # 0.02em × 46px — 실측 computed 값
TEXT_X = 458.578125      # 실측
TEXT_Y = 57.0            # 실측 (라인박스 top)
TEXT_W = 182.828125      # 실측
# ★ 대비 재판정 (2026-08-18) — 3세션의 4.62:1 PASS 는 잘못된 계산이었다.
#   3세션은 잉크 vs skyBottom(#FFDCB8) **단색 두 개**로 쟀다. 그런데 글자가 실제로 놓인 자리의
#   배경은 하늘 그라데이션 중간 + spill 덧칠이라 skyBottom 보다 어둡다.
#   글자를 뺀 판을 따로 굽고 글자 상자 33,672px 을 전수 측정하니 최저 3.80:1 · 중앙 4.19:1 로
#   **전 픽셀 미달**이었다(구 잉크 #456D3B = leafDeep × 88%).
#   → palette.ts 의 "어두운 색이 필요하면 그늘진 같은 색으로 간다"에 따라 그늘을 더 내린다.
#     4.5:1 을 막 넘는 최소 깊이가 78% 다. 새 색은 지어내지 않았다.
INK = "#3D5F33"          # COLOR.leafDeep:32 (#4E7A42) × 78% 그늘 — 최저 4.62:1

# ── 색: gen_myworld_header.py 의 P 표와 같은 값 (palette.ts 출처) ──────
C = {
    "grass": "#AFD177", "grassEdge": "#96B863",
    "skyTop": "#86C9EC", "skyBottom": "#FFDCB8",
}

GROUND_H = H * 0.38                  # 68.4
GROUND_Y = H - GROUND_H              # 111.6


# ══ 1. 꽃밭 — gen_myworld_header.build_meadow 와 동일한 난수열을 재현 ══
# 같은 seed·같은 호출 순서면 같은 그림이 나온다. 재현됐는지는 CSS 문자열을 다시 만들어
# 원본 모듈의 MEADOW 와 글자 단위로 대조해 확인한다(아래 verify_meadow).
BEDS = [
    (2, 41, 66, 40, 1.00),
    (58, 101, 53, 32, 0.86),
    (38, 62, 38, 16, 0.52),
]
DOT_COLORS = [
    (232, 169, 188), (242, 193, 78), (243, 185, 206),
    (243, 180, 155), (201, 184, 228),
]


def meadow_spec(seed=5):
    """(kind, cx%, cy%, rx_px, ry_px, rgb, alpha, fade) 목록."""
    rng = random.Random(seed)
    out = []
    for x0, x1, cy, n, sc in BEDS:
        cx = (x0 + x1) / 2
        span = x1 - x0
        out.append(("mass", cx, cy, span * 5.6 * sc, 26 * sc,
                    (232, 169, 188), .26 * sc, 0.74))
        out.append(("shade", cx, cy + 11 * sc, span * 4.8 * sc, 14 * sc,
                    (78, 122, 66), .22 * sc, 0.76))
        for _ in range(n):
            x = rng.uniform(x0, x1)
            y = cy + rng.uniform(-11, 9) * sc
            w = rng.uniform(9, 22) * sc
            h = rng.uniform(4, 8) * sc
            a = rng.uniform(0.42, 0.72) * (0.55 + 0.45 * sc)
            out.append(("dot", x, y, w, h, DOT_COLORS[rng.randrange(len(DOT_COLORS))],
                        a, 0.70))
    return out


def spec_to_css(spec):
    """원본 build_meadow() 와 같은 CSS 문자열을 만들어 재현 여부를 검증한다."""
    parts = []
    for item in spec:
        kind = item[0]
        if kind == "mass":
            _, cx, cy, rx, ry, rgb, a, _ = item
            parts.append(f"radial-gradient(ellipse {rx:.0f}px {ry:.0f}px at {cx:.1f}% {cy}%,"
                         f" rgba({rgb[0]},{rgb[1]},{rgb[2]},{a:.2f}), transparent 74%)")
        elif kind == "shade":
            _, cx, cy, rx, ry, rgb, a, _ = item
            parts.append(f"radial-gradient(ellipse {rx:.0f}px {ry:.0f}px at {cx:.1f}% {cy:.0f}%,"
                         f" rgba({rgb[0]},{rgb[1]},{rgb[2]},{a:.2f}), transparent 76%)")
        else:
            _, x, y, w, h, rgb, a, _ = item
            parts.append(f"radial-gradient(ellipse {w:.0f}px {h:.0f}px at {x:.1f}% {y:.1f}%,"
                         f" rgba({rgb[0]},{rgb[1]},{rgb[2]},{a:.2f}), transparent 70%)")
    return ",\n    ".join(parts)


def verify_meadow(spec):
    sys.path.insert(0, str(HERE))
    import gen_myworld_header as g
    same = spec_to_css(spec) == g.MEADOW
    print(f"꽃밭 재현 대조: {'일치' if same else '★ 불일치'} "
          f"(원본 {len(g.MEADOW.split('radial-gradient'))-1}개 / 이번 {len(spec)}개)")
    return same


# ══ 2. 글자를 path 로 굽는다 ═══════════════════════════════════════════
def kern_pairs(f):
    """GPOS 의 kern 피처에서 쌍별 보정값(폰트 단위)을 꺼낸다.

    ★ 1차 굽기에서 글자 폭이 원본보다 2.99px 넓게 나왔다. 원인이 이것이었다 —
      브라우저는 GPOS 커닝을 적용하는데 hmtx 만 더하면 커닝이 빠진다.
      'Wo' 한 쌍만 -112 units(-2.576px)다. 안 넣으면 조판이 눈에 띄게 벌어진다.
    """
    gp = f["GPOS"].table
    lookups = gp.LookupList.Lookup
    idxs = []
    for fr in gp.FeatureList.FeatureRecord:
        if fr.FeatureTag == "kern":
            idxs += list(fr.Feature.LookupListIndex)

    def value(a, b):
        tot = 0
        for i in idxs:
            lk = lookups[i]
            subs = [s.ExtSubTable for s in lk.SubTable] if lk.LookupType == 9 else lk.SubTable
            for st in subs:
                if a not in st.Coverage.glyphs:
                    continue
                if st.Format == 1:
                    ps = st.PairSet[st.Coverage.glyphs.index(a)]
                    for pv in ps.PairValueRecord:
                        if pv.SecondGlyph == b and pv.Value1 and pv.Value1.XAdvance:
                            tot += pv.Value1.XAdvance
                elif st.Format == 2:
                    c1 = st.ClassDef1.classDefs.get(a, 0) if st.ClassDef1 else 0
                    c2 = st.ClassDef2.classDefs.get(b, 0) if st.ClassDef2 else 0
                    rec = st.Class1Record[c1].Class2Record[c2]
                    if rec.Value1 and rec.Value1.XAdvance:
                        tot += rec.Value1.XAdvance
        return tot
    return value


def bake_text():
    """Fraunces 를 확정 좌표(wght600/opsz144/SOFT40/WONK0)로 고정한 뒤 글리프를 path 로."""
    f = instancer.instantiateVariableFont(
        TTFont(FONT), {"wght": 600, "opsz": 144, "SOFT": 40, "WONK": 0})
    upem = f["head"].unitsPerEm
    scale = NAME_PX / upem
    asc, desc = f["hhea"].ascent, -f["hhea"].descent

    # line-height:1 → 라인박스 46px. half-leading 으로 글꼴 상자를 세로 가운데 맞춘다.
    content_h = (asc + desc) * scale
    baseline = TEXT_Y + (NAME_PX - content_h) / 2 + asc * scale

    cmap = f.getBestCmap()
    gs = f.getGlyphSet()
    hmtx = f["hmtx"]

    kv = kern_pairs(f)
    d_parts, pen_x, adv_total = [], TEXT_X, 0.0
    for i, ch in enumerate(NAME):
        gname = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        gs[gname].draw(pen)
        d = pen.getCommands()
        if d:
            d_parts.append(
                f'<path transform="translate({pen_x:.4f} {baseline:.4f}) '
                f'scale({scale:.6f} {-scale:.6f})" d="{d}"/>')
        aw = hmtx[gname][0] * scale
        k = kv(gname, cmap[ord(NAME[i + 1])]) * scale if i + 1 < len(NAME) else 0
        pen_x += aw + k + TRACK_PX
        adv_total += aw + k + TRACK_PX

    print(f"글자 path: {len(d_parts)}자 · 폭 {adv_total:.3f}px "
          f"(원본 실측 {TEXT_W:.3f}px · 오차 {abs(adv_total - TEXT_W):.3f}px)")
    print(f"베이스라인 y={baseline:.3f}  (asc {asc} desc {-f['hhea'].descent} upem {upem})")
    return "\n    ".join(d_parts)


# ══ 3. SVG 조립 ═══════════════════════════════════════════════════════
def rgba_stops(rgb, a, fade):
    r, g, b = rgb
    c = f"rgb({r},{g},{b})"
    return (f'<stop offset="0" stop-color="{c}" stop-opacity="{a:.3f}"/>'
            f'<stop offset="{fade}" stop-color="{c}" stop-opacity="0"/>'
            f'<stop offset="1" stop-color="{c}" stop-opacity="0"/>')


def build_svg(spec, text_paths):
    defs, body = [], []

    # 하늘 — CSS linear-gradient(178deg, skyTop 0%, skyBottom 88%)
    # 178deg 방향벡터 (sin,-cos)=(0.03490, 0.99939), 그라데이션선 길이
    # L=|W·sinA|+|H·cosA| = 1100·0.03490 + 180·0.99939 = 218.28
    import math
    a = math.radians(178)
    dx, dy = math.sin(a), -math.cos(a)
    L = abs(W * math.sin(a)) + abs(H * math.cos(a))
    x1, y1 = W / 2 - dx * L / 2, H / 2 - dy * L / 2
    x2, y2 = W / 2 + dx * L / 2, H / 2 + dy * L / 2
    defs.append(f'<linearGradient id="sky" gradientUnits="userSpaceOnUse" '
                f'x1="{x1:.3f}" y1="{y1:.3f}" x2="{x2:.3f}" y2="{y2:.3f}">'
                f'<stop offset="0" stop-color="{C["skyTop"]}"/>'
                f'<stop offset="0.88" stop-color="{C["skyBottom"]}"/>'
                f'<stop offset="1" stop-color="{C["skyBottom"]}"/></linearGradient>')
    body.append(f'<rect width="{W}" height="{H}" fill="url(#sky)"/>')

    # spill — 지평선 위 공기 (아래가 진하고 위로 사라진다)
    spill_h = H * 0.40
    defs.append('<linearGradient id="spill" x1="0" y1="1" x2="0" y2="0">'
                '<stop offset="0" stop-color="rgb(255,240,200)" stop-opacity="0.42"/>'
                '<stop offset="1" stop-color="rgb(255,240,200)" stop-opacity="0"/>'
                '</linearGradient>')
    body.append(f'<rect x="0" y="{GROUND_Y - spill_h:.2f}" width="{W}" '
                f'height="{spill_h:.2f}" fill="url(#spill)"/>')

    # ground — 잔디 색면 + 윗면 햇살 테두리
    defs.append(f'<linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">'
                f'<stop offset="0" stop-color="{C["grass"]}"/>'
                f'<stop offset="1" stop-color="{C["grassEdge"]}"/></linearGradient>')
    defs.append('<linearGradient id="sunlip" x1="0" y1="0" x2="0" y2="1">'
                '<stop offset="0" stop-color="rgb(255,240,200)" stop-opacity="0.52"/>'
                '<stop offset="0.20" stop-color="rgb(255,240,200)" stop-opacity="0.08"/>'
                '<stop offset="0.44" stop-color="rgb(255,240,200)" stop-opacity="0"/>'
                '<stop offset="1" stop-color="rgb(255,240,200)" stop-opacity="0"/>'
                '</linearGradient>')
    body.append(f'<rect x="0" y="{GROUND_Y:.2f}" width="{W}" height="{GROUND_H:.2f}" fill="url(#grass)"/>')
    body.append(f'<rect x="0" y="{GROUND_Y:.2f}" width="{W}" height="{GROUND_H:.2f}" fill="url(#sunlip)"/>')

    # meadow — 화단. ground 상자 안에서만 칠하고 그 뒤에 blur(2px)
    defs.append(f'<clipPath id="gclip"><rect x="0" y="{GROUND_Y:.2f}" '
                f'width="{W}" height="{GROUND_H:.2f}"/></clipPath>')
    defs.append('<filter id="b2" x="-20%" y="-60%" width="140%" height="220%">'
                '<feGaussianBlur stdDeviation="2"/></filter>')
    els = []
    for i, item in enumerate(spec):
        kind = item[0]
        _, px, py, rx, ry, rgb, alpha, fade = item
        cx = px / 100 * W
        cy = GROUND_Y + py / 100 * GROUND_H
        gid = f"m{i}"
        defs.append(f'<radialGradient id="{gid}">{rgba_stops(rgb, alpha, fade)}</radialGradient>')
        els.append(f'<ellipse cx="{cx:.2f}" cy="{cy:.2f}" rx="{rx:.2f}" ry="{ry:.2f}" fill="url(#{gid})"/>')
    body.append('<g clip-path="url(#gclip)" filter="url(#b2)">\n    '
                + "\n    ".join(els) + '\n  </g>')

    # horizonBleed — 지평선 번짐. 상자 y = GROUND_Y-26+13 .. +26
    bh = 26
    by = GROUND_Y - bh + bh / 2
    defs.append('<linearGradient id="bleed" x1="0" y1="1" x2="0" y2="0">'
                '<stop offset="0" stop-color="rgb(175,209,119)" stop-opacity="0.75"/>'
                '<stop offset="0.46" stop-color="rgb(214,229,182)" stop-opacity="0.45"/>'
                '<stop offset="1" stop-color="rgb(230,223,210)" stop-opacity="0"/>'
                '</linearGradient>')
    defs.append('<filter id="b6" x="-20%" y="-200%" width="140%" height="500%">'
                '<feGaussianBlur stdDeviation="6"/></filter>')
    body.append(f'<rect x="0" y="{by:.2f}" width="{W}" height="{bh}" '
                f'fill="url(#bleed)" filter="url(#b6)"/>')

    # horizonLight — 지평선 오른쪽 레몬빛. 밴드 안 유일한 고채도
    lw, lh = W * 0.42, 88
    lx2 = W - W * 0.05
    lcx = lx2 - lw / 2
    # bottom:38% → 상자 아래변이 GROUND_Y. translateY(50%) 로 높이의 절반만큼 내려가므로
    # 이동 후 상자는 y (GROUND_Y-lh/2) ~ (GROUND_Y+lh/2), 즉 중심이 정확히 GROUND_Y 다.
    lcy = GROUND_Y
    defs.append('<radialGradient id="hl">'
                '<stop offset="0" stop-color="rgb(248,217,94)" stop-opacity="0.62"/>'
                '<stop offset="0.46" stop-color="rgb(248,217,94)" stop-opacity="0.20"/>'
                '<stop offset="1" stop-color="rgb(248,217,94)" stop-opacity="0"/>'
                '</radialGradient>')
    defs.append('<filter id="b10" x="-60%" y="-200%" width="220%" height="500%">'
                '<feGaussianBlur stdDeviation="10"/></filter>')
    # ★ CSS `radial-gradient(ellipse at center, ...)` 는 크기를 안 적으면 farthest-corner 다.
    #   상자 모서리까지 닿아야 하므로 반지름이 상자 절반의 √2 배가 된다.
    #   1차 굽기에서 여기를 상자 절반(closest-side)으로 잡아 빛무리가 √2 배 작게 나왔고,
    #   픽셀 대조에서 오른쪽에 큰 고리 모양 오차로 그대로 드러났다.
    k = 2 ** 0.5
    body.append(f'<ellipse cx="{lcx:.2f}" cy="{lcy:.2f}" rx="{lw/2*k:.2f}" ry="{lh/2*k:.2f}" '
                f'fill="url(#hl)" filter="url(#b10)"/>')

    # 글자 — path. <text> 도 font-family 도 남기지 않는다
    body.append(f'<g fill="{INK}">\n    {text_paths}\n  </g>')

    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
            f'width="{W}" height="{H}" role="img" aria-label="{NAME}">'
            f'<title>{NAME}</title>\n'
            f'  <defs>\n    ' + "\n    ".join(defs) + '\n  </defs>\n  '
            + "\n  ".join(body) + '\n</svg>\n')


def main():
    spec = meadow_spec()
    verify_meadow(spec)
    text_paths = bake_text()
    svg = build_svg(spec, text_paths)
    out = HERE / "header_baked.svg"
    out.write_text(svg, encoding="utf-8")
    print(f"\n{out.name}  {out.stat().st_size // 1024}KB")
    print(f"  <text> {svg.count('<text')}건 · font-family {svg.count('font-family')}건 "
          f"(둘 다 0이어야 한다)")


if __name__ == "__main__":
    main()
