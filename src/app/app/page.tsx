import Link from "next/link";
import { SITE } from "@/config/site";

/**
 * On the live site, /app is a separate Flutter web application (the Platform) backed by its own API.
 * It is not part of the marketing site bundle, so this local mirror shows a landing page instead.
 */
export default function PlatformPlaceholder() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0f1f] px-6 text-center text-white">
      <img src={SITE.logoOnDark} alt={SITE.name} className="mb-8 w-[min(72vw,360px)]" />
      <p className="mb-3 text-[10px] tracking-[0.35em] text-[#2563eb] uppercase">Platform</p>
      <h1 className="mb-4 text-2xl font-medium text-[#ffffff] md:text-3xl" style={{ fontFamily: 'Poppins, Montserrat, sans-serif' }}>
        The platform is coming soon
      </h1>
      <p className="mb-8 max-w-md text-sm leading-relaxed text-white/60">
        This section will host the Level Up Com client platform.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <a
          href={`mailto:${SITE.email}`}
          target="_blank"
          rel="noopener noreferrer"
          className="aradi-silver-lining px-6 py-3 text-[11px] tracking-[0.3em] text-[#ffffff] uppercase transition hover:brightness-110"
          style={{ background: "linear-gradient(180deg, rgba(20,31,63,0.92), rgba(10,15,31,0.96))" }}
        >
          Contact us
        </a>
        <Link href="/" className="text-[10px] tracking-[0.28em] text-white/50 uppercase transition hover:text-[#2563eb]">
          Back to home
        </Link>
      </div>
    </main>
  );
}
