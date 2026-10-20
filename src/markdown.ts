import { basename, extname } from "node:path";
import MarkdownIt from "markdown-it";

import { PAGE_STYLE } from "./style.ts";

const markdown = new MarkdownIt({ html: false, linkify: true });

const ESCAPES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export const escapeHtml = (text: string): string =>
  text.replaceAll(/[&<>"']/g, (character) => ESCAPES[character] ?? character);

export const renderMarkdown = (source: string): string => markdown.render(source);

export const titleFromFileName = (fileName: string): string => {
  const name = basename(fileName);
  return name.slice(0, name.length - extname(name).length) || name;
};

export const markdownDocument = (input: {
  readonly title: string;
  readonly source: string;
}): string =>
  [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="color-scheme" content="light dark">',
    `<title>${escapeHtml(input.title)}</title>`,
    `<style>${PAGE_STYLE}</style>`,
    "</head>",
    "<body>",
    '<main class="markdown-body">',
    renderMarkdown(input.source),
    "</main>",
    "</body>",
    "</html>",
    "",
  ].join("\n");
