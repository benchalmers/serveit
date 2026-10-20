import { test } from "node:test";
import assert from "node:assert/strict";

import { parseArgs } from "../src/cli.ts";
import { bannerFor, formatBytes, urlsFor } from "../src/banner.ts";

test("a bare file argument runs on the default port", () => {
  assert.deepEqual(parseArgs(["notes.txt"]), {
    kind: "run",
    filePath: "notes.txt",
    port: 8080,
  });
});

test("--port consumes its value instead of treating it as the file", () => {
  assert.deepEqual(parseArgs(["notes.txt", "--port", "8321"]), {
    kind: "run",
    filePath: "notes.txt",
    port: 8321,
  });
});

test("-p before the file and --port=value both work", () => {
  assert.deepEqual(parseArgs(["-p", "3000", "notes.txt"]), {
    kind: "run",
    filePath: "notes.txt",
    port: 3000,
  });
  assert.deepEqual(parseArgs(["notes.txt", "--port=0"]), {
    kind: "run",
    filePath: "notes.txt",
    port: 0,
  });
});

test("help is reported regardless of other arguments", () => {
  assert.equal(parseArgs(["--help"]).kind, "help");
  assert.equal(parseArgs(["notes.txt", "-h"]).kind, "help");
});

test("missing, invalid and out-of-range ports are errors", () => {
  assert.deepEqual(parseArgs(["notes.txt", "--port"]), {
    kind: "error",
    message: "invalid port: (missing)",
  });
  assert.deepEqual(parseArgs(["notes.txt", "--port", "abc"]), {
    kind: "error",
    message: "invalid port: abc",
  });
  assert.equal(parseArgs(["notes.txt", "--port", "70000"]).kind, "error");
  assert.equal(parseArgs(["notes.txt", "--port", "1.5"]).kind, "error");
});

test("no file, unknown options and extra arguments are errors", () => {
  assert.deepEqual(parseArgs([]), { kind: "error", message: "no file given" });
  assert.deepEqual(parseArgs(["--wat"]), {
    kind: "error",
    message: "unknown option: --wat",
  });
  assert.deepEqual(parseArgs(["a.txt", "b.txt"]), {
    kind: "error",
    message: "unexpected extra argument: b.txt",
  });
});

test("urlsFor lists localhost first and encodes the file name", () => {
  const urls = urlsFor(8080, "my notes.txt");
  assert.equal(urls[0], "http://localhost:8080/my%20notes.txt");
  assert.ok(urls.every((url) => url.startsWith("http://") && url.endsWith(":8080/my%20notes.txt")));
});

test("bannerFor shows the bind address and every url", () => {
  const banner = bannerFor({
    displayPath: "/tmp/notes.txt",
    name: "notes.txt",
    size: 2048,
    port: 8080,
  });
  assert.match(banner, /Serving \/tmp\/notes\.txt \(2\.0 KB\) on 0\.0\.0\.0:8080/);
  assert.match(banner, /http:\/\/localhost:8080\/notes\.txt/);
});

test("formatBytes scales units and handles empty files", () => {
  assert.equal(formatBytes(0), "0 B");
  assert.equal(formatBytes(999), "999 B");
  assert.equal(formatBytes(1024), "1.0 KB");
  assert.equal(formatBytes(5 * 1024 * 1024), "5.0 MB");
});
