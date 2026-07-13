"use client";

import { useEffect, useRef, useState } from "react";
import {
  ABOUT_DATA,
  SKILLS_DATA,
  PROJECTS_DATA,
  CONTACT_DATA,
} from "@/components/room/portfolioData";
import { useIsMobile } from "@/hooks/useIsMobile";

export type ModalType = "about" | "projects" | "skills" | "contact";

interface Props {
  type:    ModalType;
  onClose: () => void;
}

const TITLES: Record<ModalType, string> = {
  about:    "ABOUT ME",
  projects: "PROJECTS",
  skills:   "SKILLS",
  contact:  "CONTACT",
};

// ── About ─────────────────────────────────────────────────────
function AboutContent() {
  const hasAvatar = !!ABOUT_DATA.avatar;
  const initials  = ABOUT_DATA.name.slice(0, 2);

  return (
    <div>
      <div style={{ display: "flex", gap: "1.4rem", alignItems: "flex-start", marginBottom: "1.6rem" }}>
        <div style={{
          width: "80px", height: "80px", borderRadius: "50%",
          flexShrink: 0, overflow: "hidden",
          border: "2px solid rgba(140,100,255,0.4)",
          background: "rgba(100,60,200,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {hasAvatar ? (
            <img src={ABOUT_DATA.avatar} alt="profile"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <span style={{ color: "#C8B0FF", fontSize: "1.4rem", fontWeight: 700 }}>{initials}</span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: "#E8E0FF", fontSize: "1.4rem", fontWeight: 700, margin: "0 0 0.3rem" }}>
            {ABOUT_DATA.name}
          </p>
          <p style={{ color: "#A090D0", fontSize: "0.82rem", letterSpacing: "0.1em", margin: "0 0 0.5rem" }}>
            {ABOUT_DATA.role}
          </p>
          <p style={{ color: "#8878C0", fontSize: "0.8rem", margin: 0 }}>{ABOUT_DATA.tagline}</p>
        </div>
      </div>

      <p style={s.body}>{ABOUT_DATA.intro}</p>

      {ABOUT_DATA.experience.length > 0 && (
        <>
          <SectionLabel>경력</SectionLabel>
          {ABOUT_DATA.experience.map((ex, i) => (
            <div key={i} style={s.timelineItem}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.25rem" }}>
                <span style={{ color: "#D0C8FF", fontWeight: 600, fontSize: "0.92rem" }}>{ex.role}</span>
                <span style={{ color: "#7868A8", fontSize: "0.75rem" }}>{ex.period}</span>
              </div>
              <p style={{ color: "#9888C8", fontSize: "0.8rem", margin: "0 0 0.3rem" }}>{ex.company}</p>
              <p style={{ color: "rgba(200,195,225,0.75)", fontSize: "0.85rem", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>{ex.desc}</p>
            </div>
          ))}
        </>
      )}

      {ABOUT_DATA.education.length > 0 && (
        <>
          <SectionLabel>학력</SectionLabel>
          {ABOUT_DATA.education.map((ed, i) => (
            <div key={i} style={s.timelineItem}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ color: "#D0C8FF", fontWeight: 600, fontSize: "0.92rem" }}>{ed.school}</span>
                <span style={{ color: "#7868A8", fontSize: "0.75rem" }}>{ed.period}</span>
              </div>
              <p style={{ color: "#9888C8", fontSize: "0.8rem", margin: "0.2rem 0 0" }}>{ed.major}</p>
            </div>
          ))}
        </>
      )}

      {ABOUT_DATA.ps.length > 0 && (
        <>
          <div style={s.divider} />
          {ABOUT_DATA.ps.map((p, i) => (
            <p key={i} style={{ ...s.body, color: "rgba(180,170,220,0.65)", fontSize: "0.82rem" }}>
              ✦ {p}
            </p>
          ))}
        </>
      )}
    </div>
  );
}

