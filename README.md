<p align="center"><img src="docs/images/header.svg?v=1786985744" width="100%" alt="MyWorld" /></p>

<br/>

# 3D 인터랙티브 포트폴리오 · 3D Interactive Portfolio

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Three.js](https://img.shields.io/badge/Three.js-r183-black?logo=three.js)](https://threejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey)](./LICENSE)

<br/>

🚧 **리메이크 진행 중인 프로젝트입니다.**

싱그러운 여름 정원 속 유리 구슬 안, 파스텔 톤의 방을 직접 탐색하며 포트폴리오를 경험하는 인터랙티브 사이트입니다.
방 안 컴퓨터에 앉으면 모니터 화면 속 **가상 갤러리**를 1인칭으로 거닐며 프로젝트를 감상할 수 있습니다.

*A portfolio you don't just read — you explore.*

---

## 🎨 Concept

| | |
|---|---|
| 무대 | ☀️ 하늘에 떠 있는 여름 정원 섬 — 땅을 도려내 온 조각 |
| 배경 | 잔디, 활엽수, 꽃밭, 연못, 큰 나무와 그네, 피크닉 |
| 색감 | 파스텔 + 밝은 오크 + 플랜테리어 |
| 동물 | 🐶 강아지 (블루멀 셸티 · 오드아이) |
| 날씨 | 여름 소나기 |
| 낮/밤 | 여름 햇살 / 반딧불이 여름밤 |

---

## ✨ Features

| 기능 | 설명 |
|------|------|
| 🏠 **3D 인터랙티브 룸** | 드래그·휠(PC) / 터치·핀치(모바일)로 방을 자유롭게 탐색 |
| 🎬 **카메라 인트로** | 접속 시 카메라가 방 안으로 부드럽게 진입하는 연출 |
| ☀️ **낮/밤 · 날씨 전환** | 여름 햇살↔여름밤, 맑음↔소나기 실시간 전환 |
| 🦋 **살아있는 정원** | 낮에는 나비, 밤에는 반딧불이가 정원을 날아다님 |
| 🖥️ **모니터 속 갤러리** | 컴퓨터 클릭 시 모니터 화면 안에서 1인칭 갤러리가 열림 (PC) |
| 🚶 **1인칭 탐험** | WASD 이동 + 마우스 시점으로 전시관을 직접 걸어다님 (PC) |
| 🖼️ **프로젝트 전시** | 벽의 작품 클릭 또는 모바일 목록에서 프로젝트 상세 확인 |
| 🏆 **숨겨진 업적** | 갤러리 곳곳에 숨은 업적을 발견하는 재미 요소 (PC) |
| 📱 **모바일 대응** | 터치 조작, 하단 탭바 네비게이션, 슬라이드업 패널 지원 |

---

## 🛠 Tech Stack

| Category | Stack |
|----------|-------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **3D Engine** | Three.js r183 + React Three Fiber |
| **3D Utilities** | React Three Drei, React Three Postprocessing |
| **Styling** | Tailwind CSS v4 |

---

## 🗂 Structure

```
src/
├── hooks/                # useIsMobile 등 공용 훅
└── components/
    ├── canvas/           # Canvas, 카메라, 씬 상태머신, 낮밤·날씨 컨텍스트
    ├── room/             # 방 — 가구/구조/장식 + portfolioData.ts (콘텐츠)
    ├── summerBackground/ # 여름 정원 유리 구슬 배경
    ├── museum/           # 모니터 속 갤러리 — 1인칭, 전시물, 업적 트리거
    ├── achievements/     # 업적 시스템
    └── ui/               # 모달, 프로젝트 패널, 네비게이션, 모바일 UI
```

> 📌 **모든 콘텐츠는 `src/components/room/portfolioData.ts` 한 곳에서 관리됩니다.**

---

## 🚀 Getting Started

```bash
npm install
npm run dev
```

> ⚠️ WebGL을 지원하는 최신 브라우저(Chrome / Firefox / Edge)에서 접속을 권장합니다.