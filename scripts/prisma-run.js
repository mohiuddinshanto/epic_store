import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const enginesDir = resolve("node_modules", "@prisma", "engines");
const prismaCli = resolve("node_modules", "prisma", "build", "index.js");

function pick(names, candidates) {
  for (const candidate of candidates) {
    const exact = names.find((name) => name === candidate);
    if (exact) return exact;
  }
  return null;
}

function stageToTmp(name, envVar, env) {
  const source = join(enginesDir, name);
  if (!existsSync(source)) return false;

  try {
    chmodSync(source, 0o755);
    console.log(`[prisma-engine] chmod 755 on ${name}`);
  } catch {
    console.log(`[prisma-engine] chmod on ${name} was refused, staging a copy instead`);
  }

  const target = join(tmpdir(), `prisma-${name}`);
  try {
    copyFileSync(source, target);
    chmodSync(target, 0o755);
    env[envVar] = target;
    console.log(`[prisma-engine] ${name} -> ${target} (mode 755)`);
    return true;
  } catch (error) {
    console.log(`[prisma-engine] could not stage ${name}: ${error.message}`);
    return false;
  }
}

function prepareEngineEnv(env) {
  if (process.platform === "win32") return;

  if (!existsSync(enginesDir)) {
    console.log(`[prisma-engine] engines dir missing, skipping: ${enginesDir}`);
    return;
  }

  const names = readdirSync(enginesDir);

  const schemaEngine = pick(names, [
    "schema-engine-debian-openssl-1.1.x",
    "schema-engine-debian-openssl-3.0.x",
    "schema-engine-debian-musl-openssl-3.0.x",
  ]);
  if (schemaEngine) {
    stageToTmp(schemaEngine, "PRISMA_SCHEMA_ENGINE_BINARY", env);
  } else {
    console.log(`[prisma-engine] no schema-engine binary found in ${enginesDir}`);
  }

  const queryEngine = pick(names, [
    "libquery_engine-linux-musl-openssl-3.0.x.so",
    "libquery_engine-linux-musl-openssl-1.1.x.so",
    "libquery_engine-debian-openssl-3.0.x.so",
    "libquery_engine-debian-openssl-1.1.x.so",
  ]);
  if (queryEngine) {
    stageToTmp(queryEngine, "PRISMA_QUERY_ENGINE_LIBRARY", env);
  }
}

function main() {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.error("Usage: prisma-run <prisma args...>");
    process.exit(1);
  }

  const env = { ...process.env };
  prepareEngineEnv(env);

  if (!existsSync(prismaCli)) {
    console.error(`[prisma-engine] Prisma CLI not found at ${prismaCli}`);
    process.exit(1);
  }

  const result = spawnSync(process.execPath, [prismaCli, ...args], { stdio: "inherit", env });
  if (result.error) {
    console.error(`[prisma-engine] failed to run prisma: ${result.error.message}`);
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

main();