// ── Skills ────────────────────────────────────────────────────
const SKILL_META: Record<string, { slug: string; color: string }> = {
  "HTML5":      { slug: "html5",        color: "#E34F26" },
  "CSS3":       { slug: "css3",         color: "#1572B6" },
  "Tailwind":   { slug: "tailwindcss",  color: "#06B6D4" },
  "JavaScript": { slug: "javascript",   color: "#F7DF1E" },
  "TypeScript": { slug: "typescript",   color: "#3178C6" },
  "React":      { slug: "react",        color: "#61DAFB" },
  "Next.js":    { slug: "nextdotjs",    color: "#E8E0FF" },
  "Three.js":   { slug: "threedotjs",   color: "#E8E0FF" },
  "Electron":   { slug: "electron",     color: "#9FEAF9" },
  "Tauri":      { slug: "tauri",        color: "#FFC131" },
  "AWS":        { slug: "amazonwebservices", color: "#FF9900" },
  "Render":     { slug: "render",       color: "#E8E0FF" },
  "Git":        { slug: "git",          color: "#F05032" },
  "Node.js":    { slug: "nodedotjs",    color: "#5FA04E" },
  "Java":       { slug: "openjdk",      color: "#E8E0FF" },
  "Spring":     { slug: "spring",       color: "#6DB33F" },
  "MySQL":      { slug: "mysql",        color: "#4479A1" },
  "Supabase":   { slug: "supabase",     color: "#3FCF8E" },
};

function SkillBadge({ name }: { name: string }) {
  const meta = SKILL_META[name];
  const accent = meta?.color ?? "#A080FF";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.4rem",
      padding: "0.3rem 0.7rem", borderRadius: "7px",
      background: "rgba(255,255,255,0.05)",
      border: `1px solid ${accent}55`,
      fontSize: "0.8rem", color: "#E8E0FF", letterSpacing: "0.02em",
    }}>
      {meta && (
        <img
          src={`https://cdn.simpleicons.org/${meta.slug}/${meta.color.replace("#", "")}`}
          alt="" width={14} height={14}
          style={{ display: "block" }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}
      {name}
    </span>
  );
}

