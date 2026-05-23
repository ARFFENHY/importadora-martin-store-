"use client";

import { useEffect, useState } from "react";
import { useConfigStore } from "@/store/useConfigStore";

export function ThemeInitializer() {
  const colors = useConfigStore((state) => state.colors);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 0);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    // Apply each custom color property to the root element style
    Object.entries(colors).forEach(([key, value]) => {
      // Map keys to match global variables (camelCase to kebab-case, e.g. surfaceHover -> surface-hover)
      const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      root.style.setProperty(`--${cssKey}`, value);
    });
  }, [colors, mounted]);

  return null;
}
