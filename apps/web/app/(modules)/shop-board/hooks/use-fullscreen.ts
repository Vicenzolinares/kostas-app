"use client";

import { useCallback, useEffect, useState } from "react";

/** Wraps the Fullscreen API for the kiosk display (module 16). */
export function useFullscreen(targetRef: React.RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const enter = useCallback(() => {
    void targetRef.current?.requestFullscreen();
  }, [targetRef]);

  const exit = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      exit();
    } else {
      enter();
    }
  }, [enter, exit]);

  return { isFullscreen, enter, exit, toggle };
}
