'use client';

// HUD 네비를 눌렀을 때 열리는 내용 패널 (About / Projects / Skills / Contact).
//
// ★ 내용은 전부 `@iso/content/portfolioData` 한 곳에서 온다. 여기에 문장을 적지 말 것.
// ★ REBUILD_PLAN 단계 6의 최종형은 "티테이블 맥북 화면에 렌더"다. 이건 그 전에
//   내용을 눈으로 확인하기 위한 판이라, 단계 6에서 맥북으로 옮겨갈 수 있다.
// ★ 낮/밤 토큰(--glass/--edge/--ink)은 hud.css의 `.hud`/`.hud.is-night`에서 상속받는다
//   → 이 컴포넌트는 반드시 .hud 엘리먼트 **안에** 렌더돼야 한다.

import { useEffect } from 'react';
import {
  ABOUT_DATA,
  SKILLS_DATA,
  PROJECTS_DATA,
  CONTACT_DATA,
} from '@iso/content/portfolioData';
import type { NavKey } from './Hud';
import './panel.css';

const TITLES: Record<NavKey, string> = {
  about: 'About Me',
  projects: 'Projects',
  skills: 'Skills',
  contact: 'Contact',
};

/**
 * 기술 뱃지 로고. simpleicons에 **실제로 있는 것만** 넣는다.
 * (없는 슬러그를 적으면 404가 나고 onError로 조용히 숨겨져 디버깅만 어려워진다.
 *  Oracle · MyBatis · JPA · Servlet/JSP · AWS EC2 는 아이콘이 없어 글자만 나온다 — 정상.)
 */
const SKILL_ICON: Record<string, { slug: string; color: string }> = {
  HTML5: { slug: 'html5', color: 'E34F26' },
  CSS3: { slug: 'css3', color: '1572B6' },
  JavaScript: { slug: 'javascript', color: 'F7DF1E' },
  TypeScript: { slug: 'typescript', color: '3178C6' },
  jQuery: { slug: 'jquery', color: '0769AD' },
  Java: { slug: 'openjdk', color: '7F7F7F' },
  Spring: { slug: 'spring', color: '6DB33F' },
  'Spring Boot': { slug: 'springboot', color: '6DB33F' },
  MySQL: { slug: 'mysql', color: '4479A1' },
  Git: { slug: 'git', color: 'F05032' },
  Maven: { slug: 'apachemaven', color: 'C71A36' },
  Gradle: { slug: 'gradle', color: '7F7F7F' },
  Tomcat: { slug: 'apachetomcat', color: 'D8A400' },
  Docker: { slug: 'docker', color: '2496ED' },
};

function SkillTag({ name }: { name: string }) {
  const icon = SKILL_ICON[name];
  return (
    <span className="panel-tag">
      {icon && (
        <img
          src={`https://cdn.simpleicons.org/${icon.slug}/${icon.color}`}
          alt=""
          width={13}
          height={13}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
      {name}
    </span>
  );
}

type Row = { school: string; major: string; period: string };

/** 학력·교육처럼 "이름 / 부제 / 기간" 세 칸짜리 줄 목록. 비어 있으면 섹션째 숨긴다. */
function Timeline({ label, rows }: { label: string; rows: Row[] }) {
  if (rows.length === 0) return null;
  return (
    <>
      <p className="panel-label">{label}</p>
      {rows.map((r, i) => (
        <div className="panel-row" key={i}>
          <span>
            <span className="k">{r.school}</span>
            {/* major가 없는 줄(고등학교 등)에 빈 칸이 생기지 않게 한다. */}
            {r.major && (
              <>
                <br />
                <span className="sub">{r.major}</span>
              </>
            )}
          </span>
          <span className="v">{r.period}</span>
        </div>
      ))}
    </>
  );
}

function About() {
  const initials = ABOUT_DATA.name.slice(0, 2);
  return (
    <>
      <div className="panel-head">
        <div className="panel-avatar">
          {ABOUT_DATA.avatar ? (
            <img
              src={ABOUT_DATA.avatar}
              alt=""
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            initials
          )}
        </div>
        <div>
          <p className="panel-name">{ABOUT_DATA.name}</p>
          <p className="panel-role">{ABOUT_DATA.role}</p>
          <p className="panel-tagline">{ABOUT_DATA.tagline}</p>
        </div>
      </div>

      <p className="panel-body">{ABOUT_DATA.intro}</p>

      {/* 학력(정규 과정)과 교육(학원 수료)은 성격이 달라 섹션을 나눈다. */}
      <Timeline label="학력" rows={ABOUT_DATA.education} />
      <Timeline label="교육" rows={ABOUT_DATA.training} />

      {ABOUT_DATA.ps.length > 0 && (
        <p className="panel-note">{ABOUT_DATA.ps.map((p) => `✦ ${p}`).join('\n')}</p>
      )}
    </>
  );
}

function Skills() {
  return (
    <>
      {SKILLS_DATA.map((group) => (
        <div key={group.category}>
          <p className="panel-label">{group.category}</p>
          <div className="panel-tags">
            {group.items.map((s) => (
              <SkillTag key={s} name={s} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function Projects() {
  return (
    <>
      {PROJECTS_DATA.map((p) => (
        <div className="panel-card" key={p.title}>
          <h4>
            {p.title}
            <span className="panel-badge">
              {p.status === 'completed' ? '완료' : '진행 중'}
            </span>
          </h4>
          <p>{p.summary}</p>
          {p.github && (
            <a className="panel-link" href={p.github} target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
          )}
          {p.link && (
            <a className="panel-link" href={p.link} target="_blank" rel="noreferrer">
              사이트 ↗
            </a>
          )}
        </div>
      ))}
      <p className="panel-note">
        ※ 갤러리(전시 방식)는 개편 중입니다 — REBUILD_PLAN 단계 6에서 티테이블 맥북으로 들어갑니다.
      </p>
    </>
  );
}

function Contact() {
  const links = [
    { label: 'Email', value: CONTACT_DATA.email, href: `mailto:${CONTACT_DATA.email}` },
    { label: 'GitHub', value: CONTACT_DATA.github, href: CONTACT_DATA.github },
    { label: 'Phone', value: CONTACT_DATA.phone, href: `tel:${CONTACT_DATA.phone}` },
    { label: 'LinkedIn', value: CONTACT_DATA.linkedin, href: CONTACT_DATA.linkedin },
  ].filter((l) => !!l.value);

  return (
    <>
      {links.map((l) => (
        <div className="panel-row" key={l.label}>
          <span className="k">{l.label}</span>
          <a className="panel-link" href={l.href} target="_blank" rel="noreferrer">
            {l.value}
          </a>
        </div>
      ))}
    </>
  );
}

export default function Panel({ view, onClose }: { view: NavKey; onClose: () => void }) {
  // ESC로 닫기 — 3D 씬 위에 뜨는 판이라 바깥 클릭만으로는 닫는 법을 찾기 어렵다.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="panel-veil" onClick={onClose}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <button className="panel-close" onClick={onClose} aria-label="닫기">
          ✕
        </button>
        <p className="panel-title">{TITLES[view]}</p>
        {view === 'about' && <About />}
        {view === 'skills' && <Skills />}
        {view === 'projects' && <Projects />}
        {view === 'contact' && <Contact />}
      </div>
    </div>
  );
}
