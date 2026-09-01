import { NextRequest, NextResponse } from "next/server";
import { groqTTS, getGroqKey } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = (body?.text || "").trim();
    if (!text) {
      return NextResponse.json({ error: "text required", audio: null }, { status: 400 });
    }
    if (!getGroqKey()) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not set — voice needs a key", audio: null },
        { status: 200 }
      );
    }
    const buf = await groqTTS(text);
    if (!buf) {
      return NextResponse.json(
        { error: "TTS unavailable for this key/model", audio: null },
        { status: 200 }
      );
    }
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "tts failed", audio: null }, { status: 200 });
  }
}
