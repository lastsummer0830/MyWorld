// 강아지의 두뇌 — 어디로 갈지, 무엇을 할지를 정하고 몸의 자세를 매 프레임 내준다.
//
// ★ 왜 컴포넌트에서 떼어 냈나:
//   "행동"과 "생김새"는 바뀌는 이유가 다르다. 걷는 속도를 고치려고 귀 모양 코드를 뒤지게 되면
//   둘 다 손대기 무서워진다. 여기는 순수 계산만 있고 THREE 오브젝트를 만들지 않는다.
//
// ★ 좌표계 약속: 모델은 **+x를 바라본다.** rotation.y = yaw를 주면 실제로 향하는 방향은
//   (cos yaw, 0, −sin yaw)다. 목표 방향 (dx, dz)에 대한 yaw는 atan2(−dz, dx).
//   이 부호를 틀리면 강아지가 목표를 등지고 뒷걸음질친다.

import * as THREE from 'three';
import { ISLAND_R } from '../constants';
import { GARDEN, bedAt } from './layout';
import { mulberry32 } from './rng';
import { nearestButterfly } from './butterflySwarm';

const TAU = Math.PI * 2;

/** 강아지가 지금 하는 일. */
export type DogState =
  | 'idle' //  가만히 서서 두리번
  | 'walk' //  목적지까지 걸어간다
  | 'chase' //  나비를 쫓아 뛴다
  | 'drink' //  연못가에서 물을 마신다
  | 'roll' //  배를 뒤집고 등을 비빈다
  | 'sit' //  앉아서 쉰다
  | 'toBed' //  잠자리로 걸어간다
  | 'sleep'; //  엎드려 잔다

/** 몸의 자세. Dog 컴포넌트는 이 값을 관절에 그대로 꽂기만 한다. */
export type DogPose = {
  x: number;
  z: number;
  yaw: number;
  state: DogState;
  /** 보행 위상(rad). 다리 스윙에 쓴다. */
  gait: number;
  /** 현재 속도 m/s — 다리 스윙 폭과 몸통 흔들림이 여기 비례한다. */
  speed: number;
  /** 고개 숙임(+아래) rad */
  headPitch: number;
  /** 고개 돌림 rad */
  headYaw: number;
  /** 꼬리 흔드는 세기 0~1 */
  tailWag: number;
  /** 0 = 서 있음, 1 = 완전히 엎드림 */
  lie: number;
  /** 배 뒤집기 0~1 (1이면 등이 바닥) */
  bellyUp: number;
};

// ── 정원 안에서 갈 수 있는 곳 ────────────────────────────────────
/** 강아지가 돌아다니는 최대 반경. 섬 끝까지 가면 허공에 발을 딛는 것처럼 보인다. */
const ROAM_R = ISLAND_R * 0.84;

/** 못 들어가는 곳 — 물속과 구조물 발밑. */
const BLOCKED: { x: number; z: number; r: number }[] = [
  { x: GARDEN.pond.pos[0], z: GARDEN.pond.pos[1], r: 6.0 },
  { x: GARDEN.house.pos[0], z: GARDEN.house.pos[1], r: 4.2 },
  { x: GARDEN.pergola.pos[0], z: GARDEN.pergola.pos[1], r: 2.4 },
  { x: GARDEN.teaTable.pos[0], z: GARDEN.teaTable.pos[1], r: 2.2 },
];

const blocked = (x: number, z: number) =>
  BLOCKED.some((b) => (x - b.x) ** 2 + (z - b.z) ** 2 < b.r * b.r);

/** 잠자리 — 집 앞 처마 밑. 밤이 되면 여기로 걸어와 엎드린다. */
const BED_SPOT: [number, number] = [
  GARDEN.house.pos[0] + 3.4,
  GARDEN.house.pos[1] + 3.2,
];

/** 물 마시는 자리 — 연못 가장자리. 물속으로는 들어가지 않는다. */
function drinkSpot(rand: () => number): [number, number] {
  const a = rand() * TAU;
  const r = 6.3; //  BLOCKED의 연못 반경 바로 바깥
  return [GARDEN.pond.pos[0] + Math.cos(a) * r, GARDEN.pond.pos[1] + Math.sin(a) * r];
}

/**
 * 돌아다닐 자리 하나. **잔디 위주로** 고른다 —
 * 화단 한복판을 가로지르면 꽃을 밟고 지나가는 것처럼 보인다(그리고 몸이 풀에 묻힌다).
 */
function roamPoint(rand: () => number): [number, number] {
  for (let i = 0; i < 40; i++) {
    const a = rand() * TAU;
    const r = Math.sqrt(rand()) * ROAM_R;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (bedAt(x, z).core > 0.3) continue;
    if (blocked(x, z)) continue;
    return [x, z];
  }
  return [0, 0];
}

