import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawn, type ChildProcessByStdio } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { request as httpRequest } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Readable } from "node:stream";

const CLI = new URL("../src/index.ts", import.meta.url).pathname;
const CONTENT = "cli end to end\n";

type CliProcess = ChildProcessByStdio<null, Readable, Readable>;

let directory: string;

before(async () => {
  directory = await mkdtemp(join(tmpdir(), "serveit-cli-"));
  await writeFile(join(directory, "shared.txt"), CONTENT);
});

after(async () => {
  await rm(directory, { recursive: true, force: true });
});

const spawnCli = (args: string[]): CliProcess =>
  spawn(process.execPath, [CLI, ...args], { stdio: ["ignore", "pipe", "pipe"] });

const collectBanner = (child: CliProcess): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: string[] = [];
    child.stdout.on("data", (chunk: Buffer) => {
      chunks.push(chunk.toString());
      if (chunks.join("").includes("Press Ctrl+C to stop")) {
        resolve(chunks.join(""));
      }
    });
    child.once("error", reject);
    child.once("exit", (code) => reject(new Error(`exit ${code}: ${chunks.join("")}`)));
  });

const collectStderr = (child: CliProcess): Promise<string> =>
  new Promise((resolve) => {
    const chunks: string[] = [];
    child.stderr.on("data", (chunk: Buffer) => chunks.push(chunk.toString()));
    child.once("exit", () => resolve(chunks.join("")));
  });

const exitCodeOf = (child: CliProcess): Promise<number | null> =>
  new Promise((resolve) => child.once("exit", resolve));

const getFile = (port: number, path: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const request = httpRequest({ host: "127.0.0.1", port, path }, (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => chunks.push(chunk));
      response.on("end", () => resolve(Buffer.concat(chunks).toString()));
    });
    request.once("error", reject);
    request.end();
  });

test("the CLI prints a reachable url and serves the file from it", async () => {
  const child = spawnCli([join(directory, "shared.txt"), "--port", "0"]);
  const banner = await collectBanner(child);
  const bannerUrl = banner.match(/-> http:\/\/localhost:(\d+)\/shared\.txt/);
  assert.ok(bannerUrl, `no url in banner: ${banner}`);

  const port = Number(bannerUrl[1]);
  assert.ok(Number.isInteger(port) && port > 0 && port <= 65535, `bad port: ${bannerUrl[1]}`);
  assert.equal(await getFile(port, "/shared.txt"), CONTENT);

  child.kill("SIGINT");
  assert.equal(await exitCodeOf(child), 0);
});

test("the CLI exits with an error for a bad port", async () => {
  const child = spawnCli([join(directory, "shared.txt"), "--port", "nope"]);
  const errors = collectStderr(child);
  assert.equal(await exitCodeOf(child), 1);
  assert.match(await errors, /invalid port: nope/);
});

test("the CLI refuses a file that does not exist", async () => {
  const child = spawnCli([join(directory, "absent.txt")]);
  const errors = collectStderr(child);
  assert.equal(await exitCodeOf(child), 1);
  assert.match(await errors, /no such file/);
});
