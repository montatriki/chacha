"use client";
import Link from "next/link";
import { COPY, SITE } from "@/config/site";

export function SiteFooter() {
  return (
    <div className="pointer-events-none absolute bottom-4 right-4 z-30 max-w-[min(92vw,20rem)] text-right md:bottom-5 md:right-6">
      <div className="space-y-2">
        <Link
          href="/privacy"
          className="pointer-events-auto inline-block text-[10px] tracking-[0.32em] uppercase transition hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e7c98a]"
          style={{ color: "rgba(231,201,138,0.85)" }}
        >
          {COPY.footer.privacy}
        </Link>
        <div className="flex items-center justify-end gap-2">
          <img src={SITE.logoOnDark} alt={SITE.name} className="h-7 w-auto opacity-90" />
        </div>
        <p className="hidden text-[10px] leading-relaxed text-white/40 lg:block">by {SITE.legalName}</p>
        <p className="hidden text-[9px] leading-snug text-white/35 lg:block">
          {SITE.address}
          <span className="mx-1.5 text-white/25">·</span>
          <a
            href={SITE.websiteUrl}
            className="pointer-events-auto underline-offset-2 transition hover:text-white/60 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {SITE.website}
          </a>
        </p>
        <p className="hidden text-[9px] tracking-wide text-white/30 lg:block">
          © {new Date().getFullYear()} {COPY.footer.rights}
        </p>
      </div>
    </div>
  );
}
