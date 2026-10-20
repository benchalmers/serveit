export const DEFAULT_PORT = 8080;

export const USAGE = `Usage: serveit <file> [--port <port>]

Serves <file> over HTTP on 0.0.0.0 so other machines can fetch it,
and prints the URLs it is reachable at.

Options:
  -p, --port <port>  Port to listen on (default: ${DEFAULT_PORT}, 0 picks a free port)
  -h, --help         Show this help
`;

export type CliParseResult =
  | { readonly kind: "run"; readonly filePath: string; readonly port: number }
  | { readonly kind: "help" }
  | { readonly kind: "error"; readonly message: string };

type PartialOptions = {
  readonly port: number;
  readonly filePath?: string;
};

const parsePort = (value: string | undefined): number | undefined => {
  const port = Number(value);
  return value !== undefined && Number.isInteger(port) && port >= 0 && port <= 65535
    ? port
    : undefined;
};

const finish = (options: PartialOptions): CliParseResult =>
  options.filePath === undefined
    ? { kind: "error", message: "no file given" }
    : { kind: "run", filePath: options.filePath, port: options.port };

const parseTokens = (argv: readonly string[], options: PartialOptions): CliParseResult => {
  const [argument, ...rest] = argv;
  if (argument === undefined) {
    return finish(options);
  }
  if (argument === "-h" || argument === "--help") {
    return { kind: "help" };
  }
  if (argument === "-p" || argument === "--port" || argument.startsWith("--port=")) {
    const value = argument.startsWith("--port=") ? argument.slice("--port=".length) : rest[0];
    const consumed = argument.startsWith("--port=") ? rest : rest.slice(1);
    const port = parsePort(value);
    return port === undefined
      ? { kind: "error", message: `invalid port: ${value ?? "(missing)"}` }
      : parseTokens(consumed, { ...options, port });
  }
  if (argument.startsWith("-")) {
    return { kind: "error", message: `unknown option: ${argument}` };
  }
  if (options.filePath !== undefined) {
    return { kind: "error", message: `unexpected extra argument: ${argument}` };
  }
  return parseTokens(rest, { ...options, filePath: argument });
};

export const parseArgs = (argv: readonly string[]): CliParseResult =>
  parseTokens(argv, { port: DEFAULT_PORT });
