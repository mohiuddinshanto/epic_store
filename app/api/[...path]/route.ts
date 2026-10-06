import { gunzipSync, inflateSync, brotliDecompressSync } from "node:zlib";
import {
  HOP_BY_HOP,
  apiOrigin,
  proxyRequest,
  startApiServer,
} from "../../../lib/api-bridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function forward(request: Request): Promise<Response> {
  void startApiServer();
  const origin = await apiOrigin();
  const incoming = new URL(request.url);
  const method = request.method.toUpperCase();

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers[key] = value;
  });
  // Request uncompressed response from loopback express
  headers["accept-encoding"] = "identity";

  const body =
    method === "GET" || method === "HEAD" ? null : Buffer.from(await request.arrayBuffer());

  const upstream = await proxyRequest(
    origin,
    `${incoming.pathname}${incoming.search}`,
    method,
    headers,
    body,
  );

  let bodyBuffer: Buffer = upstream.body;
  const encoding = typeof upstream.headers["content-encoding"] === "string"
    ? upstream.headers["content-encoding"].toLowerCase().trim()
    : undefined;

  if (encoding === "gzip") {
    try { bodyBuffer = gunzipSync(bodyBuffer); } catch { /* ignore */ }
  } else if (encoding === "deflate") {
    try { bodyBuffer = inflateSync(bodyBuffer); } catch { /* ignore */ }
  } else if (encoding === "br") {
    try { bodyBuffer = brotliDecompressSync(bodyBuffer); } catch { /* ignore */ }
  }

  const responseHeaders = new Headers();
  for (const [key, value] of Object.entries(upstream.headers)) {
    if (value === undefined || HOP_BY_HOP.has(key.toLowerCase()) || key.toLowerCase() === "content-encoding") continue;
    if (Array.isArray(value)) {
      for (const item of value) responseHeaders.append(key, item);
    } else {
      responseHeaders.set(key, value);
    }
  }

  return new Response(new Uint8Array(bodyBuffer), {
    status: upstream.status,
    statusText: upstream.statusText || undefined,
    headers: responseHeaders,
  });
}

function handle(request: Request): Promise<Response> {
  return forward(request).catch((error: unknown) => {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[api-bridge] request failed:", error);
    return new Response(JSON.stringify({ error: "API bridge unavailable", detail }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;
export const OPTIONS = handle;