/** 각도 보간 — ±π를 넘어갈 때 반대로 도는 것을 막는다. */
function turnToward(cur: number, goal: number, maxStep: number) {
  let d = ((goal - cur + Math.PI) % TAU) - Math.PI;
  if (d < -Math.PI) d += TAU;
  return cur + Math.max(-maxStep, Math.min(maxStep, d));
}

const WALK_SPEED = 1.15;
const CHASE_SPEED = 2.9;

export class DogBrain {
  readonly pose: DogPose = {
    x: GARDEN.dog.pos[0],
    z: GARDEN.dog.pos[1],
    yaw: GARDEN.dog.rotY ?? 0,
    state: 'idle',
    gait: 0,
    speed: 0,
    headPitch: 0,
    headYaw: 0,
    tailWag: 0.5,
    lie: 0,
    bellyUp: 0,
  };

  private rand = mulberry32(20260801);
  private target: [number, number] = [GARDEN.dog.pos[0], GARDEN.dog.pos[1]];
  /** 지금 상태를 얼마나 더 유지할지(초). 0 이하가 되면 다음 행동을 고른다. */
  private hold = 1.5;
  /** 쫓고 있는 나비. 매 프레임 위치가 바뀌므로 참조로 들고 있는다. */
  private prey: THREE.Vector3 | null = null;

  /** 낮에 할 일을 하나 고른다. 가중치는 "정원에서 개가 실제로 뭘 하고 있나"의 비율에 가깝게. */
  private pickDaytime() {
    const p = this.pose;
    const roll = this.rand();

    // 나비가 근처에 있으면 우선 쫓는다 — 개는 움직이는 걸 못 참는다.
    const prey = nearestButterfly(p.x, p.z, 13);
    if (prey && roll < 0.3) {
      this.prey = prey;
      p.state = 'chase';
      this.hold = 4 + this.rand() * 4;
      return;
    }
    this.prey = null;

    if (roll < 0.42) {
      this.target = roamPoint(this.rand);
      p.state = 'walk';
      this.hold = 14; //  못 닿아도 이 시간이 지나면 다른 걸 한다(끼임 방지)
    } else if (roll < 0.56) {
      this.target = drinkSpot(this.rand);
      p.state = 'walk'; //  일단 물가로 걸어간 뒤 도착하면 drink로 넘어간다
      this.hold = 14;
      this.thenDrink = true;
    } else if (roll < 0.68) {
      p.state = 'roll';
      this.hold = 4.5 + this.rand() * 2.5;
    } else if (roll < 0.84) {
      p.state = 'sit';
      this.hold = 4 + this.rand() * 6;
    } else {
      p.state = 'idle';
      this.hold = 2 + this.rand() * 3;
    }
  }

  private thenDrink = false;

