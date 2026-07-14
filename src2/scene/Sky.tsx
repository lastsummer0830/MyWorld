'use client';

// 하늘 — 화면 전체를 덮는 그라디언트 배경.
//
// ★ 왜 "구(球) 돔"이 아니라 화면 공간인가:
//   직교(ortho) 카메라는 화면에 담기는 월드 범위가 오직 줌 배율로 정해진다. 지금은 약 50m 폭이다.
//   그래서 반지름 300m짜리 하늘 돔을 세워도 화면에는 그 돔의 아주 작은 한 조각만 잡히고,
//   그 조각은 전부 지평선 부근이라 위아래 색의 중간값 하나로 칠해진다 → 화면 전체가 회백색이 된다.
//   원근 카메라였다면 돔이 시야를 채웠겠지만 직교에서는 통하지 않는다.
//   → 정점 셰이더에서 클립 공간에 직접 사각형을 박아 화면을 통째로 칠한다. 카메라와 무관하게 항상 꽉 찬다.
//
// 별도 같은 이유로 월드에 뿌리면 화면에 몇 개 안 걸린다 → 셰이더에서 화면 격자로 절차 생성한다.

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { DAY, moodColor } from './palette';

// position.xy를 그대로 클립 좌표로 쓴다(투영 행렬을 거치지 않는다).
// z = 1 → 가장 먼 평면. 어떤 카메라 각도·배율에서도 화면을 정확히 덮는다.
const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 topColor;
  uniform vec3 bottomColor;
  uniform vec2 sunDir;
  uniform float night;
  uniform float time;
  uniform vec2 res;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453);
  }

  void main() {
    // 아래에서 위로 흐르는 그라디언트. exponent가 지평선 부근 띠의 두께를 정한다.
    vec3 col = mix(bottomColor, topColor, pow(clamp(vUv.y, 0.0, 1.0), 0.8));

    // 태양 — 직교 투영에는 소실점이 없어서 "하늘의 어느 점에 해가 있다"가 물리적으로 정해지지 않는다.
    // 그래서 태양이 있는 '방향' 쪽 화면 가장자리에 빛무리를 놓는다. 빛이 어디서 오는지 근거를 만드는 연출.
    vec2 p = (vUv - 0.5) * vec2(res.x / max(res.y, 1.0), 1.0);
    float d = distance(p, sunDir * 0.52);
    float day = 1.0 - night;
    col += vec3(1.0, 0.92, 0.70) * exp(-d * d * 3.2) * 0.5 * day; //  넓게 번지는 빛무리
    col += vec3(1.0, 0.97, 0.86) * smoothstep(0.07, 0.028, d) * 0.85 * day; //  해 원반

    // 별 — 화면을 격자로 쪼개 칸마다 최대 하나. 밤에만 켜지고, 아래쪽(지평선)에는 적게 뿌린다.
    if (night > 0.01) {
      float aspect = res.x / max(res.y, 1.0);
      vec2 grid = vUv * vec2(64.0 * aspect, 64.0);
      vec2 id = floor(grid);
      vec2 f = fract(grid);
      float r = hash(id);
      if (r > 0.90) {
        vec2 c = vec2(hash(id + 1.7), hash(id + 3.1));
        // 개체마다 위상이 달라야 살아 있는 하늘처럼 보인다.
        float twinkle = 0.55 + 0.45 * sin(time * 1.6 + r * 40.0);
        float star = smoothstep(0.10, 0.0, distance(f, c)) * twinkle;
        star *= smoothstep(0.18, 0.62, vUv.y);
        col += vec3(1.0, 0.97, 0.87) * star * night;
      }
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function Sky({
  nightRef,
  sunDirRef,
}: {
  nightRef: React.RefObject<number>;
  sunDirRef: React.RefObject<THREE.Vector2>;
}) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const size = useThree((s) => s.size);
  const tmp = useRef(new THREE.Color());

  const uniforms = useMemo(
    () => ({
      topColor: { value: new THREE.Color(DAY.skyTop) },
      bottomColor: { value: new THREE.Color(DAY.skyBottom) },
      sunDir: { value: new THREE.Vector2(0, 1) },
      night: { value: 0 },
      time: { value: 0 },
      res: { value: new THREE.Vector2(1, 1) },
    }),
    [],
  );

  useFrame((state) => {
    const m = mat.current;
    if (!m) return;
    const night = nightRef.current;

    moodColor(tmp.current, 'skyTop', night);
    (m.uniforms.topColor.value as THREE.Color).copy(tmp.current);
    moodColor(tmp.current, 'skyBottom', night);
    (m.uniforms.bottomColor.value as THREE.Color).copy(tmp.current);

    (m.uniforms.sunDir.value as THREE.Vector2).copy(sunDirRef.current);
    m.uniforms.night.value = night;
    m.uniforms.time.value = state.clock.elapsedTime;
    (m.uniforms.res.value as THREE.Vector2).set(size.width, size.height);
  });

  return (
    // 배경이므로 깊이 판정에서 빼고 가장 먼저 그린다. frustumCulled를 꺼야 화면 밖으로 판정돼 사라지지 않는다.
    <mesh frustumCulled={false} renderOrder={-1000}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
        depthTest={false}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}
