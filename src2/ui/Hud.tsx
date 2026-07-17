'use client';

// 씬 위 UI. 3D 세계 위에 얹힌 웹 버튼이 아니라, 그 세계의 유리 조각처럼 보이는 것이 목표.
// 낮/밤 상태를 함께 받아 UI 톤도 같이 넘어간다 (밤 = 어두운 유리 + 반딧불이색 발광).

import './hud.css';

export type NavKey = 'about' | 'projects' | 'skills' | 'contact';

const NAV: { key: NavKey; label: string; sub: string }[] = [
  { key: 'about', label: 'About', sub: '조아진이라는 사람' },
  { key: 'projects', label: 'Projects', sub: '만든 것들' },
  { key: 'skills', label: 'Skills', sub: '다룰 수 있는 것' },
  { key: 'contact', label: 'Contact', sub: '연락하기' },
];

export default function Hud({
  isNight,
  onToggleNight,
  onNav,
  children,
}: {
  isNight: boolean;
  onToggleNight: () => void;
  onNav: (key: NavKey) => void;
  /** 열린 패널이 들어오는 자리 — 낮/밤 토큰을 상속받으려면 `.hud` 안이어야 한다. */
  children?: React.ReactNode;
}) {
  return (
    <div className={`hud${isNight ? ' is-night' : ''}`}>
      <nav className="hud-nav">
        {NAV.map((item) => (
          <button key={item.key} className="hud-item" onClick={() => onNav(item.key)}>
            {item.label}
            <span className="sub">{item.sub}</span>
          </button>
        ))}
      </nav>

      <button
        className="hud-mood"
        onClick={onToggleNight}
        aria-label={isNight ? '낮으로 바꾸기' : '밤으로 바꾸기'}
      >
        <span className="hud-knob">{isNight ? '🌙' : '☀️'}</span>
      </button>

      <div className="hud-hint">드래그로 둘러보기 · 휠로 확대 · 클릭해서 들어가기</div>

      {children}
    </div>
  );
}
