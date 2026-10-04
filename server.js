"use strict";

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const rootDir = __dirname;

require("dotenv").config({ path: path.join(rootDir, ".env") });

const dev = process.argv.includes("--dev") || process.env.NODE_ENV === "development";
process.env.NODE_ENV = dev ? "development" : "production";

const express = require("express");
const next = require("next");

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";

process.env.UPLOADS_DIR = path.join(rootDir, "public", "uploads");

const compiledApi = path.join(rootDir, "dist", "server.js");

function loadApiApp() {
  if (dev) return require("./api/server.ts").default;
  if (!fs.existsSync(compiledApi)) {
    throw new Error("dist/server.js is missing. Run `npm run build` before `npm start`.");
  }
  return require(compiledApi).default;
}

async function main() {
  const nextApp = next({ dev, dir: rootDir, hostname: host, port });
  const handle = nextApp.getRequestHandler();

  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  const api = loadApiApp();

  app.use(
    "/uploads",
    express.static(process.env.UPLOADS_DIR, { maxAge: "30d", fallthrough: true, index: false }),
  );
  app.use(api);
  app.use((req, res) => handle(req, res));

  await nextApp.prepare();

  http
    .createServer(app)
    .listen(port, host, () =>
      console.log(`store ready on http://${host}:${port} (${dev ? "development" : "production"})`),
    );
}

main().catch((error) => {
  console.error("failed to start store server:", error);
  process.exit(1);
});