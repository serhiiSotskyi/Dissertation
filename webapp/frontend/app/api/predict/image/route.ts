import { NextResponse } from "next/server";

import { proxyToBackend } from "@/lib/backend";

export async function POST(request: Request) {
  try {
    return await proxyToBackend(request, "/predict/image");
  } catch {
    return NextResponse.json(
      { detail: "The Python inference API is unavailable. Start the Railway/FastAPI service first." },
      { status: 503 },
    );
  }
}
