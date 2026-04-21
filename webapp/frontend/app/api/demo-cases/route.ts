import { NextResponse } from "next/server";

import { proxyToBackend } from "@/lib/backend";
import { buildLocalDemoCases } from "@/lib/server-data";

export async function GET(request: Request) {
  try {
    const response = await proxyToBackend(request, "/demo-cases");
    return response;
  } catch {
    return NextResponse.json(await buildLocalDemoCases(), { status: 200 });
  }
}
