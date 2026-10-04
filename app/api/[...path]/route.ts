import { createServer, request as httpRequest, type Server } from "node:http";
import apiApp from "../../../api/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ApiHandle = { origin: string };

let apiHandle: Promise<ApiHandle> | null = null;

function startApiServer(): Promise<ApiHandle> {
  if (!apiHandle) {
    apiHandle = (async () => {
      apiApp.set("trust proxy", 1);
      const server: Server = createServer(apiApp);
      await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", () => resolve());
      });
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      console.log(`api bridge listening on 127.0.0.1:${port}`);
      return { origin: `http://127.0.0.1:${port}` };
    })().catch((error) => {
      apiHandle = null;
      throw error;
    });
  }
  return apiHandle;
}

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
  "content-encoding",
]);

type Upstream = {
  status: number;
  statusText: string;
  headers: Record<string, string | string[] | undefined>;
  body: Buffer;
};

function proxy(
  origin: string,
  pathname: string,
  method: string,
  headers: Record<string, string>,
  body: Buffer | null,
): Promise<Upstream> {
  return new Promise((resolve, reject) => {
    const req = httpRequest(`${origin}${pathname}`, { method, headers }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () =>
        resolve({
          status: res.statusCode ?? 502,
          statusText: res.statusMessage ?? "",
          headers: res.headers,
          body: Buffer.concat(chunks),
        }),
      );
      res.on("error", reject);
    });
    req.on("error", reject);
    if (body && body.length) req.end(body);
    else req.end();
  });
}

async function forward(request: Request): Promise<Response> {
  const { origin } = await startApiServer();
  const incoming = new URL(request.url);
  const method = request.method.toUpperCase();

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers[key] = value;
  });

  const body =
    method === "GET" || method === "HEAD" ? null : Buffer.from(await request.arrayBuffer());

  const upstream = await proxy(
    origin,
    `${incoming.pathname}${incoming.search}`,
    method,
    headers,
    body,
  );

  const responseHeaders = new Headers();
  for (const [key, value] of Object.entries(upstream.headers)) {
    if (value === undefined || HOP_BY_HOP.has(key.toLowerCase())) continue;
    if (Array.isArray(value)) {
      for (const item of value) responseHeaders.append(key, item);
    } else {
      responseHeaders.set(key, value);
    }
  }

  return new Response(new Uint8Array(upstream.body), {
    status: upstream.status,
    statusText: upstream.statusText || undefined,
    headers: responseHeaders,
  });
}

function handle(request: Request): Promise<Response> {
  return forward(request).catch((error: unknown) => {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("api bridge failed:", error);
    return new Response(JSON.stringify({ error: "API bridge unavailable", detail }), {
      status: 503,
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