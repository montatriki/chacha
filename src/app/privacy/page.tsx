import Link from "next/link";
import privacy from "@data/content/privacy.json";
import { COPY, SITE } from "@/config/site";

type Group = { title: string; items: string[] };
type Section = { heading: string; lead?: string; groups?: Group[]; items?: string[]; paragraphs?: string[]; contact?: boolean };

export default function PrivacyPage() {
  const sections = privacy.sections as Section[];
  return (
    <div className="min-h-screen bg-[#0a0f1f] text-white">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img src={SITE.backgroundImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1f]/90 via-[#0a0f1f]/85 to-[#0a0f1f]/95" />
      </div>
      <div className="relative z-10">
        <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6 md:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
          >
            <img src={SITE.logoOnDark} alt={SITE.name} className="h-8 w-auto md:h-9" />
          </Link>
          <Link
            href="/"
            className="text-[10px] tracking-[0.28em] text-white/45 uppercase transition hover:text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
          >
            {privacy.back}
          </Link>
        </header>
        <main className="mx-auto max-w-3xl px-6 pb-16 md:px-8">
          <article className="border border-white/10 bg-black/35 px-6 py-8 backdrop-blur-md md:px-10 md:py-12" style={{ fontFamily: 'Poppins, Montserrat, sans-serif' }}>
            <header className="mb-10 border-b border-white/10 pb-8">
              <p className="mb-3 text-[10px] font-sans tracking-[0.35em] text-[#2563eb] uppercase">{privacy.eyebrow}</p>
              <h1 className="mb-3 text-3xl font-medium tracking-wide text-[#ffffff] md:text-4xl">{privacy.title}</h1>
              <p className="font-sans text-sm text-white/50">{privacy.effectiveDate}</p>
            </header>
            <div className="space-y-8 font-sans text-sm leading-relaxed text-white/65 md:text-[15px]">
              {privacy.intro.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {sections.map((s) => (
                <section key={s.heading}>
                  <h2 className="mb-3 text-lg font-medium text-[#ffffff]">{s.heading}</h2>
                  {s.lead && <p className={s.groups ? "mb-4" : "mb-3"}>{s.lead}</p>}
                  {s.groups?.map((g, gi) => (
                    <div key={g.title}>
                      <h3 className="mb-2 text-base text-white/85">{g.title}</h3>
                      <ul className={`${gi === s.groups!.length - 1 ? "" : "mb-4 "}list-disc space-y-1 pl-6`}>
                        {g.items.map((it) => (
                          <li key={it}>{it}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {s.items && (
                    <ul className="list-disc space-y-1 pl-6">
                      {s.items.map((it) => (
                        <li key={it}>{it}</li>
                      ))}
                    </ul>
                  )}
                  {s.paragraphs?.map((p, i) => (
                    <p key={p} className={s.contact || i < s.paragraphs!.length - 1 ? "mb-3" : undefined}>
                      {p}
                    </p>
                  ))}
                  {s.contact && (
                    <div className="space-y-1 text-white/85">
                      <p>Aradi</p>
                      <p>{SITE.legalName}</p>
                      <p>{SITE.address}</p>
                      <p>
                        <a href={`mailto:${SITE.email}`} className="text-[#2563eb] transition hover:text-[#ffffff]">
                          {SITE.email}
                        </a>
                      </p>
                      <p>
                        <a href={SITE.websiteUrl} className="text-[#2563eb] transition hover:text-[#ffffff]" target="_blank" rel="noopener noreferrer">
                          {SITE.website}
                        </a>
                      </p>
                    </div>
                  )}
                </section>
              ))}
            </div>
          </article>
          <footer className="mt-10 space-y-2 border-t border-white/10 pt-8 text-center">
            <div className="flex items-center justify-center gap-2">
              <img src={SITE.logoOnDark} alt={SITE.name} className="h-7 w-auto" />
            </div>
            <p className="text-[10px] text-white/40">by {SITE.legalName}</p>
            <p className="text-[9px] leading-relaxed text-white/35">
              {SITE.address}
              <span className="mx-1.5 text-white/25">·</span>
              <a href={SITE.websiteUrl} className="transition hover:text-white/55" target="_blank" rel="noopener noreferrer">
                {SITE.website}
              </a>
            </p>
            <p className="text-[9px] text-white/30">
              © {new Date().getFullYear()} {COPY.footer.rights}
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
