'use client';

// 강아지 — 정원의 주인공. 조아진의 실제 반려견(블루멀 셸티 · 오드아이)을 사진 보고 만든다.
//
// ★★ 2026-08-01 전면 재작성. 예전 버전이 "아이클레이"로 보인 이유는 두 가지였다:
//   ① **색이 틀렸다.** 크림색 몸 + 회청색 등으로 칠해 놨는데, 실제로는 **흰색이 주조색**이고
//      등판만 은회색+검은 얼룩, 얼굴은 검정 바탕에 탄 포인트 + 흰 블레이즈다.
//   ② **전부 매끈한 구/캡슐이었다.** 셸티의 인상은 **털**에서 온다 — 가슴 러프가 몸통보다 넓게
//      퍼지고, 꼬리가 플룸으로 부풀고, 다리 뒤에 페더링이 늘어진다. 매끈한 덩어리를 아무리
//      잘 배치해도 점토 인형이 된다. 그래서 털은 **뾰족한 카드(콘)를 방사로 심어서** 만든다.
//
// ★ 관절 구조: 다리 4개·머리·꼬리를 각각 group으로 두고 dogBrain이 내주는 자세를 꽂는다.
//   (예전엔 통짜라 걷지도 눕지도 못했다.)
//
// 몸은 +x를 향한다. 월드 배치·회전은 이 컴포넌트가 직접 한다(두뇌가 좌표를 갖고 있으므로).

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MAT } from '../materials';
import { DogBrain } from './dogBrain';

const white = () => MAT('matte', 'dogWhite');
const silver = () => MAT('matte', 'dogSilver');
const merle = () => MAT('matte', 'dogMerle');
const coal = () => MAT('matte', 'dogCharcoal');
const tan = () => MAT('matte', 'dogTan');
const ink = () => MAT('glossy', 'dogInk');

/**
 * 털 뭉치 — **둥근 덩어리 몇 개를 겹치고, 아래 가장자리에만 처진 끝을 단다.**
 *
 * ★★ 실패한 방법을 기록해 둔다(2026-08-01, 두 번 시도했다):
 *    콘을 구면에 방사로 심어 "털 가닥"을 만들려 했다. 결과는 **폭죽 터진 별**이었다.
 *    코어 구를 넣고 가닥을 굵고 짧게 줄여도 마찬가지 — 가슴털이 별이 되어 개를 삼켰다.
 *    이유는 분명하다: 털은 **사방으로 뻗지 않는다.** 중력과 몸을 따라 **한 방향으로 눕는다.**
 *    방사 배치는 그 방향성을 정면으로 부정하는 문법이라, 값을 어떻게 만져도 고슴도치가 된다.
 *    → 부피는 겹친 덩어리로 만들고, "털"의 인상은 **아래로 처지는 끝자락**에만 맡긴다.
 *
 * @param r 다발의 반경
 * @param tips 아랫자락에 달 처진 끝의 개수
 */
