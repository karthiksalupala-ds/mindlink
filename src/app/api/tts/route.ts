import { NextRequest, NextResponse } from "next/server";
import { groqTTS, getGroqKey } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }
    if (!getGroqKey()) {
      return NextResponse.json({ error: "GROQ_API_KEY not set", audio: null }, { status: 200 });
    }
    const buf = await groqTTS(text);
    if (!buf) {
      return NextResponse.json({ error: "TTS failed", audio: null }, { status: 200 });
    }
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
