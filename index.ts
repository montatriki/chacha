/**
 * Higgsfield API example — Seedance 2.5 text-to-video via the official SDK.
 *
 * Run:  npm run video:example
 * Needs HF_CREDENTIALS="key-id:key-secret" in .env.local (git-ignored, loaded by Node's --env-file).
 * Server-side only: the v2 client refuses to run in a browser so the credential is never exposed.
 */
import { config, higgsfield } from "@higgsfield/client/v2";

const MODEL = "bytedance/seedance-2.5/text-to-video";

type Status = "queued" | "in_progress" | "completed" | "failed" | "nsfw";
interface GenerationResult {
  status: Status;
  request_id: string;
  video?: { url: string };
}

async function main(): Promise<number> {
  const credentials = process.env.HF_CREDENTIALS;
  if (!credentials || !credentials.includes(":")) {
    console.error("HF_CREDENTIALS is missing or not in key-id:key-secret format. Add it to .env.local.");
    return 2;
  }
  config({ credentials });

  console.log(`Submitting to ${MODEL} …`);
  const started = Date.now();
  let result: GenerationResult;
  try {
    result = (await higgsfield.subscribe(MODEL, {
      input: {
        prompt: "A cinematic scene at sunset",
        duration: 5,
        resolution: "720p",
        aspect_ratio: "16:9",
      },
      withPolling: true,
    })) as GenerationResult;
  } catch (err) {
    console.error("Request failed before completion:", err instanceof Error ? err.message : err);
    return 1;
  }
  const seconds = Math.round((Date.now() - started) / 1000);

  switch (result.status) {
    case "completed":
      if (!result.video?.url) {
        console.error(`Request ${result.request_id} reported completed but returned no video URL.`);
        return 1;
      }
      console.log(`Completed in ${seconds}s (request ${result.request_id})`);
      console.log(`Video URL: ${result.video.url}`);
      return 0;
    case "nsfw":
      console.error(`Request ${result.request_id} was blocked by content moderation (status: nsfw). No video was produced.`);
      return 1;
    case "failed":
      console.error(`Request ${result.request_id} failed on the server. No video was produced.`);
      return 1;
    default:
      // queued / in_progress / anything else: polling ended without a final state.
      console.error(`Request ${result.request_id} ended in state "${result.status}" (possibly canceled or timed out). No video URL available.`);
      return 1;
  }
}

main().then((code) => process.exit(code));
