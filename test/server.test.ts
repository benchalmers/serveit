import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { startServer, type RunningServer } from "../src/server.ts";
import { contentTypeFor } from "../src/mime.ts";
import { externalIPv4Addresses } from "../src/network.ts";

const FILE_CONTENT = "hello from serveit\n".repeat(1000);

let directory: string;
let running: RunningServer;
let baseUrl: string;

before(async () => {
  directory = await mkdtemp(join(tmpdir(), "serveit-test-"));
  await writeFile(join(directory, "hello.txt"), FILE_CONTENT);
  running = await startServer({ filePath: join(directory, "hello.txt"), port: 0 });
  baseUrl = `http://127.0.0.1:${running.port}`;
});

after(async () => {
  await running.close();
  await rm(directory, { recursive: true, force: true });
});

test("GET returns the file content with length and text content type", async () => {
  const response = await fetch(`${baseUrl}/hello.txt`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
  assert.equal(response.headers.get("content-length"), String(FILE_CONTENT.length));
  assert.match(response.headers.get("content-disposition") ?? "", /filename="hello\.txt"/);
  assert.equal(await response.text(), FILE_CONTENT);
});

test("GET on any path returns the same file", async () => {
  const response = await fetch(`${baseUrl}/`);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), FILE_CONTENT);
});

test("HEAD returns headers without a body", async () => {
  const response = await fetch(`${baseUrl}/hello.txt`, { method: "HEAD" });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-length"), String(FILE_CONTENT.length));
  assert.equal(await response.text(), "");
});

test("unsupported methods are rejected with 405", async () => {
  const response = await fetch(`${baseUrl}/hello.txt`, { method: "POST" });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET, HEAD");
});

test("the served file keeps updating if the file changes on disk", async () => {
  const filePath = join(directory, "changing.txt");
  await writeFile(filePath, "v1");
  const server = await startServer({ filePath, port: 0 });
  try {
    await writeFile(filePath, "v2");
    const response = await fetch(`http://127.0.0.1:${server.port}/changing.txt`, {
      headers: { connection: "close" },
    });
    assert.equal(await response.text(), "v2");
  } finally {
    await server.close();
  }
});

test("contentTypeFor maps known extensions and falls back to octet-stream", () => {
  assert.equal(contentTypeFor("a.txt"), "text/plain; charset=utf-8");
  assert.equal(contentTypeFor("a.html"), "text/html; charset=utf-8");
  assert.equal(contentTypeFor("a.PNG"), "image/png");
  assert.equal(contentTypeFor("archive.tar.gz"), "application/gzip");
  assert.equal(contentTypeFor("no-extension"), "application/octet-stream");
  assert.equal(contentTypeFor("a.unknownext"), "application/octet-stream");
});

test("externalIPv4Addresses returns dotted-quad strings", () => {
  const addresses = externalIPv4Addresses();
  assert.ok(Array.isArray(addresses));
  for (const address of addresses) {
    assert.match(address, /^\d{1,3}(\.\d{1,3}){3}$/);
  }
});
