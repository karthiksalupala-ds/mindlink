/**
 * Free image generation via Pollinations (no API key required).
 * Optional HF_TOKEN for Hugging Face later.
 */

export function buildThoughtImageUrl(prompt: string, seed?: number): string {
  const clean = prompt
    .slice(0, 200)
    .replace(/[^\w\s\-.,!?]/g, "")
    .trim();
  const full = `abstract conceptual illustration, soft lighting, modern minimal, thoughtful mood: ${clean}`;
  const encoded = encodeURIComponent(full);
  const s = seed ?? Math.floor(Math.random() * 99999);
  // Pollinations free endpoint
  return `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&seed=${s}&nologo=true`;
}

export async function generateThoughtImage(prompt: string): Promise<string> {
  // Returns URL immediately (Pollinations generates on fetch)
  return buildThoughtImageUrl(prompt);
}
