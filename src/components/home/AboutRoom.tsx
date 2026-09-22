"use client";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { ABOUT_CONTACT, ABOUT_ROOM, ABOUT_STATS, ABOUT_TEAM, ABOUT_VALUES, type TeamMember } from "@/config/about";
import { SITE } from "@/config/site";

const FONT = "Poppins, Montserrat, sans-serif";
const GOLD = "#e7c98a";

/** Boardroom stage: locked background, cinematic reveal, team and contact. Scrolls only inside its own content column. */
export function AboutRoom({ portrait, onBack }: { portrait: boolean; onBack: () => void }) {
  const [member, setMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") (member ? setMember(null) : onBack());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [member, onBack]);

  return (
    <div className="absolute inset-0 z-[70] overflow-hidden" style={{ fontFamily: FONT, animation: "eventsRoomIn 1.2s ease-out both" }} role="region" aria-label={ABOUT_ROOM.eyebrow}>
      {/* Locked background */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        <img
          src={portrait ? ABOUT_ROOM.backgroundMobile : ABOUT_ROOM.backgroundDesktop}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          style={{ animation: "eventsBgDrift 30s ease-in-out infinite alternate", willChange: "transform" }}
        />
        <div className="absolute inset-0" style={{ background: "rgba(10,15,31,0.42)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(10,15,31,0.1) 0%, rgba(10,15,31,0.55) 70%, rgba(10,15,31,0.9) 100%)" }} />
        <div className="absolute inset-x-0 bottom-0" style={{ height: "55%", background: "linear-gradient(180deg, transparent, rgba(10,15,31,0.94))" }} />
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(1.5px 1.5px at 18% 28%, rgba(231,201,138,0.55), transparent 100%), radial-gradient(1px 1px at 40% 66%, rgba(255,255,255,0.35), transparent 100%), radial-gradient(1.8px 1.8px at 62% 18%, rgba(231,201,138,0.45), transparent 100%), radial-gradient(1px 1px at 80% 52%, rgba(255,255,255,0.3), transparent 100%)", animation: "eventsDust 16s linear infinite", opacity: 0.8 }} />
      </div>

      {/* Scrollable content column (background stays fixed behind it) */}
      <div className="absolute inset-0 overflow-y-auto overscroll-contain" style={{ scrollbarWidth: "none" }}>
        <div className="mx-auto flex min-h-full w-full flex-col items-center px-5" style={{ maxWidth: 1180, paddingTop: portrait ? 84 : 104, paddingBottom: "max(28px, env(safe-area-inset-bottom))" }}>
          {/* Hero: own glass panel so the copy never sits directly on the bright logo wall */}
          <div className="flex w-full flex-col items-center" style={{ maxWidth: 820, padding: portrait ? "22px 18px 24px" : "34px 40px 36px", borderRadius: 18, background: "linear-gradient(180deg, rgba(10,15,31,0.78), rgba(10,15,31,0.86))", border: "1px solid rgba(231,201,138,0.28)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", boxShadow: "0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1)", animation: "eventsRise 0.9s ease-out 0.2s both" }}>
          <p className="font-semibold uppercase" style={{ fontSize: "clamp(10px, 0.9vw, 12px)", letterSpacing: "0.42em", color: GOLD, animation: "eventsRise 0.9s ease-out 0.2s both" }}>
            {ABOUT_ROOM.eyebrow}
          </p>
          <h1 className="mt-3 text-center font-semibold text-white" style={{ fontSize: "clamp(1.9rem, 5vw, 3.6rem)", lineHeight: 1.05, letterSpacing: "0.04em", textShadow: "0 2px 30px rgba(0,0,0,0.8)", animation: "eventsRise 0.9s ease-out 0.35s both" }}>
            {ABOUT_ROOM.title}
          </h1>
          <div className="mt-5 h-px w-20" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, animation: "eventsRise 0.9s ease-out 0.45s both" }} />
          <p className="mt-5 text-center text-white" style={{ fontSize: "clamp(15px, 1.15vw, 18px)", maxWidth: "58ch", lineHeight: 1.7, opacity: 0.92, animation: "eventsRise 0.9s ease-out 0.55s both" }}>
            {ABOUT_ROOM.intro}
          </p>
          </div>

          {/* Stats */}
          <div className="mt-8 flex flex-wrap items-stretch justify-center" style={{ gap: portrait ? 10 : 18, animation: "eventsRise 0.9s ease-out 0.7s both" }}>
            {ABOUT_STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center justify-center text-center" style={{ minWidth: portrait ? 96 : 150, padding: portrait ? "12px 14px" : "16px 26px", borderRadius: 12, background: "rgba(10,15,31,0.86)", border: "1px solid rgba(231,201,138,0.35)", backdropFilter: "blur(12px)", boxShadow: "0 16px 40px rgba(0,0,0,0.45)" }}>
                <span className="font-semibold" style={{ fontSize: portrait ? 24 : 32, lineHeight: 1, color: GOLD, letterSpacing: "-0.01em" }}>{s.value}</span>
                <span className="mt-2 uppercase text-white" style={{ fontSize: 10, letterSpacing: "0.22em", opacity: 0.85 }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Team */}
          <div className="mt-12 grid w-full" style={{ gridTemplateColumns: portrait ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: portrait ? 16 : 28, maxWidth: 900 }}>
            {ABOUT_TEAM.map((m, i) => (
              <TeamCard key={m.id} member={m} index={i} portrait={portrait} onOpen={() => setMember(m)} />
            ))}
          </div>

          {/* Values */}
          <div className="mt-10 grid w-full" style={{ gridTemplateColumns: portrait ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 14, maxWidth: 900, animation: "eventsRise 0.9s ease-out 1.1s both" }}>
            {ABOUT_VALUES.map((v, i) => (
              <div key={v.title} className="relative overflow-hidden" style={{ padding: "18px 20px", borderRadius: 12, background: "linear-gradient(160deg, rgba(37,99,235,0.18), rgba(10,15,31,0.92))", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(14px)", boxShadow: "0 16px 40px rgba(0,0,0,0.4)" }}>
                <span className="absolute left-0 top-0 h-full" style={{ width: 3, background: `linear-gradient(180deg, ${GOLD}, rgba(231,201,138,0.15))` }} aria-hidden />
                <p className="font-semibold uppercase" style={{ fontSize: 10, letterSpacing: "0.3em", color: GOLD }}>{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-1 font-semibold text-white" style={{ fontSize: 20, letterSpacing: "0.06em" }}>{v.title}</h3>
                <p className="mt-1.5 text-white" style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.88 }}>{v.body}</p>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="mt-10 flex w-full flex-col items-center text-center" style={{ maxWidth: 900, padding: portrait ? "24px 18px" : "34px 40px", borderRadius: 16, background: "linear-gradient(160deg, rgba(37,99,235,0.24), rgba(10,15,31,0.94))", border: `1px solid rgba(231,201,138,0.35)`, backdropFilter: "blur(18px)", boxShadow: "0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)", animation: "eventsRise 0.9s ease-out 1.25s both" }}>
            <p className="font-semibold uppercase" style={{ fontSize: 10, letterSpacing: "0.4em", color: GOLD }}>Let&apos;s talk</p>
            <h2 className="mt-2 font-semibold text-white" style={{ fontSize: "clamp(1.3rem, 2.6vw, 2rem)", lineHeight: 1.15 }}>Ready to take your brand to the next level?</h2>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <a href={`mailto:${ABOUT_CONTACT.email}`} className="aradi-silver-lining border-0 px-6 py-3 font-semibold text-white uppercase transition hover:brightness-110" style={{ fontSize: 10.5, letterSpacing: "0.28em", background: "linear-gradient(180deg, rgba(37,99,235,0.85), rgba(29,78,216,0.95))" }}>
                {ABOUT_CONTACT.email}
              </a>
              <a href={ABOUT_CONTACT.instagram} target="_blank" rel="noopener noreferrer" className="px-6 py-3 font-semibold uppercase transition hover:brightness-125" style={{ fontSize: 10.5, letterSpacing: "0.28em", color: GOLD, border: "1px solid rgba(231,201,138,0.5)", borderRadius: 2 }}>
                {ABOUT_CONTACT.instagramHandle}
              </a>
            </div>
          </div>

          <button type="button" onClick={onBack} className="mt-8 px-6 py-3 font-semibold text-white uppercase transition hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e7c98a]" style={{ fontSize: 11.5, letterSpacing: "0.3em", background: "linear-gradient(180deg, rgba(20,31,63,0.92), rgba(10,15,31,0.96))", border: "1px solid rgba(231,201,138,0.85)", borderRadius: 2, boxShadow: "0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)", textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}>
            {ABOUT_ROOM.back}
          </button>
        </div>
      </div>

      {member && <MemberDetail member={member} portrait={portrait} onClose={() => setMember(null)} />}
    </div>
  );
}

function Portrait({ member, size, className }: { member: TeamMember; size: number | string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size } as const;
  if (failed) {
    return (
      <div className={`flex items-center justify-center rounded-full ${className ?? ""}`} style={{ ...style, background: "linear-gradient(160deg, rgba(37,99,235,0.55), rgba(10,15,31,0.95))", border: `2px solid ${GOLD}`, boxShadow: "0 0 40px rgba(231,201,138,0.25)" }}>
        <span className="font-semibold" style={{ fontSize: typeof size === "number" ? size * 0.34 : 40, color: GOLD, letterSpacing: "0.05em" }}>{member.initials}</span>
      </div>
    );
  }
  return <img src={member.photo} alt={member.name} className={`rounded-full object-cover ${className ?? ""}`} style={{ ...style, border: `2px solid ${GOLD}`, boxShadow: "0 0 40px rgba(231,201,138,0.25)" }} onError={() => setFailed(true)} />;
}

function TeamCard({ member, index, portrait, onOpen }: { member: TeamMember; index: number; portrait: boolean; onOpen: () => void }) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, gx: 50, gy: 50 });
  const onMove = (e: MouseEvent<HTMLButtonElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setTilt({ x: (0.5 - py) * 8, y: (px - 0.5) * 10, gx: px * 100, gy: py * 100 });
  };
  return (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      onMouseMove={onMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0, gx: 50, gy: 50 })}
      className="group relative text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e7c98a]"
      style={{ transformStyle: "preserve-3d", transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transition: "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)", animation: `eventCardIn 1s cubic-bezier(0.16, 1, 0.3, 1) ${0.8 + index * 0.12}s both` }}
      aria-label={`${member.name}, ${member.role} — open profile`}
    >
      <span className="absolute inset-0 rounded-[14px]" style={{ background: "linear-gradient(160deg, rgba(37,99,235,0.22) 0%, rgba(10,15,31,0.9) 50%, rgba(10,15,31,0.95) 100%)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(231,201,138,0.38)", boxShadow: "0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.14)" }} aria-hidden />
      <span className="pointer-events-none absolute inset-0 rounded-[14px] opacity-0 transition group-hover:opacity-100" style={{ background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(231,201,138,0.22), transparent 45%)`, transitionDuration: "300ms" }} aria-hidden />
      <span className="pointer-events-none absolute rounded-[10px]" style={{ inset: 10, border: "1px solid rgba(255,255,255,0.08)" }} aria-hidden />
      <span className={`relative flex ${portrait ? "flex-row items-center" : "flex-col items-center text-center"}`} style={{ padding: portrait ? "18px 18px" : "34px 28px 30px", gap: portrait ? 16 : 18, transform: "translateZ(30px)" }}>
        <Portrait member={member} size={portrait ? 84 : 132} className="shrink-0" />
        <span className={`flex min-w-0 flex-col ${portrait ? "" : "items-center"}`}>
          <span className="font-semibold uppercase" style={{ fontSize: 10, letterSpacing: "0.3em", color: GOLD }}>{member.role}</span>
          <span className="mt-1.5 font-semibold text-white" style={{ fontSize: portrait ? 20 : 26, lineHeight: 1.1, letterSpacing: "-0.01em" }}>{member.name}</span>
          <span className="mt-2.5 text-white" style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.88, display: "-webkit-box", WebkitLineClamp: portrait ? 2 : 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{member.bio}</span>
          <span className="mt-4 inline-flex items-center gap-2 font-semibold uppercase" style={{ fontSize: 10.5, letterSpacing: "0.26em", color: GOLD }}>
            View profile
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="transition group-hover:translate-x-1"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
        </span>
      </span>
    </button>
  );
}

function MemberDetail({ member, portrait, onClose }: { member: TeamMember; portrait: boolean; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-[80] flex items-center justify-center" role="dialog" aria-modal="true" aria-label={member.name} onClick={onClose} style={{ animation: "eventsRoomIn 0.35s ease-out both" }}>
      <div className="absolute inset-0" style={{ background: "rgba(4,8,20,0.8)", backdropFilter: "blur(10px)" }} aria-hidden />
      <div
        className={`relative flex overflow-hidden ${portrait ? "h-full w-full flex-col" : "flex-row"}`}
        style={{ width: portrait ? "100%" : "min(92vw, 960px)", height: portrait ? "100%" : "auto", maxHeight: portrait ? "100%" : "86vh", borderRadius: portrait ? 0 : 14, background: "linear-gradient(160deg, rgba(20,31,63,0.97) 0%, rgba(10,15,31,0.99) 100%)", border: portrait ? "none" : "1px solid rgba(231,201,138,0.35)", boxShadow: "0 50px 120px rgba(0,0,0,0.7)", animation: "projPanelRise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex items-center justify-center" style={{ flex: portrait ? "0 0 42%" : "0 0 42%", background: "radial-gradient(ellipse at 50% 40%, rgba(37,99,235,0.35), rgba(5,9,26,1) 70%)", padding: 28 }}>
          <Portrait member={member} size={portrait ? "min(52vw, 240px)" : 260} />
          <img src={SITE.logoOnDark} alt="" className="absolute bottom-5 left-1/2 w-[38%] -translate-x-1/2 opacity-50" aria-hidden />
        </div>
        <div className="relative min-h-0 flex-1 overflow-y-auto" style={{ padding: portrait ? "22px 22px 30px" : "40px 44px" }}>
          <button type="button" onClick={onClose} aria-label={ABOUT_ROOM.close} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:brightness-125" style={{ background: "rgba(10,15,31,0.7)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
          <p className="font-semibold uppercase" style={{ fontSize: 10.5, letterSpacing: "0.3em", color: GOLD }}>{member.role}</p>
          <h2 className="mt-3 font-semibold text-white" style={{ fontSize: portrait ? 26 : "clamp(1.6rem, 2.6vw, 2.4rem)", lineHeight: 1.1, letterSpacing: "-0.01em", paddingRight: 44 }}>{member.name}</h2>
          <div className="mt-4 h-px w-12" style={{ background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
          <p className="mt-4 text-white/82" style={{ fontSize: portrait ? 15 : 16, lineHeight: 1.65 }}>{member.bio}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {member.links.map((l) => (
              <a key={l.url} href={l.url} target={l.url.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="rounded-sm px-4 py-2 font-semibold text-white uppercase transition hover:brightness-110" style={{ fontSize: 10.5, letterSpacing: "0.22em", background: "rgba(37,99,235,0.85)" }}>
                {l.label}
              </a>
            ))}
            <a href={ABOUT_CONTACT.instagram} target="_blank" rel="noopener noreferrer" className="rounded-sm px-4 py-2 font-semibold uppercase transition hover:brightness-125" style={{ fontSize: 10.5, letterSpacing: "0.22em", color: GOLD, border: "1px solid rgba(231,201,138,0.5)" }}>
              {ABOUT_CONTACT.instagramHandle}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
