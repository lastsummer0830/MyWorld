"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AppearGroup } from "../AnimatedWrapper";
import AnimatedWrapper from "../AnimatedWrapper";
import { MAT } from "../materials";
import { COLOR, DELAY } from "../constants";
import { POS, SIZE } from "../layout";

function createBeastTexture(): THREE.CanvasTexture {
  const size = 256;
  const cv   = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#0A0A0A"; ctx.fillRect(0,0,size,size);
  ctx.fillStyle = "#009900";
  ctx.fillRect(0,0,14,size); ctx.fillRect(size-14,0,14,size);
  ctx.strokeStyle="#00EE00"; ctx.lineWidth=13; ctx.lineCap="butt";
  [[72,28,98,188],[120,18,128,188],[168,28,142,188]].forEach(([x1,y1,x2,y2])=>{
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  });
  ctx.fillStyle="#00FF00"; ctx.font="bold 40px Impact,Arial Black"; ctx.textAlign="center";
  ctx.fillText("BEAST",size/2,220);
  ctx.fillStyle="#777"; ctx.font="bold 13px Arial";
  ctx.fillText("ENERGY DRINK",size/2,242);
  const tex = new THREE.CanvasTexture(cv);
  tex.needsUpdate = true;
  return tex;
}


function MiniFridge() {
  const [open, setOpen] = useState(false);
  const doorRef     = useRef<THREE.Group>(null!);
  const doorAngle   = useRef(0);
  const pointerDown = useRef<{x:number;y:number}|null>(null);

  // 캔 instancedMesh refs
  const canBodyRef = useRef<THREE.InstancedMesh>(null!);
  const canCapRef  = useRef<THREE.InstancedMesh>(null!);
  const beastTex   = useMemo(() => createBeastTexture(), []);

  const R = SIZE.fridge.canR, H_CAN = SIZE.fridge.canH;
  const { shelfYs, canZs, canXs } = SIZE.fridge;
  const CAN_COUNT = shelfYs.length * canZs.length * canXs.length; // 18

  // 캔 인스턴스 행렬 1회 설정
  useEffect(() => {
    if (!canBodyRef.current || !canCapRef.current) return;
    const dummy = new THREE.Object3D();
    let bi = 0, ci = 0;
    shelfYs.forEach(sy => {
      canZs.forEach(cz => {
        canXs.forEach(cx => {
          const y = sy + 0.12;
          dummy.position.set(cx, y, cz);
          dummy.scale.set(1, 1, 1);
          dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix();
          canBodyRef.current.setMatrixAt(bi++, dummy.matrix);

          // 윗면 캡
          dummy.position.set(cx, y + H_CAN / 2 + 0.004, cz);
          dummy.updateMatrix();
          canCapRef.current.setMatrixAt(ci++, dummy.matrix);
          // 아랫면 캡
          dummy.position.set(cx, y - H_CAN / 2 - 0.004, cz);
          dummy.updateMatrix();
          canCapRef.current.setMatrixAt(ci++, dummy.matrix);
        });
      });
    });
    canBodyRef.current.instanceMatrix.needsUpdate = true;
    canCapRef.current.instanceMatrix.needsUpdate  = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_,delta) => {
    if (!doorRef.current) return;
    // 힌지: -Z 끝 (벽쪽)
    // 문은 +Z 방향에서 시작해서 +X 방향으로 열림 (Y축 양수 회전)
    const target = open ? Math.PI * 0.60 : 0;
    doorAngle.current += (target - doorAngle.current) * (1 - Math.pow(0.001, delta*5));
    doorRef.current.rotation.y = doorAngle.current;
  });

  const handlePointerDown = (e:any) => { pointerDown.current={x:e.clientX,y:e.clientY}; };
  const handleClick = (e:any) => {
    if (!pointerDown.current) return;
    const dx=e.clientX-pointerDown.current.x, dy=e.clientY-pointerDown.current.y;
    pointerDown.current=null;
    if (Math.sqrt(dx*dx+dy*dy)>4) return;
    e.stopPropagation();
    setOpen(p=>!p);
  };

  const W = SIZE.fridge.w, H = SIZE.fridge.h, D = SIZE.fridge.d, T = SIZE.fridge.wallT;

  // 냉장고는 왼쪽 벽(-X)에 붙어있고 카메라는 +X,+Z에서 봄
  // 문은 +X 면에 있어야 카메라에서 보임
  // 힌지: -Z 끝, 열리면 Z축 기준 +X 방향으로 스윙

  return (
    <AnimatedWrapper
      delay={DELAY.fridge}
      position={POS.fridge}
      liftHeight={0.06}
      hitbox={[SIZE.fridge.w+0.1, SIZE.fridge.h+0.1, SIZE.fridge.d+0.1]}
      hitboxPos={[0, SIZE.fridge.h/2, 0]}
    >
      <group
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        onPointerOver={(e)=>{e.stopPropagation(); document.body.style.cursor="pointer";}}
        onPointerOut={(e)=>{e.stopPropagation(); document.body.style.cursor="default";}}
      >
        {/* 본체 5면 — 앞면(+X)만 없음 */}
        {/* 뒷면(-X, 벽쪽) */}
        <mesh position={[-W/2+T/2, H/2, 0]} castShadow>
          <boxGeometry args={[T,H,D]} />
          <meshStandardMaterial color={COLOR.fridgeBody} {...MAT.fridge} />
        </mesh>
        {/* 앞면(+X, 카메라쪽) — 없음, 문이 대신 */}
        {/* 왼쪽(-Z) */}
        <mesh position={[0, H/2, -D/2+T/2]} castShadow>
          <boxGeometry args={[W,H,T]} />
          <meshStandardMaterial color={COLOR.fridgeBody} {...MAT.fridge} />
        </mesh>
        {/* 오른쪽(+Z) */}
        <mesh position={[0, H/2, D/2-T/2]} castShadow>
          <boxGeometry args={[W,H,T]} />
          <meshStandardMaterial color={COLOR.fridgeBody} {...MAT.fridge} />
        </mesh>
        {/* 바닥 */}
        <mesh position={[0, T/2, 0]} receiveShadow castShadow>
          <boxGeometry args={[W,T,D]} />
          <meshStandardMaterial color={COLOR.fridgeBody} {...MAT.fridge} />
        </mesh>
        {/* 천장 */}
        <mesh position={[0, H-T/2, 0]} castShadow>
          <boxGeometry args={[W,T,D]} />
          <meshStandardMaterial color={COLOR.fridgeBody} {...MAT.fridge} />
        </mesh>

        {/* 내부 벽 */}
        <mesh position={[-W/2+T+0.005, H/2, 0]}>
          <boxGeometry args={[0.008, H-T*2, D-T*2]} />
          <meshStandardMaterial color="#E0EEE0" {...MAT.wall} />
        </mesh>
        <mesh position={[0, H/2, -D/2+T+0.005]}>
          <boxGeometry args={[W-T*2, H-T*2, 0.008]} />
          <meshStandardMaterial color="#E0EEE0" {...MAT.wall} />
        </mesh>
        <mesh position={[0, H/2, D/2-T-0.005]}>
          <boxGeometry args={[W-T*2, H-T*2, 0.008]} />
          <meshStandardMaterial color="#E0EEE0" {...MAT.wall} />
        </mesh>
        <mesh position={[0, T+0.005, 0]}>
          <boxGeometry args={[W-T*2, 0.008, D-T*2]} />
          <meshStandardMaterial color="#D8ECD8" {...MAT.wall} />
        </mesh>
        <mesh position={[0, H-T-0.005, 0]}>
          <boxGeometry args={[W-T*2, 0.008, D-T*2]} />
          <meshStandardMaterial color="#E0EEE0" {...MAT.wall} />
        </mesh>

        {/* 선반 */}
        {shelfYs.map((sy,i)=>(
          <mesh key={i} position={[0, sy, 0]}>
            <boxGeometry args={[W-T*2-0.01, 0.018, D-T*2-0.01]} />
            <meshStandardMaterial color="#B8D4B8" transparent opacity={0.85} roughness={0.3} />
          </mesh>
        ))}

        {/* 내부 조명 */}
        <pointLight position={[0, H*0.88, 0]} intensity={0.8} distance={1.8} color="#CCFFCC" />

        {/* 캔 — instancedMesh (2 draw call) */}
        <instancedMesh ref={canBodyRef} args={[undefined, undefined, CAN_COUNT]}>
          <cylinderGeometry args={[R, R, H_CAN, 16]} />
          <meshStandardMaterial map={beastTex} metalness={0.5} roughness={0.4} />
        </instancedMesh>
        <instancedMesh ref={canCapRef} args={[undefined, undefined, CAN_COUNT * 2]}>
          <cylinderGeometry args={[R * 0.86, R, 0.008, 16]} />
          <meshStandardMaterial color="#CCCCCC" {...MAT.metalBright} />
        </instancedMesh>


        {/* 문 — 힌지: -Z 끝, 열리면 +X(카메라)방향으로 스윙 */}
        <group ref={doorRef} position={[W/2, H/2, -D/2]}>
          {/* 문 패널 — 힌지에서 +Z 방향으로 뻗음 */}
          <mesh position={[0, 0, D/2-T/2]} castShadow>
            <boxGeometry args={[T, H-T, D-T]} />
            <meshStandardMaterial color={COLOR.fridgeBody} {...MAT.fridge} />
          </mesh>
          {/* 손잡이 */}
          {/* 손잡이 — 문 바깥면(+X)에서 앞으로 돌출 */}
          <mesh position={[T + 0.04, 0, D/2 - T - -0.35]} castShadow>
            <boxGeometry args={[0.04, 0.42, 0.04]} />
            <meshStandardMaterial color={COLOR.fridgeHandle} {...MAT.metalHandle} />
          </mesh>
        </group>

      </group>
    </AnimatedWrapper>
  );
}

export function DrawerChest() {
  const { w, h, d } = SIZE.drawer;
  return (
    <AppearGroup delay={DELAY.drawer} position={POS.drawer}>
      <group>
        <mesh position={[0, h/2, 0]} castShadow receiveShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={COLOR.drawerBody} {...MAT.drawer} />
        </mesh>
        {([h*0.25, h*0.50, h*0.75] as number[]).map((yh, i) => (
          <group key={i} position={[w/2 + 0.005, yh, 0]}>
            <mesh>
              <boxGeometry args={[0.008, 0.016, d * 0.9]} />
              <meshStandardMaterial color={COLOR.curtainFold} {...MAT.fabric} />
            </mesh>
            <mesh position={[0, -0.08, 0]}>
              <boxGeometry args={[0.04, 0.08, 0.24]} />
              <meshStandardMaterial color={COLOR.drawerHandle} {...MAT.metalHandle} />
            </mesh>
          </group>
        ))}
      </group>
    </AppearGroup>
  );
}

export default function Storage() {
  return <MiniFridge />;
}