function furGeometry(r: number, tips: number) {
  const geos: THREE.BufferGeometry[] = [];

  // ── 부피: 조금씩 어긋나게 겹친 납작한 덩어리 셋
  const lumps: [number, number, number, number][] = [
    [0, 0, 0, 1.0],
    [r * 0.3, -r * 0.2, 0, 0.78],
    [-r * 0.26, -r * 0.12, 0, 0.72],
  ];
  for (const [x, y, z, s] of lumps) {
    const g = new THREE.SphereGeometry(r * s, 12, 10);
    g.scale(1, 0.92, 0.95);
    g.translate(x, y, z);
    geos.push(g);
  }

  // ── 인상: 아래쪽 가장자리를 따라 처진 털끝. 위쪽에는 달지 않는다(위로 솟으면 가시가 된다).
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const dir = new THREE.Vector3();

  for (let i = 0; i < tips; i++) {
    const a = (i / tips) * Math.PI * 2;
    dir.set(Math.cos(a) * 0.55, -1, Math.sin(a) * 0.55).normalize(); //  아래로 처진다
    const l = r * (0.55 + ((i * 0.618) % 1) * 0.4);
    const g = new THREE.ConeGeometry(l * 0.42, l, 4);
    g.translate(0, -l * 0.42, 0); //  뾰족한 끝이 아래를 향하게
    q.setFromUnitVectors(up, dir.clone().negate());
    m.compose(dir.clone().multiplyScalar(r * 0.6), q, new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(m);
    geos.push(g);
  }

  // 가닥을 한 지오메트리로 합친다 — mesh 하나면 드로우콜도 하나다.
  const merged = new THREE.BufferGeometry();
  const pos: number[] = [];
  for (const g of geos) {
    const p = g.getAttribute('position');
    const idx = g.getIndex();
    // 인덱스가 있으면 풀어서 넣고, 없으면 정점을 그대로 넣는다(구는 인덱스가 있고 콘도 있다).
    if (idx) {
      for (let i = 0; i < idx.count; i++) {
        const v = idx.getX(i);
        pos.push(p.getX(v), p.getY(v), p.getZ(v));
      }
    } else {
      for (let i = 0; i < p.count; i++) pos.push(p.getX(i), p.getY(i), p.getZ(i));
    }
    g.dispose();
  }
  merged.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  merged.computeVertexNormals();
  return merged;
}

/** 다리 하나 — 앞다리는 곧고, 뒷다리는 무릎이 뒤로 꺾인다. */
function Leg({
  front,
  side,
  legRef,
}: {
  front: boolean;
  side: 1 | -1;
  legRef: React.RefObject<THREE.Group | null>;
}) {
  return (
    <group ref={legRef} position={[front ? 0.26 : -0.24, 0.36, 0.11 * side]}>
      {/* 허벅지~정강이 */}
      <mesh position={[0, -0.16, 0]} material={white()} castShadow>
        <capsuleGeometry args={[0.042, 0.2, 3, 7]} />
      </mesh>
      {/* 발 */}
      <mesh position={[0.015, -0.31, 0]} material={white()} castShadow>
        <sphereGeometry args={[0.052, 8, 6]} />
      </mesh>
      {/* 페더링 — 뒷면에 늘어진 털. 셸티 다리의 인상은 이것이다. */}
      <mesh position={[-0.045, -0.14, 0]} rotation={[0, 0, 0.25]} material={white()} castShadow>
        <coneGeometry args={[0.045, 0.2, 4]} />
      </mesh>
    </group>
  );
}

export default function Dog() {
  const brain = useMemo(() => new DogBrain(), []);
  // 러프는 크게. 셸티의 실루엣은 "머리보다 넓은 흰 가슴털"에서 온다.
  const ruffGeo = useMemo(() => furGeometry(0.2, 9), []);
  const hipGeo = useMemo(() => furGeometry(0.14, 6), []);

  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  // ★ 배열에 담아 legs[i]로 넘기면 lint가 "렌더 중 ref 접근"으로 잡는다(배열 인덱싱도 접근이다).
  //   네 개를 따로 두고, 프레임 루프 안에서만 배열로 묶는다.
  const legFL = useRef<THREE.Group>(null);
  const legFR = useRef<THREE.Group>(null);
  const legBL = useRef<THREE.Group>(null);
  const legBR = useRef<THREE.Group>(null);

  useFrame((state, dt) => {
    // 탭 전환 후 되돌아오면 dt가 몇 초로 튄다 — 그대로 쓰면 강아지가 순간이동한다.
    const d = Math.min(dt, 0.05);
    const night = 0; //  낮/밤은 IsoStage가 재질로 몰아주므로 여기선 낮 기준(밤 연동은 아래 nightRef).
    const p = brain.update(d, nightRefValue ?? night);

    if (root.current) {
      root.current.position.set(p.x, 0, p.z);
      root.current.rotation.y = p.yaw;
    }
    if (body.current) {
      // 엎드림 = 몸을 낮추고 앞으로 살짝 눕힌다. 배 뒤집기 = x축으로 굴린다.
      body.current.position.y = -p.lie * 0.19;
      body.current.rotation.z = -p.lie * 0.06;
      body.current.rotation.x = p.bellyUp * Math.PI * 0.92;
      // 걸을 때 몸통이 좌우로 살짝 흔들린다(속도에 비례).
      body.current.rotation.y = Math.sin(p.gait) * 0.05 * Math.min(1, p.speed);
      body.current.position.x = 0;
    }
    if (head.current) {
      head.current.rotation.z = -p.headPitch; //  +z 회전이 코를 아래로 내린다
      head.current.rotation.y = p.headYaw;
    }
    if (tail.current) {
      const t = state.clock.elapsedTime;
      tail.current.rotation.y = Math.sin(t * (5 + p.tailWag * 7)) * (0.15 + p.tailWag * 0.7);
      tail.current.rotation.z = 0.9 - p.lie * 0.7; //  잘 때는 몸에 붙여 내린다
    }
    // 다리 — 대각선 두 쌍이 엇갈려 나간다(트로트 보행).
    const swing = Math.min(1, p.speed / 1.6) * 0.55;
    [legFL, legFR, legBL, legBR].forEach((ref, i) => {
      if (!ref.current) return;
      const diagonal = i === 0 || i === 3 ? 0 : Math.PI;
      // 엎드리면 다리를 접어 몸 아래로 넣는다.
      ref.current.rotation.z = Math.sin(p.gait + diagonal) * swing + p.lie * 1.15;
      ref.current.position.y = 0.36 - p.lie * 0.16;
    });
  });

  return (
    // 개요 화면에서도 강아지가 읽혀야 하므로 실제 셸티보다 조금 크게 둔다.
    <group ref={root} scale={1.35}>
      <group ref={body}>
        {/* ── 다리 4개 ── */}
        <Leg front side={1} legRef={legFL} />
        <Leg front side={-1} legRef={legFR} />
        <Leg front={false} side={1} legRef={legBL} />
        <Leg front={false} side={-1} legRef={legBR} />

        {/* ── 몸통 ── 흰 배 + 은회색 등판 */}
        <mesh position={[0.02, 0.42, 0]} rotation={[0, 0, Math.PI / 2]} material={white()} castShadow receiveShadow>
          <capsuleGeometry args={[0.145, 0.42, 5, 12]} />
        </mesh>
        {/*
          등판(saddle) — 위쪽 **좁은 띠만** 은회색.
          ★ 1차 렌더에서 scale [1.5, 0.52, 0.92]로 줬더니 옆구리까지 덮여 통째로 회색 개가 됐다.
            멀리서 보면 디테일이 아니라 **색 덩어리의 비율**만 남는다 — 흰색이 이겨야 한다.
        */}
        <mesh position={[-0.04, 0.545, 0]} scale={[1.28, 0.34, 0.66]} material={silver()} castShadow>
          <sphereGeometry args={[0.15, 16, 12]} />
        </mesh>
        {/* merle 얼룩 — 등판 위에 검은 반점 몇 개. 균일하게 뿌리면 표범이 되므로 3개만. */}
        {([
          [0.06, 0.6, 0.05, 0.055],
          [-0.12, 0.58, -0.07, 0.045],
          [-0.008, 0.585, -0.02, 0.035],
        ] as [number, number, number, number][]).map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} scale={[1.5, 0.5, 1]} material={merle()}>
            <sphereGeometry args={[r, 8, 6]} />
          </mesh>
        ))}
        {/* 엉덩이 털 */}
        <mesh geometry={hipGeo} position={[-0.24, 0.44, 0]} material={white()} castShadow />

        {/* ── 가슴 러프 ── 셸티의 상징. 몸통보다 넓게 퍼진다. */}
        <mesh geometry={ruffGeo} position={[0.26, 0.46, 0]} material={white()} castShadow />

        {/* ── 머리 ── */}
        <group ref={head} position={[0.42, 0.63, 0]}>
          {/*
            두개골 — 좁고 길다. 셸티 얼굴은 둥글지 않다.
            ★ 통째로 검정(coal)으로 칠했더니 멀리서 **검은 덩어리**가 됐다. 사진의 얼굴은
              검정이 아니라 회청색 merle이고, 그 위에 흰 블레이즈·흰 주둥이·탄 포인트가 얹힌다.
              진짜 검정은 귀와 눈두덩에만 남긴다.
          */}
          <mesh scale={[1.05, 0.95, 0.85]} material={merle()} castShadow>
            <sphereGeometry args={[0.115, 16, 14]} />
          </mesh>
          {/* 눈 주위 검정 패치 — 사진의 얼굴에서 가장 짙은 부분 */}
          {[0.055, -0.055].map((z, i) => (
            <mesh key={`k${i}`} position={[0.055, 0.0, z]} scale={[0.9, 0.85, 0.75]} material={coal()}>
              <sphereGeometry args={[0.062, 10, 8]} />
            </mesh>
          ))}
          {/* 눈두덩 탄 포인트 — 눈 위 눈썹 자리에 하나씩 */}
          {[0.062, -0.062].map((z, i) => (
            <mesh key={i} position={[0.055, 0.03, z]} scale={[1, 0.6, 0.8]} material={tan()}>
              <sphereGeometry args={[0.045, 8, 6]} />
            </mesh>
          ))}
          {/* 볼의 탄 — 귀 아래쪽 */}
          {[0.075, -0.075].map((z, i) => (
            <mesh key={`c${i}`} position={[-0.01, -0.045, z]} scale={[1.1, 0.8, 0.7]} material={tan()}>
              <sphereGeometry args={[0.05, 8, 6]} />
            </mesh>
          ))}
          {/* 흰 블레이즈 — 주둥이에서 이마로 올라가는 흰 띠. 이게 없으면 딴 개다.
              멀리서 이 흰 띠 하나가 "우리 집 개"를 만든다. 넉넉하게 준다. */}
          <mesh position={[0.072, 0.045, 0]} rotation={[0, 0, -0.32]} scale={[1, 1, 0.5]} material={white()}>
            <capsuleGeometry args={[0.045, 0.15, 3, 8]} />
          </mesh>
          {/* 주둥이 — 흰색, 가늘고 뾰족 */}
          <mesh position={[0.155, -0.025, 0]} rotation={[0, 0, -Math.PI / 2]} material={white()} castShadow>
            <coneGeometry args={[0.055, 0.19, 10]} />
          </mesh>
          {/* 턱 아래 흰 털 */}
          <mesh position={[0.075, -0.075, 0]} scale={[1.3, 0.7, 0.9]} material={white()}>
            <sphereGeometry args={[0.06, 10, 8]} />
          </mesh>
          {/* 코 */}
          <mesh position={[0.245, -0.022, 0]} material={ink()} castShadow>
            <sphereGeometry args={[0.032, 10, 8]} />
          </mesh>

          {/*
            ── 귀 ── (2026-08-01 조아진 지정)
            "머리 위에 쫑긋 서 있고 반 접혀 있다. 양쪽 귀 끝에 흰 점이 둘 다 있다."
            → 아랫절반은 검정으로 곧게 서고, 윗절반만 앞으로 꺾인다(tipped ear).
              꺾인 끝의 **흰 점**이 이 강아지의 표식이라 작게 뭉개지 말고 또렷하게 둔다.
          */}
          {[0.058, -0.058].map((z, i) => (
            <group key={`e${i}`} position={[-0.012, 0.105, z]} rotation={[i === 0 ? 0.22 : -0.22, 0, 0]}>
              {/* 곧게 선 아랫부분 */}
              <mesh position={[0, 0.045, 0]} material={coal()} castShadow>
                <coneGeometry args={[0.036, 0.09, 4]} />
              </mesh>
              {/* 앞으로 반 접힌 윗부분 */}
              <group position={[0, 0.085, 0]} rotation={[0, 0, -1.15]}>
                <mesh position={[0, 0.028, 0]} material={coal()} castShadow>
                  <coneGeometry args={[0.028, 0.058, 4]} />
                </mesh>
                {/* 귀 끝 흰 점 */}
                <mesh position={[0, 0.056, 0]} material={white()} castShadow>
                  <sphereGeometry args={[0.019, 8, 6]} />
                </mesh>
              </group>
            </group>
          ))}

          {/*
            ── 오드아이 ── (2026-08-01 조아진 지정)
            왼쪽 = 파란 눈 + 까만 동공. 오른쪽 = 검은 눈인데 **아래쪽만** 바다빛이 살짝 돈다.
            ★ 모델이 +x를 보고 +y가 위이므로 강아지의 **왼쪽은 −z**다(left = up × forward).
              여기를 헷갈리면 오드아이가 좌우 반대로 붙는다.
          */}
          {/* 왼쪽(−z) — 파란 홍채 */}
          <mesh position={[0.093, 0.012, -0.058]} material={MAT('glossy', 'eyeBlue')}>
            <sphereGeometry args={[0.024, 10, 8]} />
          </mesh>
          {/* 오른쪽(+z) — 검은 홍채 */}
          <mesh position={[0.093, 0.012, 0.058]} material={ink()}>
            <sphereGeometry args={[0.024, 10, 8]} />
          </mesh>
          {/* 오른쪽 눈 아래에만 도는 바다빛 — 홍채를 살짝 덮는 얕은 조각 */}
          <mesh position={[0.101, -0.004, 0.058]} scale={[0.5, 0.55, 1]} material={MAT('glossy', 'eyeBlue')}>
            <sphereGeometry args={[0.021, 10, 8]} />
          </mesh>
          {/* 동공 — 양쪽 다 까맣다 */}
          <mesh position={[0.11, 0.012, -0.058]} material={ink()}>
            <sphereGeometry args={[0.011, 8, 6]} />
          </mesh>
          <mesh position={[0.11, 0.014, 0.058]} material={ink()}>
            <sphereGeometry args={[0.011, 8, 6]} />
          </mesh>
        </group>

        {/*
          ── 꼬리 ── 풍성한 흰 플룸.
          ★ furGeometry(방사 가닥)를 그대로 쓰면 **폭죽 터진 별**이 된다(1·2차 렌더에서 확인).
            코어를 넣어도 마찬가지였다 — 꼬리는 공이 아니라 **휘어 올라가는 덩어리**라서,
            사방으로 뻗는 가닥 자체가 틀린 문법이다. 크기가 줄어드는 덩어리 셋을 곡선으로 쌓고
            아래로 처지는 짧은 가닥만 몇 개 붙인다.
        */}
        <group ref={tail} position={[-0.32, 0.46, 0]} rotation={[0, 0, 0.9]}>
          <mesh position={[0, 0.06, 0]} scale={[1, 1.15, 0.85]} material={white()} castShadow>
            <sphereGeometry args={[0.075, 12, 10]} />
          </mesh>
          <mesh position={[0.025, 0.17, 0]} scale={[1, 1.2, 0.85]} material={white()} castShadow>
            <sphereGeometry args={[0.068, 12, 10]} />
          </mesh>
          <mesh position={[0.075, 0.26, 0]} scale={[1, 1.1, 0.85]} material={white()} castShadow>
            <sphereGeometry args={[0.052, 10, 8]} />
          </mesh>
          {/* 아래로 처지는 털끝 — 플룸의 부스스한 아랫자락 */}
          {[0, 1, 2, 3].map((i) => (
            <mesh
              key={i}
              position={[-0.02 + i * 0.03, 0.08 + i * 0.055, 0]}
              rotation={[0, 0, 2.5 + i * 0.12]}
              material={white()}
              castShadow
            >
              <coneGeometry args={[0.035, 0.11, 4]} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

/**
 * 밤 값 — IsoStage의 Mood가 매 프레임 갱신한다.
 * ★ props로 내리지 않는 이유: Garden → Dog까지 nightRef를 뚫으면 중간 컴포넌트가 전부
 *   자기와 상관없는 값을 들고 있어야 한다. 프레임 루프끼리 주고받는 값이라 모듈 변수가 맞다
 *   (butterflySwarm과 같은 이유).
 */
let nightRefValue: number | null = null;
export const setDogNight = (v: number) => {
  nightRefValue = v;
};
