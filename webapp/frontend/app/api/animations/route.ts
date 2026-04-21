import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { getAnimationPath } from "@/lib/server-data";

function getContentType(filename: string) {
  const extension = path.extname(filename).toLowerCase();
  if (extension === ".json") {
    return "application/json";
  }
  if (extension === ".lottie") {
    return "application/octet-stream";
  }
  return "application/octet-stream";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const name = url.searchParams.get("name");
  if (!name) {
    return NextResponse.json({ detail: "Missing animation name." }, { status: 400 });
  }

  const targetPath = await getAnimationPath(name);
  if (!targetPath) {
    return NextResponse.json({ detail: "Animation not found." }, { status: 404 });
  }

  const file = await readFile(targetPath);
  return new Response(file, {
    status: 200,
    headers: {
      "content-type": getContentType(name),
      "cache-control": "public, max-age=3600",
    },
  });
}
