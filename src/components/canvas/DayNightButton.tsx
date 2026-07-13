"use client";

import { useDayNight } from "./DayNightContext";
import { useWeather } from "./WeatherContext";
import { useState } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

export default function DayNightButton() {
  const { mode, toggle } = useDayNight();
  const { isStorm }      = useWeather();
  const isMobile         = useIsMobile();
  const [hovered, setHovered] = useState(false);

  const isNight = mode === "night";
  const isDark  = isNight || isStorm;

  const bg          = isDark ? "rgba(30,40,70,0.82)"  : "rgba(255,245,220,0.88)";
  const hoverBg     = isDark ? "rgba(40,55,100,0.92)" : "rgba(255,252,235,0.95)";
  const borderColor = isDark ? "rgba(120,160,255,0.5)" : "rgba(220,180,80,0.6)";
  const textColor   = isDark ? "rgba(200,225,255,0.95)" : "rgba(80,55,20,0.95)";
  const shadow      = isDark
    ? "0 2px 12px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)"
    : "0 2px 12px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.6)";

  // 모바일: 아이콘 전용 원형 버튼, WeatherButton 바로 옆에 위치
  if (isMobile) {
    return (
      <button
        onClick={toggle}
        style={{
          position:     "fixed",
          top:          "1rem",
          right:        "4.8rem",
          zIndex:       40,
          width:        "2.6rem",
          height:       "2.6rem",
          display:      "flex",
          alignItems:   "center",
          justifyContent: "center",
          background:   bg,
          border:       `1px solid ${borderColor}`,
          borderRadius: "50%",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          boxShadow:    shadow,
          cursor:       "pointer",
          fontSize:     "1.1rem",
        }}
        aria-label={isNight ? "낮으로 전환" : "밤으로 전환"}
      >
        <span style={{
          display:    "inline-block",
          transition: "transform 0.4s ease",
          transform:  isNight ? "rotate(-15deg)" : "rotate(0deg)",
        }}>
          {isNight ? "🌙" : "☀️"}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:        "fixed",
        top:             "1.4rem",
        right:           "10.8rem",
        zIndex:          40,
        display:         "flex",
        alignItems:      "center",
        gap:             "0.55rem",
        padding:         "0.6rem 1.1rem",
        background:      hovered ? hoverBg : bg,
        border:          `1px solid ${borderColor}`,
        borderRadius:    "999px",
        backdropFilter:  "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow:       shadow,
        cursor:          "pointer",
        transition:      "all 0.25s ease",
        transform:       hovered ? "translateY(1px)" : "translateY(0)",
        userSelect:      "none",
      }}
    >
      <span style={{
        fontSize:   "1.05rem",
        lineHeight: 1,
        transition: "transform 0.4s ease",
        display:    "inline-block",
        transform:  isNight ? "rotate(-15deg)" : "rotate(0deg)",
      }}>
        {isNight ? "🌙" : "☀️"}
      </span>

      <span style={{
        fontSize:      "0.72rem",
        fontWeight:    700,
        color:         textColor,
        letterSpacing: "0.09em",
      }}>
        {isNight ? "NIGHT" : "DAY"}
      </span>

      <span style={{
        width:        "5px",
        height:       "5px",
        borderRadius: "50%",
        background:   isNight ? "#88aaff" : "#ffcc44",
        boxShadow:    isNight
          ? "0 0 8px rgba(120,160,255,1)"
          : "0 0 8px rgba(255,200,60,1)",
        transition: "all 0.5s ease",
      }} />
    </button>
  );
}
