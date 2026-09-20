"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FloorCardId, ProjectionId } from "@/config/hallway";
import { COLOR_DEEP, COPY, SCENES, SITE, type SceneId } from "@/config/site";
import { useAmbientAudio } from "@/hooks/useAmbientAudio";
import { useHallwayLayout } from "@/hooks/useHallwayLayout";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { track } from "@/lib/analytics";
import { DoorGlow } from "./DoorGlow";
import { FloorAlignPanel } from "./FloorAlignPanel";
import { FrameProjection } from "./FrameProjection";
import { HallwayOverlay, type ProjectionOrigin } from "./HallwayOverlay";
import { JourneyOverlay } from "./JourneyOverlay";
import { Preloader } from "./Preloader";
import { EventsRoom } from "./EventsRoom";
import { AboutRoom } from "./AboutRoom";
import { Finale } from "./Finale";
import { SiteFooter } from "./SiteFooter";

type Phase = "preloader" | "ready" | "journey" | "door" | "hallway" | "to-door" | "portal" | "exiting" | "events" | "about" | "finale";

function playMuted(video: HTMLVideoElement | null) {
  if (!video) return;
  video.muted = true;
  const p = video.play();
  if (p) p.catch(() => {});
}

function hasFloorAlignFlag() {
  return typeof window === "undefined" ? false : new URLSearchParams(window.location.search).has("mobileFloorAlign");
}

function usePortraitViewport() {
  const [portrait, setPortrait] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait) and (max-width: 900px)");
    const update = () => setPortrait(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return portrait;
}

