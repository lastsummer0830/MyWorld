'use client';

// 햇살 — 화면을 비스듬히 가로지르는 빛기둥과 따뜻한 빛무리.
//
// ★ 왜 방사형(god ray)이 아니라 평행 빛기둥인가:
//   직교(ortho) 카메라에는 소실점이 없다. 원근 카메라라면 태양의 평행 광선이 화면의 한 점으로 모여
//   방사형 빛살이 되지만, 직교에서는 끝까지 평행하다. 방사형으로 그리면 투영 방식과 어긋나 어색해진다.
//   → 태양 방향을 화면에 투영한 축을 따라 흐르는 **평행한 빛기둥**을 그린다.
//     카메라를 돌리면 태양의 화면상 방향이 바뀌므로 빛기둥 각도도 함께 돈다.
//
// 씬 위에 더해 그린다(가산 합성). 빛은 물체를 가리는 게 아니라 물체 위에 얹히는 것이므로
// 깊이 판정에서 빼고 맨 마지막에 그린다.

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform vec2 sunDir;   //  화면 좌표계에서 태양이 있는 방향 (정규화)
  uniform float day;     //  낮 1 ↔ 밤 0
  uniform float time;
  uniform vec2 res;
  varying vec2 vUv;

  void main() {
    // 화면 중앙을 원점으로, 가로세로 비를 보정한 좌표. 안 하면 빛기둥이 창 비율에 따라 늘어난다.
    vec2 p = (vUv - 0.5) * vec2(res.x / max(res.y, 1.0), 1.0);

    // 빛기둥의 줄무늬 — 태양 방향에 '수직'인 축을 따라 굵기가 변한다(= 광선이 서로 평행해진다).
    vec2 perp = vec2(-sunDir.y, sunDir.x);
    float t = dot(p, perp);

    // ★ 주파수가 관건이다. 낮게 잡으면(예전 6.5) 화면 전체에 굵은 띠 한두 개만 생겨 그냥 뿌연 안개로 보인다.
    //   여러 줄기로 갈라져 들어와야 "빛기둥 사이로 햇살이 든다"는 인상이 생긴다.
    //   주파수가 서로 나누어떨어지지 않는 파동 셋을 곱해 굵기가 제각각인 줄기를 만든다.
    //
    // ★ 2026-07-28 실측으로 정한 값이다. 섬이 차지하는 t의 폭이 대략 1.0이므로,
    //   갈래를 5~6개 보이게 하려면 파장이 그 안에 5개쯤 들어가야 한다(= 주파수 30 근처).
    //   9까지 낮춰 봤더니 섬 위에 파장이 1.4개만 들어가 갈래가 2개로 줄었다 — 오히려 덩어리가 된다.
    //   ※ 예전에 이 잔줄무늬가 "뿌연 안개"로 보였던 건 주파수 탓이 아니라 아래 가산 제곱 버그 탓이었다.
    //     주파수를 낮추는 방향으로 다시 가지 말 것.
    float rays = (0.5 + 0.5 * sin(t * 20.0 + time * 0.10)) *
                 (0.5 + 0.5 * sin(t * 31.4 - 1.1 + time * 0.06)) *
                 (0.6 + 0.4 * sin(t * 11.3 + 2.3 - time * 0.035));
    rays = pow(rays, 2.2); //  지수가 낮으면 줄기 사이가 안 비어 그냥 뿌연 안개가 된다.

    /**
     * ★★ 2026-07-28 교체 — 왜 "화면 전체 그라디언트"를 버리고 원뿔로 갔나.
     *
     * 예전엔 across = 0.4 + 0.6*smoothstep(side) + 태양 쪽 모서리 haze였다. 둘 다 side(태양 방향
     * 1차 함수)만 쓰는 **화면 전체 그라디언트**라 빛이 어디에도 뭉치지 않는다. 그래서 세기를 올리면
     * 덩어리가 생기는 게 아니라 화면 전체가 균일하게 뿌예질 뿐이었다 — 그게 파일 상단의
     * "함부로 올리지 말 것" 경고의 정체다. 실측 기여도가 섬 위에서 1.5/255밖에 안 됐다.
     *
     * → 레퍼런스에서 원한 건 "빛이 물체를 밝히는 것"이 아니라 **빛 자체가 화면에 보이는 덩어리로
     *   얹혀 있는 것**이다. 그러려면 중심이 있어야 한다. 태양 위치를 앵커로 잡고,
     *   거기서 씬 쪽으로 퍼져 내려오는 **원뿔**로 만든다. 원뿔 밖은 0으로 떨어지므로
     *   전체를 뿌옇게 만들지 않고도 덩어리의 세기를 크게 올릴 수 있다.
     */

    // 태양의 화면 위치 — Sky.tsx가 해 원반을 그리는 앵커(sunDir * 0.52)와 같은 값을 써야
    // 빛이 해에서 나오는 것으로 읽힌다. 이 숫자가 어긋나면 빛기둥이 엉뚱한 데서 시작한다.
    vec2 sunPos = sunDir * 0.52;
    vec2 q = p - sunPos;

    float along = -dot(q, sunDir); //  해에서 씬 쪽으로 내려온 거리
    float lateral = dot(q, perp);  //  빛줄기 축에서 옆으로 벗어난 거리

    // 원뿔 — 내려올수록 넓게 퍼진다. 폭이 일정하면 빛기둥이 아니라 그냥 띠로 보인다.
    // ★ 2026-07-28 넓히고 늘렸다(0.18+0.55 → 0.34+0.80, 사거리 0.75 → 1.15).
    //   좁으면 빛이 섬 가운데 한 군데에만 뭉쳐 "덩어리 하나"가 된다. 갈래가 섬 전체에
    //   흩어져 닿아야 자연스럽게 쬐는 것으로 읽힌다.
    float width = 0.34 + 0.80 * max(along, 0.0);
    float cone = exp(-pow(lateral / width, 2.0));
    cone *= exp(-pow(max(along, 0.0) / 1.15, 1.6)); //  멀어질수록 사그라든다
    cone *= smoothstep(-0.12, 0.10, along);         //  해 뒤쪽(하늘 바깥)으로는 안 뻗는다

    // 해 바로 앞에 뭉치는 빛 덩어리. 이게 레퍼런스에서 빨간 펜으로 표시된 그 부분이다.
    // ★ 중심을 해 자리에 두지 않고 sunDir만큼 씬 안쪽으로 밀었다. 해에 딱 붙여 놓으면
    //   덩어리가 화면 맨 위 하늘에만 얹혀서, 정작 섬 위에는 옅은 자락만 닿는다.
    // ★ 폭(0.18)을 좁게 잡는 게 중요하다. 넓히면 좌상단 수풀이 통째로 우윳빛으로 씻겨
    //   형태가 지워진다 — 그건 빛이 아니라 안개로 읽힌다.
    vec2 qh = p - (sunPos - sunDir * 0.22);
    float halo = exp(-dot(qh, qh) / (2.0 * 0.20 * 0.20));

    // 금빛. 흰빛에 가까우면 "따스한 오후"가 아니라 "밝은 아침"이 된다.
    // ★ 가산 합성이라 세 채널을 고르게 올리면 그냥 흰 안개가 된다. 파랑을 확실히 눌러야
    //   더해진 만큼 "노란 빛"으로 보인다.
    vec3 warm = vec3(1.0, 0.80, 0.44);

    // ★ 세기는 이 두 값으로만 조절한다. 원뿔 밖은 어차피 0이라 예전처럼 화면 전체가 뜨지는 않지만,
    //   덩어리 중심은 하늘의 해 빛무리(Sky.tsx) 위에 더해지므로 올릴수록 그 부근이 흰색으로 탄다.
    // ★ 배분이 이 셰이더의 핵심이다.
    //   halo(해 앞의 뭉친 덩어리)를 세게 주면 화면 가운데 빛 공 하나가 박힌다 — 처음 그렇게 만들었다가
    //   "너무 가운데만 덩어리진다"는 지적을 받았다. halo는 갈래들이 나오는 뿌리 정도로만 남기고,
    //   세기는 rays(갈래)에 싣는다. 바닥값을 0.06까지 낮춰 갈래 사이를 비워야 갈래가 갈래로 보인다.
    float a = (halo * 0.16 + cone * (0.05 + 0.95 * rays) * 0.62) * day;

    /**
     * ★★ rgb에 a를 곱하지 말 것 — 이게 "세기를 올려도 빛이 안 보이던" 진짜 원인이었다.
     *
     * (★ 이 주석 안에서 역따옴표를 쓰지 말 것 — 셰이더가 템플릿 리터럴이라 문자열이 거기서 끊긴다.
     *    끊기면 파일이 파싱에 실패하는데, dev 서버는 직전 chunk를 계속 내보내므로
     *    "컴파일 됐다는데 화면이 그대로"인 상태가 된다. 2026-07-28에 여기서 한참 헤맸다.)
     *
     * THREE.AdditiveBlending은 (blendSrc = SrcAlpha, blendDst = One)이다. 즉 화면에 실제로
     * 더해지는 값은 gl_FragColor.rgb × gl_FragColor.a다. 여기서 rgb에 a를 한 번 더 곱해
     * vec4(warm * a, a)를 내보내면 최종 기여가 **warm × a²** 이 된다.
     * a = 0.15쯤에서 0.0225로 줄어드니 화면에는 5/255도 안 얹힌다 — 2026-07-28에 실측된
     * "기여도 1.5/255"가 정확히 이 제곱 때문이었다. 계수를 올려도 제곱이라 좀처럼 안 보이고,
     * 겨우 보이기 시작할 땐 이미 해 부근이 하얗게 타 있다.
     * → 색은 그대로 내보내고 **세기는 alpha에만** 싣는다. 그래야 a가 화면 가산량과 비례한다.
     */
    gl_FragColor = vec4(warm, a);
  }
`;

export default function Sunlight({
  nightRef,
  sunDirRef,
}: {
  nightRef: React.RefObject<number>;
  sunDirRef: React.RefObject<THREE.Vector2>;
}) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const size = useThree((s) => s.size);

  const uniforms = useMemo(
    () => ({
      sunDir: { value: new THREE.Vector2(0, 1) },
      day: { value: 1 },
      time: { value: 0 },
      res: { value: new THREE.Vector2(1, 1) },
    }),
    [],
  );

  useFrame((state) => {
    const m = mat.current;
    if (!m) return;
    (m.uniforms.sunDir.value as THREE.Vector2).copy(sunDirRef.current);
    m.uniforms.day.value = 1 - nightRef.current;
    m.uniforms.time.value = state.clock.elapsedTime;
    (m.uniforms.res.value as THREE.Vector2).set(size.width, size.height);
  });

  return (
    <mesh frustumCulled={false} renderOrder={1000}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
        transparent
        blending={THREE.AdditiveBlending}
        depthTest={false}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}
