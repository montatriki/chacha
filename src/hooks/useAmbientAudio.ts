"use client";
import { useCallback, useEffect, useRef } from "react";
import { INTRO_AUDIO_SRC, INTRO_AUDIO_VOLUME } from "@/config/site";

export function useAmbientAudio({ enabled, reducedMotion }: { enabled: boolean; reducedMotion: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadingRef = useRef(false);

  useEffect(() => {
    if (reducedMotion) return;
    const audio = new Audio(INTRO_AUDIO_SRC);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = INTRO_AUDIO_VOLUME;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, [reducedMotion]);

  const tryPlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || reducedMotion || fadingRef.current) return;
    if (audio.paused) audio.play().catch(() => {});
  }, [reducedMotion]);

  useEffect(() => {
    if (!enabled || reducedMotion) {
      const audio = audioRef.current;
      if (audio && !audio.paused) audio.pause();
      return;
    }
    tryPlay();
    const onInteract = () => tryPlay();
    window.addEventListener("pointerdown", onInteract);
    window.addEventListener("keydown", onInteract);
    window.addEventListener("touchstart", onInteract, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("touchstart", onInteract);
    };
  }, [enabled, reducedMotion, tryPlay]);

  const fadeOut = useCallback((ms = 700) => {
    const audio = audioRef.current;
    if (!audio) return;
    fadingRef.current = true;
    const startVol = audio.volume;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      audio.volume = startVol * (1 - p);
      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = INTRO_AUDIO_VOLUME;
        fadingRef.current = false;
      }
    };
    requestAnimationFrame(step);
  }, []);

  return { tryPlay, fadeOut };
}
