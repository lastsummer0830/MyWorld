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

    // 태양 쪽으로 얼마나 치우쳤나(화면 중앙 기준).
    float side = dot(p, sunDir);

    // 빛기둥의 줄무늬 — 태양 방향에 '수직'인 축을 따라 굵기가 변한다(= 광선이 서로 평행해진다).
    vec2 perp = vec2(-sunDir.y, sunDir.x);
    float t = dot(p, perp);

    // ★ 주파수가 관건이다. 낮게 잡으면(예전 6.5) 화면 전체에 굵은 띠 한두 개만 생겨 그냥 뿌연 안개로 보인다.
    //   여러 줄기로 갈라져 들어와야 "빛기둥 사이로 햇살이 든다"는 인상이 생긴다.
    //   주파수가 서로 나누어떨어지지 않는 파동 셋을 곱해 굵기가 제각각인 줄기를 만든다.
    float rays = (0.5 + 0.5 * sin(t * 15.0 + time * 0.10)) *
                 (0.5 + 0.5 * sin(t * 26.7 - 1.1 + time * 0.06)) *
                 (0.6 + 0.4 * sin(t * 6.3 + 2.3 - time * 0.035));
    rays = pow(rays, 2.2); //  지수가 낮으면 줄기 사이가 안 비어 그냥 뿌연 안개가 된다.

    /**
     * ★ 빛기둥은 화면을 '가로질러야' 한다.
     * 처음엔 smoothstep(-0.35, 0.9, side)로 태양 반대편에서 0이 되게 했는데,
     * 해가 화면 위쪽에 있으니 side는 사실상 화면의 세로 좌표가 되고
     * → 정작 섬이 있는 아래쪽 절반이 통째로 0이 되어 빛기둥이 하나도 안 보였다.
     * (그려지긴 했지만 이미 하얀 하늘 위에만 얹혀서 티가 안 났다.)
     * 태양 쪽이 강하되 반대편에도 40%는 남겨, 빛이 섬 위를 지나가게 한다.
     */
    float across = 0.4 + 0.6 * smoothstep(-0.75, 0.75, side);

    // 태양 쪽 모서리에 깔리는 따뜻한 안개.
    float haze = smoothstep(0.05, 0.95, side);

    // 금빛. 흰빛에 가까우면 "따스한 오후"가 아니라 "밝은 아침"이 된다.
    vec3 warm = vec3(1.0, 0.84, 0.55);
    // ★ 세기를 함부로 올리지 말 것. 이건 씬 위에 '더해지는' 빛이라 조금만 세도 화면이 하얗게 뜬다.
    float a = (rays * across * 0.30 + haze * 0.14) * day;

    gl_FragColor = vec4(warm * a, a);
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
