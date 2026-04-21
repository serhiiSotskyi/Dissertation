import { readFile } from "node:fs/promises";

import { NextResponse } from "next/server";

import { getFigurePath } from "@/lib/server-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const targetPath = await getFigurePath(decodeURIComponent(name));
  if (!targetPath) {
    return NextResponse.json({ detail: "Figure not found." }, { status: 404 });
  }

  const file = await readFile(targetPath);
  return new Response(file, {
    status: 200,
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=3600",
    },
  });
}
