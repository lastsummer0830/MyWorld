'use client';

// 꿈같은 하늘 — 씬을 통째로 감싸는 그라디언트 돔.
// 배경을 단색으로 두면 "검은 허공에 뜬 물체"가 된다. 위아래로 색이 흐르는 돔이 있어야 공간이 넓어 보인다.
// 밤에는 같은 돔 위에 별이 떠오른다(낮에는 완전히 투명).

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { moodColor } from './palette';

const VERT = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// 높이(y)를 0~1로 눌러 두 색을 섞는다. exponent가 지평선 부근의 띠 두께를 정한다.
const FRAG = /* glsl */ `
  uniform vec3 topColor;
  uniform vec3 bottomColor;
  uniform float radius;
  varying vec3 vWorld;
  void main() {
    float h = clamp(vWorld.y / radius, -1.0, 1.0) * 0.5 + 0.5;
    gl_FragColor = vec4(mix(bottomColor, topColor, pow(h, 0.85)), 1.0);
  }
`;

const RADIUS = 220;
const STAR_COUNT = 420;

export default function Sky({ nightRef }: { nightRef: React.RefObject<number> }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const stars = useRef<THREE.Points>(null);
  const tmp = useRef(new THREE.Color());

  const uniforms = useMemo(
    () => ({
      topColor: { value: new THREE.Color('#79C4EE') },
      bottomColor: { value: new THREE.Color('#FFE7CF') },
      radius: { value: RADIUS },
    }),
    [],
  );

  // 별 좌표 — 돔 안쪽 위 반구에만 뿌린다. 매 프레임 재생성하지 않도록 한 번만 만든다.
  const starGeo = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3);
    let seed = 424242;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (let i = 0; i < STAR_COUNT; i++) {
      const a = rand() * Math.PI * 2;
      const y = 0.12 + rand() * 0.85;
      const r = Math.sqrt(1 - y * y) * RADIUS * 0.92;
      pos.set([Math.cos(a) * r, y * RADIUS * 0.92, Math.sin(a) * r], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame(() => {
    const night = nightRef.current;

    if (mat.current) {
      moodColor(tmp.current, 'skyTop', night);
      (mat.current.uniforms.topColor.value as THREE.Color).copy(tmp.current);
      moodColor(tmp.current, 'skyBottom', night);
      (mat.current.uniforms.bottomColor.value as THREE.Color).copy(tmp.current);
    }
    if (stars.current) {
      // 낮에는 완전히 사라지고, 밤이 깊어질수록 또렷해진다.
      (stars.current.material as THREE.PointsMaterial).opacity = Math.max(0, night * 1.15 - 0.15);
    }
  });

  return (
    <group>
      <mesh>
        <sphereGeometry args={[RADIUS, 32, 24]} />
        <shaderMaterial
          ref={mat}
          uniforms={uniforms}
          vertexShader={VERT}
          fragmentShader={FRAG}
          side={THREE.BackSide}
          depthWrite={false}
          fog={false}
        />
      </mesh>

      <points ref={stars} geometry={starGeo}>
        <pointsMaterial size={1.5} color="#FFF6E0" transparent opacity={0} sizeAttenuation depthWrite={false} />
      </points>
    </group>
  );
}
