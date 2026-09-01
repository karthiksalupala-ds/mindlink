/**
 * Image generation — Pollinations free endpoint.
 * Stronger prompts = better quality without paid APIs.
 */

export function buildThoughtImageUrl(prompt: string, seed?: number): string {
  const clean = prompt
    .slice(0, 180)
    .replace(/[^\w\s\-.,!?']/g, "")
    .trim();

  const full = [
    "cinematic concept art",
    "soft volumetric light",
    "minimal symbolic composition",
    "high detail",
    "no text no watermark",
    clean,
  ].join(", ");

  const encoded = encodeURIComponent(full);
  const s = seed ?? Math.floor(Math.random() * 99999);
  return `https://image.pollinations.ai/prompt/${encoded}?width=768&height=512&seed=${s}&nologo=true&enhance=true`;
}

export async function generateThoughtImage(prompt: string): Promise<string> {
  return buildThoughtImageUrl(prompt);
}
