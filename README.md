# serveit

Serve a single file over HTTP on **0.0.0.0** so another machine can grab it, and print the URLs to do so.

```text
$ serveit ./dist/release.zip

Serving /home/bench/coding/serveit/dist/release.zip (42.3 MB) on 0.0.0.0:8080

Available at:
  -> http://localhost:8080/release.zip
  -> http://100.93.222.118:8080/release.zip
  -> http://192.168.5.94:8080/release.zip

Press Ctrl+C to stop
```

## Usage

```bash
serveit <file> [--port <port>]
```

| Option | Description |
| --- | --- |
| `-p, --port <port>` | Port to listen on. Default `8080`; `0` picks a free port. |
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

Runs directly on Node `>=22.18` using built-in TypeScript type stripping — no build step, no runtime
dependencies.