  update(dt: number, night: number) {
    const p = this.pose;
    const sleepy = night > 0.55;

    // ── 상태 전환 ────────────────────────────────────────────
    if (sleepy && p.state !== 'sleep' && p.state !== 'toBed') {
      // 밤이 오면 하던 걸 멈추고 잠자리로.
      this.target = BED_SPOT;
      p.state = 'toBed';
      this.hold = 40;
      this.thenDrink = false;
      this.prey = null;
    } else if (!sleepy && (p.state === 'sleep' || p.state === 'toBed')) {
      p.state = 'idle'; //  아침 — 일어나서 기지개
      this.hold = 2.5;
    } else {
      this.hold -= dt;
      if (this.hold <= 0 && !sleepy) this.pickDaytime();
    }

    // ── 목적지 ───────────────────────────────────────────────
    let tx = this.target[0];
    let tz = this.target[1];
    if (p.state === 'chase' && this.prey) {
      tx = this.prey.x;
      tz = this.prey.z;
      // 나비가 물 위나 화단으로 가면 따라 들어가지 않고 가장자리에서 맴돈다.
      if (blocked(tx, tz)) {
        const d = Math.hypot(tx - p.x, tz - p.z) || 1;
        tx = p.x + ((tx - p.x) / d) * 0.5;
        tz = p.z + ((tz - p.z) / d) * 0.5;
      }
    }

    const dx = tx - p.x;
    const dz = tz - p.z;
    const dist = Math.hypot(dx, dz);

    // ── 이동 ─────────────────────────────────────────────────
    const moving = p.state === 'walk' || p.state === 'chase' || p.state === 'toBed';
    const arrive = p.state === 'chase' ? 1.1 : 0.45;

    if (moving && dist > arrive) {
      // ★ +x를 바라보는 모델이라 yaw = atan2(−dz, dx).
      const goalYaw = Math.atan2(-dz, dx);
      p.yaw = turnToward(p.yaw, goalYaw, (p.state === 'chase' ? 4.2 : 2.6) * dt);

      const want = p.state === 'chase' ? CHASE_SPEED : WALK_SPEED;
      // 방향이 많이 어긋나 있으면 속도를 줄인다 — 안 그러면 게처럼 옆으로 미끄러진다.
      const align = Math.max(0, Math.cos(goalYaw - p.yaw));
      p.speed = THREE.MathUtils.lerp(p.speed, want * (0.3 + 0.7 * align), 3.5 * dt);

      p.x += Math.cos(p.yaw) * p.speed * dt;
      p.z += -Math.sin(p.yaw) * p.speed * dt;
      p.gait += p.speed * dt * 3.4;
    } else {
      p.speed = THREE.MathUtils.lerp(p.speed, 0, 6 * dt);
      p.gait += p.speed * dt * 3.4;

      // 도착 처리
      if (moving && dist <= arrive) {
        if (p.state === 'toBed') {
          p.state = 'sleep';
          this.hold = 999;
        } else if (this.thenDrink) {
          this.thenDrink = false;
          p.state = 'drink';
          this.hold = 5 + this.rand() * 3;
        } else if (p.state !== 'chase') {
          p.state = 'idle';
          this.hold = 1.5 + this.rand() * 2.5;
        }
      }
    }

    // 섬 밖으로 나가지 않게 — 목적지 로직이 실패해도 여기서 붙잡는다.
    const rr = Math.hypot(p.x, p.z);
    if (rr > ROAM_R) {
      p.x = (p.x / rr) * ROAM_R;
      p.z = (p.z / rr) * ROAM_R;
    }

    // ── 자세 ─────────────────────────────────────────────────
    const to = (cur: number, goal: number, rate: number) =>
      THREE.MathUtils.lerp(cur, goal, Math.min(1, rate * dt));

    switch (p.state) {
      case 'drink':
        // 고개를 깊이 숙이고 혀로 찰박찰박 — 위아래로 작게 흔든다.
        p.headPitch = to(p.headPitch, 0.95 + Math.sin(p.gait * 0 + performanceNow() * 7) * 0.06, 5);
        p.tailWag = to(p.tailWag, 0.35, 3);
        p.lie = to(p.lie, 0, 5);
        p.bellyUp = to(p.bellyUp, 0, 6);
        break;
      case 'roll':
        // 등을 대고 뒹군다. 몸이 뒤집히는 동안 고개는 뒤로 젖혀진다.
        p.bellyUp = to(p.bellyUp, 1, 2.4);
        p.lie = to(p.lie, 1, 2.4);
        p.headPitch = to(p.headPitch, -0.5, 3);
        p.tailWag = to(p.tailWag, 0.9, 3);
        break;
      case 'sit':
        p.lie = to(p.lie, 0.45, 2.5); //  뒷다리만 접는다
        p.bellyUp = to(p.bellyUp, 0, 5);
        p.headPitch = to(p.headPitch, -0.08, 3);
        p.tailWag = to(p.tailWag, 0.5, 3);
        break;
      case 'sleep':
        p.lie = to(p.lie, 1, 1.2);
        p.bellyUp = to(p.bellyUp, 0, 3);
        p.headPitch = to(p.headPitch, 0.55, 1.5); //  앞발에 턱을 괸다
        p.tailWag = to(p.tailWag, 0.04, 1.5);
        break;
      case 'chase':
        p.lie = to(p.lie, 0, 6);
        p.bellyUp = to(p.bellyUp, 0, 6);
        p.headPitch = to(p.headPitch, -0.3, 5); //  나비를 올려다본다
        p.tailWag = to(p.tailWag, 1, 5);
        break;
      default:
        p.lie = to(p.lie, 0, 4);
        p.bellyUp = to(p.bellyUp, 0, 5);
        p.headPitch = to(p.headPitch, 0, 3);
        p.tailWag = to(p.tailWag, moving ? 0.75 : 0.5, 3);
    }

    // 쫓을 때는 나비 쪽으로 고개를 돌린다 — 몸보다 머리가 먼저 향해야 살아 있어 보인다.
    if (p.state === 'chase' && this.prey) {
      const goalYaw = Math.atan2(-(this.prey.z - p.z), this.prey.x - p.x);
      let d = ((goalYaw - p.yaw + Math.PI) % TAU) - Math.PI;
      if (d < -Math.PI) d += TAU;
      p.headYaw = to(p.headYaw, Math.max(-0.7, Math.min(0.7, d)), 6);
    } else {
      p.headYaw = to(p.headYaw, 0, 3);
    }

    return p;
  }
}

/** 물 마실 때의 찰박임에만 쓰는 시계. Date.now는 프레임마다 부르기 아까워 성능 타이머를 쓴다. */
const performanceNow = () =>
  (typeof performance !== 'undefined' ? performance.now() : 0) / 1000;
