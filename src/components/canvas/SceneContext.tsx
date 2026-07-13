"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import * as THREE from "three";

export type SceneMode = "room" | "zooming-in" | "museum" | "zooming-out";

interface SceneCtx {
  mode:             SceneMode;
  flash:            boolean;
  museumCamRef:     React.MutableRefObject<THREE.PerspectiveCamera | null>;
  enterMuseum:      () => void;
  onMonitorReached: () => void;
  exitMuseum:       () => void;
  onRoomReturned:   () => void;
}

const SceneContext = createContext<SceneCtx>({
  mode:             "room",
  flash:            false,
  museumCamRef:     { current: null },
  enterMuseum:      () => {},
  onMonitorReached: () => {},
  exitMuseum:       () => {},
  onRoomReturned:   () => {},
});

export const useScene = () => useContext(SceneContext);

export function SceneProvider({ children }: { children: ReactNode }) {
  const [mode, setMode]   = useState<SceneMode>("room");
  const [flash, setFlash] = useState(false);
  const museumCamRef      = useRef<THREE.PerspectiveCamera | null>(null);

  const enterMuseum = useCallback(() => {
    setMode(prev => prev === "room" ? "zooming-in" : prev);
  }, []);

  const onMonitorReached = useCallback(() => {
    setFlash(true);
    setTimeout(() => {
      setMode("museum");
      setFlash(false);
    }, 250);
  }, []);

  const exitMuseum = useCallback(() => {
    if (document.pointerLockElement) document.exitPointerLock();
    setFlash(true);
    setTimeout(() => {
      setMode("zooming-out");
      setFlash(false);
    }, 250);
  }, []);

  const onRoomReturned = useCallback(() => {
    setMode("room");
  }, []);

  return (
    <SceneContext.Provider value={{
      mode, flash, museumCamRef,
      enterMuseum, onMonitorReached, exitMuseum, onRoomReturned,
    }}>
      {children}
    </SceneContext.Provider>
  );
}
