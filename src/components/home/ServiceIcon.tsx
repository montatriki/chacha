"use client";

/** Thin gold line icons for the services, clients and steps galleries. */
export function ServiceIcon({ name, size = 24 }: { name?: string; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "globe":
      return <svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.6 2.6 2.6 14.4 0 17M12 3.5c-2.6 2.6-2.6 14.4 0 17" /></svg>;
    case "megaphone":
      return <svg {...p}><path d="M4 10v4a1 1 0 001 1h2l7 4V5L7 9H5a1 1 0 00-1 1z" /><path d="M17 9.5a3 3 0 010 5M7 15l1 4h2.5" /></svg>;
    case "search":
      return <svg {...p}><circle cx="10.5" cy="10.5" r="6" /><path d="M15 15l5 5M8 10.5h5M10.5 8v5" /></svg>;
    case "instagram":
      return <svg {...p}><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.5" /><circle cx="16.8" cy="7.2" r=".7" fill="currentColor" /></svg>;
    case "camera":
      return <svg {...p}><path d="M4 8.5h3l1.5-2.5h7L17 8.5h3v10H4z" /><circle cx="12" cy="13.5" r="3" /></svg>;
    case "billboard":
      return <svg {...p}><rect x="3.5" y="5" width="17" height="10" rx="1.5" /><path d="M9 15v5M15 15v5M7 20h10M7 9h6M7 12h9" /></svg>;
    case "sign":
      return <svg {...p}><path d="M12 3v18M6 6h11l2 2.5L17 11H6z" /><path d="M8 20h8" /></svg>;
    case "store":
      return <svg {...p}><path d="M4 9l1.5-4h13L20 9M4 9v11h16V9M4 9c1.5 2 3.5 2 5 0 1.5 2 4.5 2 6 0 1.5 2 3.5 2 5 0" /><path d="M10 20v-6h4v6" /></svg>;
    case "display":
      return <svg {...p}><rect x="4" y="4" width="16" height="11" rx="1.5" /><path d="M12 15v5M8 20h8M8 8.5h8M8 11.5h5" /></svg>;
    case "stand":
      return <svg {...p}><path d="M5 20h14M7 20V9h10v11M7 9L5 5h14l-2 4" /><path d="M10 13h4" /></svg>;
    case "event":
      return <svg {...p}><path d="M8 3v3M16 3v3M4 8h16M5 5h14v15H5z" /><path d="M12 11l1.2 2.4 2.6.4-1.9 1.8.5 2.6L12 17l-2.4 1.2.5-2.6-1.9-1.8 2.6-.4z" /></svg>;
    case "brief":
      return <svg {...p}><path d="M7 3.5h7l4 4v13H7z" /><path d="M14 3.5v4h4M10 12h5M10 15.5h5M10 8.5h2" /></svg>;
    case "create":
      return <svg {...p}><path d="M4 20l3.5-1 10-10-2.5-2.5-10 10z" /><path d="M13 8.5l2.5 2.5M17 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" /></svg>;
    case "launch":
      return <svg {...p}><path d="M13 4c3.5.5 6 3.5 6.5 7l-4 1-3.5-3.5z" /><path d="M9.5 8.5L5 10l3 3 3 3 1.5-4.5M8 16l-3 3M10 18.5l-1 1M6.5 15l-1 1" /></svg>;
    case "cosmetics":
      return <svg {...p}><path d="M9 3h6v5H9zM8 8h8l1 13H7z" /><path d="M10 12h4" /></svg>;
    case "gem":
      return <svg {...p}><path d="M7 4h10l4 5-9 12L3 9z" /><path d="M3 9h18M9 4l3 5 3-5M7 9l5 12M17 9l-5 12" /></svg>;
    case "building":
      return <svg {...p}><path d="M4 21V5l7-2v18M11 21h9V9h-9" /><path d="M7 8h1M7 12h1M7 16h1M14 12h3M14 16h3" /></svg>;
    case "sport":
      return <svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5v17M4.5 9.5c3 1 12 1 15 0M4.5 14.5c3-1 12-1 15 0" /></svg>;
    case "leaf":
      return <svg {...p}><path d="M5 19C5 9 11 5 20 4c-1 9-5 15-15 15z" /><path d="M5 19c3-5 7-8 11-10" /></svg>;
    case "cup":
      return <svg {...p}><path d="M5 8h12v6a5 5 0 01-5 5H10a5 5 0 01-5-5z" /><path d="M17 10h2a2 2 0 010 4h-2M6 21h10M8 5c0-1 1-1 1-2M12 5c0-1 1-1 1-2" /></svg>;
    case "silver":
      return <svg {...p}><path d="M4 12h16M6 12a6 6 0 0112 0" /><path d="M12 6V4M10 4h4M4 16h16M8 16v4M16 16v4" /></svg>;
    case "hanger":
      return <svg {...p}><path d="M12 8a2 2 0 10-2-2" /><path d="M12 8v2l-9 6.5V19h18v-2.5L12 10" /></svg>;
    case "couture":
      return <svg {...p}><path d="M9 3l3 3 3-3 3 3-3 7 3 8H6l3-8-3-7z" /><path d="M12 6v14" /></svg>;
    case "hotel":
      return <svg {...p}><path d="M3 20h18M4 20V5h16v15" /><path d="M8 9h2M14 9h2M8 13h2M14 13h2M10 20v-4h4v4" /></svg>;
    case "factory":
      return <svg {...p}><path d="M3 21V10l5 3v-3l5 3v-3l5 3v8z" /><path d="M6 8V4h3v4M8 17h2M13 17h2" /></svg>;
    default:
      return <svg {...p}><path d="M12 3l1.8 4.6 4.7 1.8-4.7 1.8L12 16l-1.8-4.8-4.7-1.8 4.7-1.8z" /><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" /></svg>;
  }
}