function SkillsContent() {
  return (
    <div>
      {SKILLS_DATA.map((group, i) => (
        <div key={i} style={{ marginBottom: "1.4rem" }}>
          <SectionLabel>{group.category}</SectionLabel>
          <div style={s.tagRow}>
            {group.items.map((skill, j) => (
              <SkillBadge key={j} name={skill} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Projects (모달용 — 박물관 진입 유도) ──────────────────────
function ProjectsContent() {
  return (
    <div style={{ textAlign: "center", padding: "2rem 0" }}>
      <p style={{ color: "rgba(200,195,225,0.7)", fontSize: "0.9rem", lineHeight: 1.7, margin: "0 0 1.6rem" }}>
        PROJECTS 표지판 또는 모니터를 클릭하면<br />갤러리를 직접 탐험할 수 있습니다.
      </p>
      <button
        onClick={() => (window as any).__enterMuseum?.()}
        style={{
          padding: "0.7rem 1.6rem", borderRadius: "999px",
          background: "rgba(100,60,200,0.3)",
          border: "1px solid rgba(140,100,255,0.5)",
          color: "#C8B0FF", fontSize: "0.85rem", fontWeight: 700,
          letterSpacing: "0.08em", cursor: "pointer",
        }}
      >
        💻 갤러리 입장
      </button>
    </div>
  );
}

// ── Contact ───────────────────────────────────────────────────
function ContactContent() {
  const [copied, setCopied] = useState<string | null>(null);

  const items = [
    { label: "✉  Email",    value: CONTACT_DATA.email,    show: !!CONTACT_DATA.email,    link: false },
    { label: "☏  Phone",    value: CONTACT_DATA.phone,    show: !!CONTACT_DATA.phone,    link: false },
    { label: "◈  GitHub",   value: CONTACT_DATA.github,   show: !!CONTACT_DATA.github,   link: true  },
    { label: "◈  LinkedIn", value: CONTACT_DATA.linkedin, show: !!CONTACT_DATA.linkedin, link: false },
    { label: "◈  Twitter",  value: CONTACT_DATA.twitter,  show: !!CONTACT_DATA.twitter,  link: false },
    ...CONTACT_DATA.other.map(o => ({ label: o.label, value: o.url, show: true, link: false })),
  ].filter(l => l.show);

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(value);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div>
      <p style={{ ...s.body, marginBottom: "1.6rem", color: "rgba(200,195,225,0.7)" }}>
        편하게 연락주세요 :)
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
        {items.map((l, i) => l.link ? (
          <a key={i} href={l.value} target="_blank" rel="noreferrer"
            style={{ ...s.contactLink, cursor: "pointer" }}
          >
            <span style={{ color: "#C8B8FF", fontWeight: 600, fontSize: "0.9rem" }}>{l.label}</span>
            <span style={{ color: "#7868A8", fontSize: "0.78rem", marginTop: "0.15rem", display: "block", wordBreak: "break-all" }}>
              {l.value}
            </span>
          </a>
        ) : (
          <div key={i} onClick={() => handleCopy(l.value)}
            style={{ ...s.contactLink, cursor: "pointer", position: "relative" }}
          >
            <span style={{ color: "#C8B8FF", fontWeight: 600, fontSize: "0.9rem" }}>{l.label}</span>
            <span style={{ color: "#7868A8", fontSize: "0.78rem", marginTop: "0.15rem", display: "block", wordBreak: "break-all" }}>
              {l.value}
            </span>
            {copied === l.value && (
              <span style={{
                position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)",
                color: "#70D0A0", fontSize: "0.75rem", letterSpacing: "0.08em",
              }}>
                복사됨 ✓
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 공통 섹션 레이블 ──────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", margin: "1.2rem 0 0.8rem" }}>
      <span style={{ color: "#8060C0", fontSize: "0.72rem", letterSpacing: "0.12em", fontWeight: 700 }}>
        ✦ {children}
      </span>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(140,100,255,0.3), transparent)" }} />
    </div>
  );
}

// ── 메인 모달 ─────────────────────────────────────────────────
export default function PortfolioModal({ type, onClose }: Props) {
  const isMobile   = useIsMobile();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 350);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) handleClose();
  };

  const ContentMap: Record<ModalType, React.ReactNode> = {
    about:    <AboutContent />,
    projects: <ProjectsContent />,
    skills:   <SkillsContent />,
    contact:  <ContactContent />,
  };

  return (
    <div ref={overlayRef} style={s.overlay} onClick={handleOverlayClick}>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);     }
        }
        @keyframes modalOut {
          from { opacity: 1; transform: scale(1)    translateY(0);     }
          to   { opacity: 0; transform: scale(0.92) translateY(12px);  }
        }
        @keyframes sheetIn {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes sheetOut {
          from { transform: translateY(0); }
          to   { transform: translateY(100%); }
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={isMobile ? {
          // ── 모바일: 하단 Bottom Sheet ──
          position:       "fixed",
          bottom:         0,
          left:           0,
          right:          0,
          maxHeight:      "88dvh",
          backgroundColor: "#09071C",
          border:         "1px solid rgba(140,100,255,0.35)",
          borderRadius:   "20px 20px 0 0",
          boxShadow:      "0 -8px 40px rgba(100,60,255,0.25)",
          overflow:       "hidden",
          display:        "flex",
          flexDirection:  "column",
          animation:      closing
            ? "sheetOut 0.32s cubic-bezier(0.22, 1, 0.36, 1) both"
            : "sheetIn  0.42s cubic-bezier(0.22, 1, 0.36, 1) both",
        } : {
          // ── PC: 중앙 팝업 ──
          position:        "relative",
          width:           "min(660px, 92vw)",
          maxHeight:       "85vh",
          backgroundColor: "#09071C",
          border:          "1px solid rgba(140,100,255,0.35)",
          borderRadius:    "18px",
          boxShadow:       "0 0 50px rgba(100,60,255,0.2), 0 0 100px rgba(60,20,120,0.12)",
          overflow:        "hidden",
          display:         "flex",
          flexDirection:   "column",
          animation:       closing
            ? "modalOut 0.32s cubic-bezier(0.22, 1, 0.36, 1) both"
            : "modalIn  0.45s cubic-bezier(0.22, 1, 0.36, 1) both",
        }}
      >
        <div style={s.starsBg} aria-hidden />

        {/* 모바일 드래그 핸들 */}
        {isMobile && (
          <div style={{ display: "flex", justifyContent: "center", padding: "0.75rem 0 0" }}>
            <div style={{ width: "2.5rem", height: "4px", borderRadius: "2px", background: "rgba(140,100,255,0.35)" }} />
          </div>
        )}

        {/* 헤더 */}
        <div style={s.header}>
          <div>
            <span style={s.title}>{TITLES[type]}</span>
          </div>
          <button style={s.closeBtn} onClick={handleClose} aria-label="닫기">✕</button>
        </div>
        <div style={s.headerDivider} />

        {/* 콘텐츠 */}
        <div
          style={{ ...s.scrollArea, paddingBottom: isMobile ? "calc(env(safe-area-inset-bottom) + 1.6rem)" : "1.6rem" }}
          className="scroll-momentum"
        >
          <div style={{ padding: "1.2rem 0 0.4rem" }}>
            {ContentMap[type]}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 스타일 ────────────────────────────────────────────────────
const s: Record<string, any> = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(5px)",
    WebkitBackdropFilter: "blur(5px)",
  },
  starsBg: {
    position: "absolute", inset: 0,
    backgroundImage: `
      radial-gradient(1px 1px at 15% 20%, rgba(255,255,255,0.45) 0%, transparent 100%),
      radial-gradient(1px 1px at 75% 15%, rgba(255,255,255,0.35) 0%, transparent 100%),
      radial-gradient(1px 1px at 45% 80%, rgba(255,255,255,0.25) 0%, transparent 100%),
      radial-gradient(1px 1px at 85% 60%, rgba(255,255,255,0.35) 0%, transparent 100%),
      radial-gradient(1px 1px at 25% 70%, rgba(255,255,255,0.25) 0%, transparent 100%),
      radial-gradient(2px 2px at 90% 85%, rgba(180,140,255,0.35) 0%, transparent 100%),
      radial-gradient(2px 2px at 10% 90%, rgba(140,100,255,0.25) 0%, transparent 100%)
    `,
    pointerEvents: "none", zIndex: 0,
  },
  header: {
    position: "relative", zIndex: 1,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "1.1rem 1.4rem 0.9rem",
  },
  title: {
    color: "#C8B0FF", fontSize: "0.85rem", fontWeight: 700,
    letterSpacing: "0.2em",
    textShadow: "0 0 12px rgba(180,140,255,0.5)",
  },
  closeBtn: {
    background: "none",
    border: "1px solid rgba(140,100,255,0.3)",
    borderRadius: "50%",
    width: "2rem", height: "2rem",
    color: "rgba(200,180,255,0.7)",
    cursor: "pointer", fontSize: "0.85rem",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.2s",
  },
  headerDivider: {
    height: "1px", margin: "0 1.4rem",
    background: "linear-gradient(90deg, transparent, rgba(140,100,255,0.45), transparent)",
    position: "relative", zIndex: 1,
  },
  scrollArea: {
    position: "relative", zIndex: 1,
    overflowY: "auto", padding: "0 1.4rem",
    flex: 1,
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(140,100,255,0.3) transparent",
  },
  body: {
    color: "rgba(200,195,225,0.82)", fontSize: "0.9rem",
    lineHeight: 1.75, margin: "0 0 0.8rem",
    whiteSpace: "pre-line",
  },
  divider: {
    height: "1px", margin: "1.2rem 0",
    background: "linear-gradient(90deg, transparent, rgba(140,100,255,0.25), transparent)",
  },
  tagRow: { display: "flex", flexWrap: "wrap", gap: "0.4rem" },
  tag: {
    backgroundColor: "rgba(100,60,200,0.22)",
    border: "1px solid rgba(140,100,255,0.3)",
    borderRadius: "4px", color: "#C0B0F0",
    fontSize: "0.75rem", padding: "0.18rem 0.55rem",
    letterSpacing: "0.04em",
  },
  timelineItem: {
    borderLeft: "2px solid rgba(140,100,255,0.25)",
    paddingLeft: "1rem", marginBottom: "1rem",
  },
  contactLink: {
    display: "block", textDecoration: "none",
    padding: "0.8rem 1rem",
    border: "1px solid rgba(140,100,255,0.18)",
    borderRadius: "10px",
    backgroundColor: "rgba(100,60,200,0.1)",
    transition: "all 0.2s",
  },
};
