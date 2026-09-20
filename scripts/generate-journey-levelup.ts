/**
 * Regenerate the journey film from 00:08 with a LEVEL UP building instead of the ARADI "A".
 *
 * Start frame: the exact 00:08 frame of the original (empty plot, city behind).
 * End frame:   the original's final frame (the bronze door), so the hallway scene still matches.
 * Model:       bytedance/seedance-2.5/image-to-video (needs public image URLs -> we upload the
 *              frames to Higgsfield storage first with the SDK's uploadImage helper).
 *
 * Run:  npm run video:journey         (billable)
 * Then: scripts/assemble-journey.sh public/data/videos/generated/journey-levelup-segment.mp4
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { HiggsfieldClient } from "@higgsfield/client";
import { config, higgsfield } from "@higgsfield/client/v2";

const MODEL = "bytedance/seedance-2.5/image-to-video";
const OUT_DIR = "public/data/videos/generated";

// Two deliverables: desktop keeps the original 16:9 framing, mobile is a 9:16 centre crop.
//   npm run video:journey            -> both
//   npm run video:journey -- desktop -> one variant
const VARIANTS = {
  desktop: {
    aspect: "16:9",
    start: "public/data/videos/source-frames/journey-08s-start.png",
    end: "public/data/videos/source-frames/journey-end-door.png",
    out: `${OUT_DIR}/journey-levelup-segment.mp4`,
  },
  mobile: {
    aspect: "9:16",
    start: "public/data/videos/source-frames/journey-08s-start-portrait.png",
    end: "public/data/videos/source-frames/journey-end-door-portrait.png",
    out: `${OUT_DIR}/journey-levelup-segment-portrait.mp4`,
  },
} as const;
type VariantName = keyof typeof VARIANTS;

// Original runs 00:08 -> 00:18.17, so the new segment covers ~10 s.
const DURATION = 10;

const PROMPT = [
  "Continuous aerial shot, same camera, same dusk light, same Dubai skyline and glowing highways.",
  "On the empty central plot a monumental corporate headquarters rises: a wide building shaped like a rounded square icon",
  "holding three long horizontal glass slabs stacked like the letter E; the top and bottom slabs are dark navy glass,",
  "the middle slab glows electric blue (#2563EB). Landscaped gardens, palm trees and lit pools surround it.",
  "The camera slowly flies forward and descends toward the building's grand entrance and finishes framing a tall",
  "bronze double door set in warm white marble with vertical light strips on both sides.",
  "Photorealistic architectural visualization, cinematic, smooth camera move, warm streetlights, no text, no letters, no logos on the facade.",
].join(" ");

type Status = "queued" | "in_progress" | "completed" | "failed" | "nsfw";
interface Result { status: Status; request_id: string; video?: { url: string } }

/**
 * Upload a local file to Higgsfield storage and return its public URL.
 * SDK 0.2.6's uploadImage() drops the `upload_headers` (x-amz-tagging) that the presigned
 * S3 URL is signed with, so S3 answers 403 SignatureDoesNotMatch. We do the PUT ourselves.
 */
async function upload(client: HiggsfieldClient, path: string): Promise<string> {
  const bytes = await readFile(path);
  const http = (client as unknown as { client: { post: (u: string, b: unknown) => Promise<{ data: PresignResponse }> } }).client;
  const { data } = await http.post("/files/generate-upload-url", { content_type: "image/png" });
  const res = await fetch(data.upload_url, { method: "PUT", body: bytes, headers: data.upload_headers ?? { "Content-Type": "image/png" } });
  if (!res.ok) throw new Error(`S3 upload failed: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  console.log(`uploaded ${path} -> ${data.public_url}`);
  return data.public_url;
}
interface PresignResponse {
  public_url: string;
  upload_url: string;
  content_type: string;
  upload_headers?: Record<string, string>;
}

async function generate(v1: HiggsfieldClient, name: VariantName): Promise<number> {
  const variant = VARIANTS[name];
  console.log(`\n=== ${name} (${variant.aspect}) ===`);
  let imageUrl: string;
  let endImageUrl: string;
  try {
    imageUrl = await upload(v1, variant.start);
    endImageUrl = await upload(v1, variant.end);
  } catch (err) {
    console.error("Frame upload failed:", err instanceof Error ? err.message : err);
    return 1;
  }

  console.log(`Submitting ${DURATION}s ${variant.aspect} segment to ${MODEL} …`);
  const started = Date.now();
  let result: Result;
  try {
    result = (await higgsfield.subscribe(MODEL, {
      input: {
        image_url: imageUrl,
        end_image_url: endImageUrl,
        prompt: PROMPT,
        duration: DURATION,
        resolution: "720p",
        aspect_ratio: variant.aspect,
        generate_audio: false,
      },
      withPolling: true,
    })) as Result;
  } catch (err) {
    console.error("Generation failed before completion:", err instanceof Error ? err.message : err);
    return 1;
  }
  const secs = Math.round((Date.now() - started) / 1000);

  if (result.status !== "completed" || !result.video?.url) {
    const why = result.status === "nsfw" ? "blocked by moderation" : result.status === "failed" ? "failed on the server" : `ended in state "${result.status}"`;
    console.error(`Request ${result.request_id} ${why}; no video produced.`);
    return 1;
  }
  console.log(`Completed in ${secs}s (request ${result.request_id})`);
  console.log(`Video URL: ${result.video.url}`);

  const res = await fetch(result.video.url);
  if (!res.ok) {
    console.error(`Download failed: HTTP ${res.status}`);
    return 1;
  }
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(variant.out, Buffer.from(await res.arrayBuffer()));
  console.log(`Saved ${variant.out}`);
  return 0;
}

async function main(): Promise<number> {
  const credentials = process.env.HF_CREDENTIALS;
  if (!credentials || !credentials.includes(":")) {
    console.error("HF_CREDENTIALS missing (key-id:key-secret) in .env.local");
    return 2;
  }
  const [apiKey, apiSecret] = credentials.split(":");
  config({ credentials });
  const v1 = new HiggsfieldClient({ apiKey, apiSecret });

  const requested = process.argv.slice(2).filter((a): a is VariantName => a in VARIANTS);
  const names: VariantName[] = requested.length ? requested : ["desktop", "mobile"];
  let failures = 0;
  for (const name of names) failures += await generate(v1, name);
  if (failures === 0) {
    console.log("\nNext: scripts/assemble-journey.sh desktop && scripts/assemble-journey.sh mobile");
  }
  return failures ? 1 : 0;
}

main().then((code) => process.exit(code));
