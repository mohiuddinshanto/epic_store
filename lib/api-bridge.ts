import { createServer, request as httpRequest, type Server } from "node:http";
import type { Express } from "express";

export const HOP_BY_HOP = new Set([
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

export const UPSTREAM_TIMEOUT_MS = Number(process.env.API_BRIDGE_TIMEOUT_MS || 20000);

export type Upstream = {
  status: number;
  statusText: string;
  headers: Record<string, string | string[] | undefined>;
  body: Buffer;
};

let apiHandle: Promise<Server> | null = null;

async function loadApiApp() {
  const apiModule = await import("../api/server");
  const apiApp = apiModule.default as unknown as Express;
  apiApp.set("trust proxy", 1);
  return apiApp;
}

export function startApiServer(): Promise<Server> {
  if (!apiHandle) {
    apiHandle = (async () => {
      const apiApp = await loadApiApp();
      const server: Server = createServer(apiApp);
      await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", () => resolve());
      });
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      console.log(`[api-bridge] listening on 127.0.0.1:${port}`);
      return server;
    })().catch((error) => {
      apiHandle = null;
      throw error;
    });
  }
  return apiHandle;
}

export async function warmApi(): Promise<void> {
  const server = await startApiServer();
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const probe = await fetch(`http://127.0.0.1:${port}/api/store/status`, {
    cache: "no-store",
  }).catch(() => null);
  console.log(`[api-bridge] warm probe status=${probe ? probe.status : "failed"}`);
}

export async function apiOrigin(): Promise<string> {
  const server = await startApiServer();
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  return `http://127.0.0.1:${port}`;
}

export function proxyRequest(
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
    req.setTimeout(UPSTREAM_TIMEOUT_MS, () => {
      req.destroy(new Error(`API did not respond within ${UPSTREAM_TIMEOUT_MS}ms`));
    });
    req.on("error", reject);
    if (body && body.length) req.end(body);
    else req.end();
  });
}