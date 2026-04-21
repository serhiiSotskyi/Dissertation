import { readFile } from "node:fs/promises";

import { NextResponse } from "next/server";

import { getNotebookPath } from "@/lib/server-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const targetPath = await getNotebookPath(decodedName);
  if (!targetPath) {
    return NextResponse.json({ detail: "Notebook not found." }, { status: 404 });
  }

  const file = await readFile(targetPath);
  return new Response(file, {
    status: 200,
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="${decodedName}"`,
      "cache-control": "public, max-age=3600",
    },
  });
}
