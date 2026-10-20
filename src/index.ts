#!/usr/bin/env node
import { statSync } from "node:fs";
import { basename, resolve } from "node:path";
import { exit, stderr, stdout } from "node:process";

import { bannerFor } from "./banner.ts";
import { parseArgs, USAGE } from "./cli.ts";
import { startServer, type RunningServer } from "./server.ts";

type ResolvedFile = {
  readonly path: string;
  readonly name: string;
  readonly size: number;
};

const fail: (message: string) => never = (message) => {
  stderr.write(`serveit: ${message}\n\n${USAGE}`);
  exit(1);
};

const resolveFile = (filePath: string): ResolvedFile => {
  const absolute = resolve(filePath);
  const stats = statSync(absolute, { throwIfNoEntry: false });
  if (stats === undefined) {
    fail(`no such file: ${filePath}`);
  }
  if (!stats.isFile()) {
    fail(`${filePath} is not a regular file`);
  }
  return { path: absolute, name: basename(absolute), size: stats.size };
};

const startServing = async (file: ResolvedFile, port: number): Promise<RunningServer> => {
  try {
    return await startServer({ filePath: file.path, port });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EADDRINUSE") {
      fail(`port ${port} is already in use (pick another with --port)`);
    }
    throw error;
  }
};

const shutdown = async (running: RunningServer): Promise<void> => {
  await running.close();
  exit(0);
};

const main = async (): Promise<void> => {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.kind === "help") {
    stdout.write(USAGE);
    return;
  }
  if (parsed.kind === "error") {
    fail(parsed.message);
  }
  const file = resolveFile(parsed.filePath);
  const running = await startServing(file, parsed.port);
  stdout.write(
    `${bannerFor({
      displayPath: file.path,
      name: file.name,
      size: file.size,
      port: running.port,
    })}\n`,
  );
  process.once("SIGINT", () => {
    void shutdown(running);
  });
};

await main();
