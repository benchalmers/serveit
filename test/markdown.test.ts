import { test } from "node:test";
import assert from "node:assert/strict";

import { markdownDocument, renderMarkdown, titleFromFileName } from "../src/markdown.ts";

test("headings, paragraphs, lists and inline formatting are rendered", () => {
  const html = renderMarkdown("# Title\n\nSome **bold** and *italic* text.\n\n- one\n- two\n");
  assert.match(html, /<h1>Title<\/h1>/);
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /<em>italic<\/em>/);
  assert.match(html, /<li>one<\/li>/);
});

test("GFM tables and fenced code blocks are rendered", () => {
  const html = renderMarkdown("| a | b |\n| - | - |\n| 1 | 2 |\n\n```ts\nconst x = 1;\n```\n");
  assert.match(html, /<table>/);
  assert.match(html, /<th>a<\/th>/);
  assert.match(html, /<code class="language-ts">/);
  assert.match(html, /const x = 1;/);
});

test("raw html in the markdown is escaped rather than executed", () => {
  const html = renderMarkdown('<script>alert("xss")</script>\n\n<img src=x onerror=alert(1)>\n');
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<img src=x/);
});

test("javascript: links are not turned into anchors", () => {
  const html = renderMarkdown("[click](javascript:alert(1))\n");
  assert.doesNotMatch(html, /href="javascript:/i);
});

test("titleFromFileName drops the extension and keeps the stem readable", () => {
  assert.equal(titleFromFileName("README.md"), "README");
  assert.equal(titleFromFileName("my-notes.markdown"), "my-notes");
  assert.equal(titleFromFileName("notes"), "notes");
  assert.equal(titleFromFileName("a.b.md"), "a.b");
});

test("the document is a complete, self-contained, styled html page", () => {
  const page = markdownDocument({ title: "Notes", source: "# Hi\n" });
  assert.match(page, /^<!doctype html>/);
  assert.match(page, /<meta charset="utf-8">/);
  assert.match(page, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
  assert.match(page, /<title>Notes<\/title>/);
  assert.match(page, /<style>[\s\S]+<\/style>/);
  assert.match(page, /prefers-color-scheme: dark/);
  assert.match(page, /<h1>Hi<\/h1>/);
  assert.doesNotMatch(page, /<link[^>]+href=/);
  assert.doesNotMatch(page, /<script/);
});

test("the page title is escaped", () => {
  const page = markdownDocument({ title: "<script>x</script>", source: "body\n" });
  assert.doesNotMatch(page, /<title><script>/);
  assert.match(page, /<title>&lt;script&gt;x&lt;\/script&gt;<\/title>/);
});
