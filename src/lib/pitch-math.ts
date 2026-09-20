import type { PitchKeyframe } from "@/config/pitch";

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

/** Smoothstep between `a` and `b` evaluated at `t`. */
export function smooth(a: number, b: number, t: number) {
  const p = clamp((t - a) / (b - a), 0, 1);
  return p * p * (3 - 2 * p);
}

export interface SampledFrame {
  time: number;
  x: number;
  y: number;
  scale: number;
  rotate: number;
  opacity: number;
}

export function sampleKeyframes(time: number, keyframes: PitchKeyframe[]): SampledFrame {
  if (!keyframes.length) return { time, x: 0, y: 0, scale: 1, rotate: 0, opacity: 0 };
  const first = keyframes[0];
  if (time <= first.time) {
    return { time, x: first.x, y: first.y, scale: first.scale ?? 1, rotate: first.rotate ?? 0, opacity: first.opacity ?? 0 };
  }
  const last = keyframes[keyframes.length - 1];
  if (time >= last.time) {
    return { time, x: last.x, y: last.y, scale: last.scale ?? 1, rotate: last.rotate ?? 0, opacity: last.opacity ?? 0 };
  }
  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i];
    const b = keyframes[i + 1];
    if (time >= a.time && time <= b.time) {
      const raw = (time - a.time) / (b.time - a.time || 1);
      const t = smooth(0, 1, raw);
      return {
        time,
        x: lerp(a.x, b.x, t),
        y: lerp(a.y, b.y, t),
        scale: lerp(a.scale ?? 1, b.scale ?? 1, t),
        rotate: lerp(a.rotate ?? 0, b.rotate ?? 0, t),
        opacity: lerp(a.opacity ?? 0, b.opacity ?? 0, t),
      };
    }
  }
  return { time, x: last.x, y: last.y, scale: last.scale ?? 1, rotate: last.rotate ?? 0, opacity: last.opacity ?? 0 };
}

/** Fade-in over the first 14% and fade-out over the last 20% of a scene's progress. */
export function sceneOpacity(progress: number) {
  const fadeIn = smooth(0, 0.14, progress);
  const fadeOut = 1 - smooth(0.8, 1, progress);
  return fadeIn * fadeOut;
}

export function typewriter(text: string, progress: number) {
  if (progress >= 1) return text;
  if (progress <= 0) return "";
  return text.slice(0, Math.round(progress * text.length));
}
