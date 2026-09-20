/**
 * Import photos and reels from an official Instagram data export into the Events room.
 *
 * Instagram blocks anonymous scraping, so the supported path is the account's own export:
 *   Instagram app -> Settings -> Your activity -> Download your information -> JSON
 * Unzip it, then run:
 *   npm run events:import -- /path/to/instagram-export
 *
 * What it does
 *   - reads your_instagram_activity/media/{posts_1,reels,stories,archived_posts}.json (any that exist)
 *   - copies every image/video into public/data/events/instagram/
 *   - matches each item to an event in public/data/content/events.json by keywords in the caption
 *     (event id, client name or title words) and appends it to that event's `media`
 *   - unmatched items are listed at the end so you can assign them by hand
 */
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const EXPORT_DIR = process.argv[2];
const EVENTS_JSON = "public/data/content/events.json";
const OUT_DIR = "public/data/events/instagram";
const PUBLIC_PREFIX = "/data/events/instagram";

interface ExportMedia { uri: string; title?: string; creation_timestamp?: number }
interface ExportPost { media?: ExportMedia[]; title?: string; creation_timestamp?: number; uri?: string }
interface EventMedia { type: "image" | "video"; src: string; caption?: string }
interface EventItem { id: string; title: string; client: string; media: EventMedia[]; [k: string]: unknown }

const decode = (s: string) => {
  // Instagram exports UTF-8 text as latin1 escape sequences.
  try { return Buffer.from(s, "latin1").toString("utf8"); } catch { return s; }
};
const norm = (s: string) => decode(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

async function exists(p: string) { try { await stat(p); return true; } catch { return false; } }

async function findMediaJson(root: string): Promise<string[]> {
  const out: string[] = [];
  const walk = async (dir: string, depth: number) => {
    if (depth > 5) return;
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await walk(p, depth + 1);
      else if (/^(posts_\d+|reels|stories|archived_posts|profile_photos)\.json$/i.test(e.name)) out.push(p);
    }
  };
  await walk(root, 0);
  return out;
}

async function main() {
  if (!EXPORT_DIR || !(await exists(EXPORT_DIR))) {
    console.error("Usage: npm run events:import -- /path/to/unzipped-instagram-export");
    process.exit(2);
  }
  const events = JSON.parse(await readFile(EVENTS_JSON, "utf8")) as { events: EventItem[]; [k: string]: unknown };
  const files = await findMediaJson(EXPORT_DIR);
  if (!files.length) {
    console.error("No posts/reels/stories JSON found under", EXPORT_DIR);
    process.exit(1);
  }
  await mkdir(OUT_DIR, { recursive: true });

  const keywords = events.events.map((ev) => ({
    ev,
    keys: [ev.id, ev.client, ...ev.title.split(/[\s·•|,]+/)].map(norm).filter((k) => k.length > 2),
  }));

  let copied = 0;
  const unmatched: string[] = [];
  for (const file of files) {
    const raw = JSON.parse(await readFile(file, "utf8"));
    const posts: ExportPost[] = Array.isArray(raw) ? raw : Object.values(raw).flat() as ExportPost[];
    for (const post of posts) {
      const items: ExportMedia[] = post.media ?? (post.uri ? [{ uri: post.uri, title: post.title, creation_timestamp: post.creation_timestamp }] : []);
      const caption = norm(post.title ?? items[0]?.title ?? "");
      for (const m of items) {
        const src = path.join(EXPORT_DIR, m.uri);
        if (!(await exists(src))) continue;
        const ext = path.extname(src).toLowerCase();
        const type: EventMedia["type"] = [".mp4", ".mov", ".webm"].includes(ext) ? "video" : "image";
        const name = `${path.basename(path.dirname(src))}-${path.basename(src)}`.replace(/[^a-z0-9._-]/gi, "_");
        const dest = path.join(OUT_DIR, name);
        if (!(await exists(dest))) { await copyFile(src, dest); copied++; }
        const publicSrc = `${PUBLIC_PREFIX}/${name}`;
        const itemCaption = norm(m.title ?? "") || caption;
        const hit = keywords.find((k) => k.keys.some((key) => itemCaption.includes(key)));
        if (hit) {
          if (!hit.ev.media.some((x) => x.src === publicSrc)) hit.ev.media.push({ type, src: publicSrc, caption: decode(m.title ?? post.title ?? "").slice(0, 140) || undefined });
        } else {
          unmatched.push(`${publicSrc}  ${decode(m.title ?? post.title ?? "").slice(0, 60)}`);
        }
      }
    }
  }
  await writeFile(EVENTS_JSON, JSON.stringify(events, null, 2) + "\n");
  console.log(`copied ${copied} files to ${OUT_DIR}`);
  for (const ev of events.events) console.log(`  ${ev.id}: ${ev.media.length} media`);
  if (unmatched.length) {
    console.log(`\n${unmatched.length} items did not match an event (add them to events.json by hand):`);
    unmatched.slice(0, 40).forEach((u) => console.log("  " + u));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
