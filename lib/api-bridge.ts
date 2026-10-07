import { createServer, request as httpRequest, type Server } from "node:http";
import net from "node:net";
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
let activePort = Number(process.env.API_BRIDGE_PORT || 41235);

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
      const tryPorts = [activePort, 41236, 41237, 41238, 41239];
      let started = false;

      for (const p of tryPorts) {
        try {
          await new Promise<void>((resolve, reject) => {
            const onError = (err: unknown) => {
              server.removeListener("error", onError);
              reject(err);
            };
            server.once("error", onError);
            Reflect.apply(net.Server.prototype.listen, server, [
              p,
              "127.0.0.1",
              () => {
                server.removeListener("error", onError);
                activePort = p;
                resolve();
              },
            ]);
          });
          started = true;
          console.log(`[api-bridge] listening on 127.0.0.1:${activePort}`);
          break;
        } catch {
          // Port busy, try next port
        }
      }

      if (!started) {
        throw new Error("Could not bind API bridge server to any loopback port");
      }
      return server;
    })().catch((error) => {
      apiHandle = null;
      throw error;
    });
  }
  return apiHandle;
}

export async function warmApi(): Promise<void> {
  await startApiServer();
  const probe = await fetch(`http://127.0.0.1:${activePort}/api/store/status`, {
    cache: "no-store",
  }).catch(() => null);
  console.log(`[api-bridge] warm probe status=${probe ? probe.status : "failed"}`);
}

export async function apiOrigin(): Promise<string> {
  await startApiServer();
  return `http://127.0.0.1:${activePort}`;
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