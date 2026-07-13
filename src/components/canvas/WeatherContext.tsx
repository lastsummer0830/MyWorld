"use client";

import { createContext, useContext, useState, useCallback } from "react";

export type WeatherMode = "clear" | "storm";

interface WeatherCtx {
  weather:  WeatherMode;
  toggle:   () => void;
  isStorm:  boolean;
}

const WeatherContext = createContext<WeatherCtx>({
  weather: "clear",
  toggle:  () => {},
  isStorm: false,
});

export function useWeather() {
  return useContext(WeatherContext);
}

export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const [weather, setWeather] = useState<WeatherMode>("clear");

  const toggle = useCallback(() => {
    setWeather(prev => prev === "clear" ? "storm" : "clear");
  }, []);

  return (
    <WeatherContext.Provider value={{ weather, toggle, isStorm: weather === "storm" }}>
      {children}
    </WeatherContext.Provider>
  );
}
