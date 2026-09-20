"use client";
import { useCallback, useEffect, useState } from "react";
import { CONCEPT_PLAYBACK_RATE } from "@/config/concept";
import { BRIDGE, PITCH_PLAYBACK_RATE } from "@/config/pitch";
import { useAmbientAudio } from "@/hooks/useAmbientAudio";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { BridgeInterlude } from "./BridgeInterlude";
import { ConceptFilm } from "./ConceptFilm";
import { PitchFilm } from "./PitchFilm";

type Stage = "pitch" | "bridge" | "film";

export function ConceptExperience() {
  const [stage, setStage] = useState<Stage>("pitch");
  const [audioOn, setAudioOn] = useState(true);
  const [playing, setPlaying] = useState(true);
  const reducedMotion = useReducedMotion();
  const { fadeOut } = useAmbientAudio({ enabled: audioOn && playing, reducedMotion });

  const onPitchComplete = useCallback(() => setStage("bridge"), []);

  useEffect(() => {
    if (stage !== "bridge") return;
    setPlaying(true);
    const t = window.setTimeout(() => setStage("film"), BRIDGE.totalMs);
    return () => window.clearTimeout(t);
  }, [stage]);

  const onFilmEnded = useCallback(() => {
    setAudioOn(false);
    fadeOut(900);
  }, [fadeOut]);

  return (
    <main className="h-[100dvh] w-full overflow-hidden bg-black">
      {stage === "pitch" && <PitchFilm playbackRate={PITCH_PLAYBACK_RATE} onComplete={onPitchComplete} onPlayingChange={setPlaying} />}
      {stage === "bridge" && <BridgeInterlude />}
      {stage === "film" && (
        <section className="relative h-[100dvh] w-full overflow-hidden bg-background">
          <ConceptFilm fill loop={false} playbackRate={CONCEPT_PLAYBACK_RATE} onEnded={onFilmEnded} onPlayingChange={setPlaying} />
        </section>
      )}
    </main>
  );
}
