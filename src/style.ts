export const PAGE_STYLE = `
:root {
  color-scheme: light dark;
  --bg: #ffffff;
  --fg: #1f2328;
  --muted: #59636e;
  --border: #d1d9e0;
  --subtle: #f6f8fa;
  --accent: #0969da;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0d1117;
    --fg: #e6edf3;
    --muted: #9198a1;
    --border: #3d444d;
    --subtle: #151b23;
    --accent: #4493f8;
  }
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
  font-size: 17px;
  line-height: 1.65;
}
.markdown-body {
  max-width: 46rem;
  margin: 0 auto;
  padding: 3rem 1.5rem 6rem;
  overflow-wrap: break-word;
}
h1, h2, h3, h4, h5, h6 {
  margin: 2rem 0 0.75rem;
  line-height: 1.25;
  font-weight: 600;
  scroll-margin-top: 1rem;
}
h1 { font-size: 2rem; margin-top: 0; }
h2 { font-size: 1.5rem; padding-bottom: 0.3rem; border-bottom: 1px solid var(--border); }
h3 { font-size: 1.25rem; }
h4 { font-size: 1rem; }
p, ul, ol, blockquote, table, pre, details { margin: 0 0 1rem; }
ul, ol { padding-left: 1.75rem; }
li + li { margin-top: 0.25rem; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
strong { font-weight: 600; }
hr { height: 1px; margin: 2rem 0; border: 0; background: var(--border); }
blockquote {
  padding: 0 1rem;
  color: var(--muted);
  border-left: 0.25rem solid var(--border);
}
blockquote > :last-child { margin-bottom: 0; }
code, kbd, pre {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 0.875em;
}
code {
  padding: 0.2em 0.4em;
  background: var(--subtle);
  border-radius: 6px;
}
pre {
  padding: 1rem;
  overflow: auto;
  background: var(--subtle);
  border: 1px solid var(--border);
  border-radius: 8px;
  line-height: 1.5;
}
pre code { padding: 0; background: transparent; border-radius: 0; font-size: 1em; }
table { display: block; width: max-content; max-width: 100%; overflow: auto; border-collapse: collapse; }
th, td { padding: 0.4rem 0.8rem; border: 1px solid var(--border); }
th { background: var(--subtle); font-weight: 600; }
tr:nth-child(2n) td { background: var(--subtle); }
img, svg, video { max-width: 100%; height: auto; }
img { border-radius: 6px; }
kbd {
  padding: 0.15em 0.4em;
  border: 1px solid var(--border);
  border-bottom-width: 2px;
  border-radius: 4px;
  background: var(--subtle);
}
details summary { cursor: pointer; font-weight: 600; }
@media print {
  body { font-size: 12pt; }
  .markdown-body { max-width: none; padding: 0; }
  a { color: inherit; text-decoration: underline; }
}
`.trim();
