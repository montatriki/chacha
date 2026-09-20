import site from "@data/content/site.json";

export type SceneId = "journey" | "hallway" | "toDoor" | "portal";
export interface SceneSource {
  id: string;
  video: string;
  poster: string;
  /** Optional 9:16 version, used on portrait viewports when set. */
  videoPortrait?: string | null;
  posterPortrait?: string | null;
}

export const SITE = site;
export const SCENES: Record<SceneId, SceneSource> = site.scenes;
export const COLOR_TEAL = site.colors.teal;
export const COLOR_DEEP = site.colors.deep;
export const INTRO_AUDIO_SRC = site.audio.intro;
export const INTRO_AUDIO_VOLUME = site.audio.volume;
export const COPY = site.copy;