export function HomeExperience() {
  const reducedMotion = useReducedMotion();
  const portrait = usePortraitViewport();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const journeyRef = useRef<HTMLVideoElement | null>(null);
  const hallwayRef = useRef<HTMLVideoElement | null>(null);
  const toDoorRef = useRef<HTMLVideoElement | null>(null);
  const portalRef = useRef<HTMLVideoElement | null>(null);

  const [phase, setPhase] = useState<Phase>("preloader");
  const [loadProgress, setLoadProgress] = useState(0);
  const [activeScene, setActiveScene] = useState<SceneId>("journey");
  const [projection, setProjection] = useState<ProjectionId | null>(null);
  const [projectionFromFloor, setProjectionFromFloor] = useState(false);
  const [hallwayEnded, setHallwayEnded] = useState(false);
  const [journeyCopyVisible, setJourneyCopyVisible] = useState(true);
  const [exitFade, setExitFade] = useState(false);
  // Which room the door sequence should open into (events or about); null = platform exit.
  const [roomPending, setRoomPending] = useState<"events" | "about" | "finale" | null>(null);
  const roomPendingRef = useRef<"events" | "about" | "finale" | null>(null);
  roomPendingRef.current = roomPending;
  const [floorAlign, setFloorAlign] = useState(hasFloorAlignFlag);
  const [activeFloorCard, setActiveFloorCard] = useState<FloorCardId>("offer");

  const { layout, patchMobileFloorCard, reset, copyConfig } = useHallwayLayout();
  const audioEnabled = !floorAlign && phase !== "preloader" && phase !== "ready" && phase !== "exiting" && phase !== "events" && phase !== "about" && phase !== "finale";
  const { tryPlay, fadeOut } = useAmbientAudio({ enabled: audioEnabled, reducedMotion });

  const startRoomSequence = useCallback((room: "events" | "about") => {
    // hallway-to-door, then portal-open, then the room (no click in between).
    track(`${room}_clicked`);
    setProjection(null);
    setHallwayEnded(false);
    setRoomPending(room);
    setPhase("to-door");
    setActiveScene("toDoor");
    const v = toDoorRef.current;
    if (v) {
      v.currentTime = 0;
      playMuted(v);
    }
  }, []);
  const openProjection = useCallback(
    (id: ProjectionId, origin: ProjectionOrigin) => {
      if (id === "events" || id === "about") {
        startRoomSequence(id);
        return;
      }
      setProjectionFromFloor(origin === "floor");
      setProjection(id);
    },
    [startRoomSequence],
  );
  const closeProjection = useCallback(() => setProjection(null), []);

  // Debug mode: jump straight to the hallway's last frame.
  useEffect(() => {
    if (!floorAlign) return;
    setPhase("hallway");
    setActiveScene("hallway");
    setHallwayEnded(true);
    setJourneyCopyVisible(false);
    setProjection(null);
    const v = hallwayRef.current;
    const seekEnd = () => {
      if (!v) return;
      if (Number.isFinite(v.duration) && v.duration > 0) v.currentTime = Math.max(0, v.duration - 0.05);
      v.pause();
    };
    if (v) {
      if (v.readyState >= 1) seekEnd();
      else v.addEventListener("loadedmetadata", seekEnd, { once: true });
      v.load();
    }
  }, [floorAlign]);

  // Preload the journey film and report buffering progress to the preloader.
  useEffect(() => {
    if (floorAlign) return;
    track("cinematic_started");
    const v = document.createElement("video");
    v.preload = "auto";
    v.muted = true;
    v.playsInline = true;
    v.src = SCENES.journey.video;
    const onProgress = () => {
      if (!v.buffered.length || !v.duration) return;
      const end = v.buffered.end(v.buffered.length - 1);
      setLoadProgress(Math.min(0.98, end / v.duration));
    };
    const onReady = () => setLoadProgress(1);
    v.addEventListener("progress", onProgress);
    v.addEventListener("canplaythrough", onReady);
    v.load();
    return () => {
      v.removeEventListener("progress", onProgress);
      v.removeEventListener("canplaythrough", onReady);
      v.removeAttribute("src");
      v.load();
    };
  }, [floorAlign]);

  useEffect(() => {
    if (phase === "preloader" || phase === "ready" || floorAlign) return;
    [SCENES.hallway, SCENES.toDoor, SCENES.portal].forEach((s) => {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.as = "video";
      link.href = s.video;
      document.head.appendChild(link);
    });
  }, [phase, floorAlign]);

  const onPreloaderDone = useCallback(() => setPhase("ready"), []);

  const enterExperience = useCallback(() => {
    tryPlay();
    setPhase("journey");
    setActiveScene("journey");
    setJourneyCopyVisible(true);
    const v = journeyRef.current;
    if (v) {
      v.currentTime = 0;
      playMuted(v);
    }
    window.setTimeout(() => setJourneyCopyVisible(false), 4500);
  }, [tryPlay]);

  useEffect(() => {
    const v = journeyRef.current;
    if (!v) return;
    const onEnded = () => {
      if (Number.isFinite(v.duration) && v.duration > 0) v.currentTime = Math.max(0, v.duration - 0.05);
      v.pause();
      setJourneyCopyVisible(false);
      setPhase("door");
      track("scene_viewed", { scene: "door" });
    };
    v.addEventListener("ended", onEnded);
    return () => v.removeEventListener("ended", onEnded);
  }, []);

  const openDoor = useCallback(() => {
    setPhase("hallway");
    setActiveScene("hallway");
    setHallwayEnded(false);
    setProjection(null);
    const v = hallwayRef.current;
    if (v) {
      v.currentTime = 0;
      playMuted(v);
    }
  }, []);

  useEffect(() => {
    const v = hallwayRef.current;
    if (!v) return;
    const onEnded = () => {
      track("scene_viewed", { scene: "hallway" });
      if (Number.isFinite(v.duration) && v.duration > 0) v.currentTime = Math.max(0, v.duration - 0.05);
      v.pause();
      setHallwayEnded(true);
    };
    v.addEventListener("ended", onEnded);
    return () => v.removeEventListener("ended", onEnded);
  }, []);

  const onContinue = useCallback(() => {
    if (phase !== "hallway") return;
    track("continue_clicked");
    setProjection(null);
    setHallwayEnded(false);
    setRoomPending("finale");
    setPhase("to-door");
    setActiveScene("toDoor");
    const v = toDoorRef.current;
    if (v) {
      v.currentTime = 0;
      playMuted(v);
    }
  }, [phase]);

  useEffect(() => {
    const v = toDoorRef.current;
    if (!v) return;
    const onEnded = () => {
      track("scene_viewed", { scene: "portal-ready" });
      v.pause();
      // Always continue straight into the portal film; there is no click-to-enter gate any more.
      if (!roomPendingRef.current) setRoomPending("finale");
      setPhase("exiting");
      setActiveScene("portal");
      const p = portalRef.current;
      if (p) {
        p.currentTime = 0;
        playMuted(p);
      }
    };
    v.addEventListener("ended", onEnded);
    return () => v.removeEventListener("ended", onEnded);
  }, []);

  useEffect(() => {
    const v = portalRef.current;
    if (!v) return;
    const onEnded = () => {
      setExitFade(true);
      const room = roomPendingRef.current;
      if (room === "finale") {
        track("finale_started");
        fadeOut(600);
        window.setTimeout(() => {
          setPhase("finale");
          setExitFade(false);
        }, 400);
        return;
      }
      if (room) {
        track(`${room}_opened`);
        window.setTimeout(() => {
          setPhase(room);
          setExitFade(false);
        }, 500);
        return;
      }
      track("finale_started");
      fadeOut(600);
      window.setTimeout(() => {
        setPhase("finale");
        setExitFade(false);
      }, 400);
    };
    v.addEventListener("ended", onEnded);
    return () => v.removeEventListener("ended", onEnded);
  }, [fadeOut]);

  useEffect(() => {
    if (!projection) return;
    [journeyRef, hallwayRef, toDoorRef, portalRef].forEach((r) => r.current?.pause());
  }, [projection]);

  const doorVisible = phase === "door" && !floorAlign;
  const hallwayVisible = (phase === "hallway" && hallwayEnded && !projection) || floorAlign;
  const journeyOverlayVisible = phase === "journey" && journeyCopyVisible && !floorAlign;

  const goToDestination = useCallback(() => {
    track("destination_navigated");
    window.location.assign(COPY.finale.destination || SITE.appUrl);
  }, []);

  const leaveRoom = useCallback(() => {
    setRoomPending(null);
    setPhase("hallway");
    setActiveScene("hallway");
    setHallwayEnded(true);
    const v = hallwayRef.current;
    if (v && Number.isFinite(v.duration) && v.duration > 0) {
      v.currentTime = Math.max(0, v.duration - 0.05);
      v.pause();
    }
  }, []);

  const closeFloorAlign = useCallback(() => {
    setFloorAlign(false);
    setProjection(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("mobileFloorAlign");
    window.history.replaceState({}, "", url.toString());
    setPhase("preloader");
    setLoadProgress(0);
    setActiveScene("journey");
    setHallwayEnded(false);
  }, []);

  const showHeader = (phase !== "preloader" && phase !== "ready") || floorAlign;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden" style={{ background: COLOR_DEEP }} data-phase={phase} data-scene={activeScene}>
      <section className="sr-only" aria-label="About Level Up Com">
        <h1>{COPY.hidden.heading}</h1>
        <p>{SITE.description}</p>
        <p>{COPY.hidden.about}</p>
      </section>

      {phase === "preloader" && !floorAlign && <Preloader onComplete={onPreloaderDone} loadProgress={loadProgress} reducedMotion={reducedMotion} />}

      {phase === "ready" && !floorAlign && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6" style={{ background: COLOR_DEEP }}>
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{ background: "radial-gradient(ellipse 55% 45% at 50% 42%, rgba(37,99,235,0.55) 0%, transparent 70%)" }}
            aria-hidden
          />
          <div className="relative flex flex-col items-center" style={{ animation: "readyGateIn 0.9s ease-out both" }}>
            <img src={SITE.logoOnDark} alt={SITE.name} className="mb-10 w-[min(72vw,340px)]" />
            <p
              className="mb-10 max-w-sm text-center text-[clamp(1.15rem,3.5vw,1.55rem)] font-medium tracking-[0.02em] text-[#ffffff]"
              style={{ fontFamily: 'Poppins, Montserrat, sans-serif', textShadow: "0 2px 20px rgba(0,0,0,0.45)" }}
            >
              {COPY.readyGate.line}
            </p>
            <button
              type="button"
              onClick={enterExperience}
              className="aradi-silver-lining touch-manipulation border-0 px-8 py-3.5 text-[11px] tracking-[0.38em] text-[#ffffff] uppercase transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563eb]"
              style={{
                fontFamily: 'Poppins, Montserrat, sans-serif',
                fontWeight: 500,
                background: "linear-gradient(180deg, rgba(20,31,63,0.92), rgba(10,15,31,0.96))",
              }}
            >
              {COPY.readyGate.button}
            </button>
          </div>
        </div>
      )}

      {showHeader ? (
        <header className="pointer-events-none absolute left-0 right-0 top-0 z-50 flex items-center justify-between px-5 py-4 md:px-8">
          <div className="pointer-events-auto flex items-center gap-3">
            <img src={SITE.logoOnDark} alt={SITE.name} className="h-8 w-auto md:h-9" />
          </div>
          {floorAlign && (
            <span className="pointer-events-none rounded border border-[#2563eb]/50 bg-black/50 px-2 py-1 text-[10px] tracking-[0.2em] text-[#2563eb] uppercase">
              Floor align debug
            </span>
          )}
        </header>
      ) : null}

      {phase !== "preloader" && phase !== "ready" && !floorAlign && !projection && phase !== "events" && phase !== "about" && phase !== "finale" && <SiteFooter />}

      <div ref={stageRef} className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 will-change-transform"
          style={{ transformOrigin: "0 0" }}
        >
          {(
            [
              ["journey", journeyRef, SCENES.journey],
              ["hallway", hallwayRef, SCENES.hallway],
              ["toDoor", toDoorRef, SCENES.toDoor],
              ["portal", portalRef, SCENES.portal],
            ] as const
          ).map(([id, ref, scene]) => (
            <video
              key={id}
              ref={ref}
              className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${activeScene === id ? "opacity-100" : "opacity-0 pointer-events-none"} ${
                "object-cover object-center"
              }`}
              src={portrait && scene.videoPortrait ? scene.videoPortrait : scene.video}
              poster={portrait && scene.posterPortrait ? scene.posterPortrait : scene.poster}
              muted
              playsInline
              preload={id === "journey" ? "auto" : "metadata"}
              controls={false}
              onError={() => track("video_failed", { id })}
            />
          ))}

          <JourneyOverlay videoRef={journeyRef} visible={journeyOverlayVisible} />
          {doorVisible && (
            <div className="absolute inset-0 z-30 flex items-center justify-center px-6" role="dialog" aria-label="Open the door">
              <button
                type="button"
                onClick={openDoor}
                className="aradi-silver-lining touch-manipulation border-0 px-8 py-3.5 text-[11px] tracking-[0.38em] text-[#ffffff] uppercase transition active:scale-[0.98] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563eb]"
                style={{
                  fontFamily: "Poppins, Montserrat, sans-serif",
                  fontWeight: 500,
                  background: "linear-gradient(180deg, rgba(20,31,63,0.92), rgba(10,15,31,0.96))",
                  animation: "readyGateIn 0.9s ease-out both",
                }}
              >
                {COPY.door.button}
              </button>
            </div>
          )}
          <HallwayOverlay
            containerRef={stageRef}
            visible={hallwayVisible && !projection}
            alignMode={false}
            mobileFloorAlignMode={floorAlign}
            layout={layout}
            activeFrameId="offer"
            activeFloorCardId={activeFloorCard}
            onSelectFrame={() => {}}
            onSelectFloorCard={setActiveFloorCard}
            onOpenProjection={openProjection}
            onContinue={onContinue}
            onPatchFrame={() => {}}
            onPatchMobileFloorCard={patchMobileFloorCard}
          />
          <FrameProjection projectionId={projection} onClose={closeProjection} containerRef={stageRef} layout={layout} fromFloor={projectionFromFloor} />
          {floorAlign && (
            <FloorAlignPanel
              layout={layout}
              activeId={activeFloorCard}
              onSelect={setActiveFloorCard}
              onPatch={patchMobileFloorCard}
              onReset={reset}
              onCopy={copyConfig}
              onClose={closeFloorAlign}
              onPreview={(id) => {
                if (!id) {
                  closeProjection();
                  return;
                }
                openProjection(id, "floor");
              }}
            />
          )}
        </div>

      </div>

      {phase === "events" && <EventsRoom portrait={portrait} onBack={leaveRoom} />}
      {phase === "about" && <AboutRoom portrait={portrait} onBack={leaveRoom} />}
      {phase === "finale" && <Finale portrait={portrait} onDone={goToDestination} />}

      <div
        className={`pointer-events-none absolute inset-0 z-[60] transition-opacity duration-700 ${exitFade ? "opacity-100" : "opacity-0"}`}
        style={{ background: COLOR_DEEP }}
        aria-hidden
      />
    </div>
  );
}
