# serveit

Serve a single file over HTTP on **0.0.0.0** so another machine can grab it, and print the URLs to do so.
Add `--markdown` to render a markdown file as a styled, self-contained HTML page.

```text
$ serveit ./dist/release.zip

Serving /home/bench/coding/serveit/dist/release.zip (42.3 MB) on 0.0.0.0:8080

Available at:
  -> http://localhost:8080/release.zip
  -> http://100.93.222.118:8080/release.zip
  -> http://192.168.5.94:8080/release.zip

Press Ctrl+C to stop
```

Or preview notes in any browser on your network:

```text
$ serveit ./notes.md --markdown

Serving /home/bench/coding/serveit/notes.md (1.8 KB) on 0.0.0.0:8080
Rendering markdown as HTML

Available at:
  -> http://localhost:8080/notes.md
  -> http://192.168.5.94:8080/notes.md

Press Ctrl+C to stop
```

## Install

Requires Node `>=22.18` (for built-in TypeScript type stripping; there is no build step).

```bash
# from this directory — installs into pnpm's global bin dir
pnpm add -g .

serveit --help        # verify
```

`pnpm add -g .` copies the package into the global store, so re-run it after changing the source. To remove:

```bash
pnpm remove -g serveit
```

If `serveit` is not found afterwards, add pnpm's global bin dir to your `PATH` (`pnpm setup` does this):

```bash
export PATH="$(pnpm bin -g):$PATH"
```

Alternatively install a packed tarball (`pnpm pack && pnpm add -g ./serveit-0.2.0.tgz`), or publish and
install from the registry (`pnpm add -g serveit` — use a scope like `@yourname/serveit` if the name is taken).

## Usage

```bash
serveit <file> [--port <port>] [--markdown]
```

| Option | Description |
| --- | --- |
| `-p, --port <port>` | Port to listen on. Default `8080`; `0` picks a free port. |
| `-m, --markdown` | Render the file as a styled HTML page instead of serving it raw. |
| `-h, --help` | Show help. |

Give it any path you like — the file is always served at `/<filename>`, and also at any other path
(`GET /` works too). That makes the URL easy to read out loud and impossible to typo.

## Behaviour

- Binds `0.0.0.0`, so LAN and tailnet peers can reach it (the banner lists every external IPv4 address).
- Streams the file, so multi-gigabyte files use constant memory.
- Sends `Content-Length`, a sensible `Content-Type` from the extension, and `Content-Disposition: inline`.
- Supports `GET` and `HEAD`; everything else gets `405` with an `Allow` header.
- Re-reads the file on every request, so the served copy is always current.
- Exits cleanly on `Ctrl+C`; failures to bind port (e.g. in use) exit non-zero with a clear message.

### Markdown rendering

With `--markdown`, the served file is rendered as a complete HTML page:

- GitHub-flavoured markdown — headings, tables, fenced code, blockquotes, lists and task-list text.
- Self-contained: all CSS is inline, no external fonts or scripts, and it works offline.
- Responsive layout with light and dark themes following `prefers-color-scheme`.
- Served as `text/html; charset=utf-8` with `Content-Disposition: inline`, so browsers display it
  rather than downloading it.
- Safe by default: raw HTML in the markdown is escaped (not executed) and `javascript:` links are
  rejected, so a malicious `.md` cannot run script in the viewer's browser.
- The URL stays the same (`/<filename>`), and the page re-renders on every request, so edits show up
  on refresh.

## Security

There is **no authentication**. Anyone who can reach the port can download the file. That is fine on a
trusted LAN or tailnet; do not run this on an untrusted network.

## Development

```bash
pnpm install
pnpm test        # end-to-end tests against real servers and the real CLI
pnpm typecheck
pnpm lint
pnpm start ./some/file
```

Runs directly on Node `>=22.18` using built-in TypeScript type stripping — no build step. The only
runtime dependency is [`markdown-it`](https://github.com/markdown-it/markdown-it) for `--markdown`.
