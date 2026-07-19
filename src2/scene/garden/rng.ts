// 시드 난수 — 꽃밭·풀 포기처럼 "불규칙하지만 매번 같아야 하는" 배치에 쓴다.
// Math.random을 쓰면 리렌더마다 배치가 바뀌어 깜빡인다. 시드를 고정해 결정적으로 만든다.

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 원판 안에 고르게 흩뿌린 점들. (반경 r, 개수 n, 시드) */
export function scatterDisc(r: number, n: number, seed: number) {
  const rand = mulberry32(seed);
  const out: { x: number; z: number; a: number; s: number }[] = [];
  for (let i = 0; i < n; i++) {
    const rad = Math.sqrt(rand()) * r; //  sqrt = 중심에 뭉치지 않고 고르게
    const ang = rand() * Math.PI * 2;
    out.push({
      x: Math.cos(ang) * rad,
      z: Math.sin(ang) * rad,
      a: rand() * Math.PI * 2, //  각 요소의 회전
      s: 0.7 + rand() * 0.6, //  스케일 변주
    });
  }
  return out;
}
