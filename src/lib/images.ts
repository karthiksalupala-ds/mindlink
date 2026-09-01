/**
 * Free image generation via Pollinations (no API key required).
 */

export function buildThoughtImageUrl(prompt: string, seed?: number): string {
  const clean = prompt
    .slice(0, 200)
    .replace(/[^\w\s\-.,!?]/g, "")
    .trim();
  const full = `abstract conceptual illustration, soft lighting, modern minimal, thoughtful mood: ${clean}`;
  const encoded = encodeURIComponent(full);
  const s = seed ?? Math.floor(Math.random() * 99999);
  return `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&seed=${s}&nologo=true`;
}

export async function generateThoughtImage(prompt: string): Promise<string> {
  return buildThoughtImageUrl(prompt);
}
