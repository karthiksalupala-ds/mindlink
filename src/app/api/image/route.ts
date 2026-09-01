import { NextRequest, NextResponse } from "next/server";
import { buildThoughtImageUrl } from "@/lib/images";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt?.trim()) {
      return NextResponse.json({ error: "prompt required" }, { status: 400 });
    }
    const url = buildThoughtImageUrl(prompt);
    return NextResponse.json({ url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
