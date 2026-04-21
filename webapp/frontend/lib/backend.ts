const defaultBaseUrl = "http://127.0.0.1:8000";

function getBackendBaseUrl() {
  return process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? defaultBaseUrl;
}

export async function proxyToBackend(request: Request, pathname: string) {
  const targetUrl = new URL(pathname, getBackendBaseUrl());
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = Buffer.from(await request.arrayBuffer());
  }

  const response = await fetch(targetUrl, init);
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}
