import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { getDatasetImagePath } from "@/lib/server-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ detail: "Missing dataset image id." }, { status: 400 });
  }

  const targetPath = await getDatasetImagePath(id);
  if (!targetPath) {
    return NextResponse.json({ detail: "Dataset image not found." }, { status: 404 });
  }

  const file = await readFile(targetPath);
  return new Response(file, {
    status: 200,
    headers: {
      "content-type": `image/${path.extname(targetPath).replace(".", "")}`,
      "cache-control": "public, max-age=3600",
    },
  });
}
