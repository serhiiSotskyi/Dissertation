import { NextResponse } from "next/server";

import { proxyToBackend } from "@/lib/backend";
import { getLocalHealthSummary } from "@/lib/server-data";

export async function GET(request: Request) {
  try {
    const response = await proxyToBackend(request, "/health");
    return response;
  } catch {
    return NextResponse.json(await getLocalHealthSummary(), { status: 200 });
  }
}
