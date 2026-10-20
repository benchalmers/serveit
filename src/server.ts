import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { basename } from "node:path";
import { pipeline } from "node:stream/promises";

import { markdownDocument, titleFromFileName } from "./markdown.ts";
import { contentTypeFor } from "./mime.ts";

export type StartServerOptions = {
  readonly filePath: string;
  readonly port: number;
  readonly renderMarkdown?: boolean;
};

export type RunningServer = {
  readonly server: Server;
  readonly port: number;
  readonly close: () => Promise<void>;
};

type ServedFile = {
  readonly path: string;
  readonly name: string;
};

type Responder = (
  request: IncomingMessage,
  response: ServerResponse,
  file: ServedFile,
) => Promise<void>;

const dispositionFor = (name: string): string =>
  `inline; filename="${name.replaceAll(/["\\\r\n]/g, "_")}"`;

const sendFile = async (
  request: IncomingMessage,
  response: ServerResponse,
  file: ServedFile,
): Promise<void> => {
  const info = await stat(file.path);
  response.writeHead(200, {
    "content-type": contentTypeFor(file.name),
    "content-length": info.size,
    "content-disposition": dispositionFor(file.name),
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  await pipeline(createReadStream(file.path), response);
};

const sendMarkdown = async (
  request: IncomingMessage,
  response: ServerResponse,
  file: ServedFile,
): Promise<void> => {
  const title = titleFromFileName(file.name);
  const page = markdownDocument({ title, source: await readFile(file.path, "utf8") });
  const body = Buffer.from(page, "utf8");
  response.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "content-length": body.byteLength,
    "content-disposition": dispositionFor(`${title}.html`),
  });
  response.end(request.method === "HEAD" ? undefined : body);
};

const handleRequest = async (
  respond: Responder,
  request: IncomingMessage,
  response: ServerResponse,
  file: ServedFile,
): Promise<void> => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { allow: "GET, HEAD" }).end();
    return;
  }
  try {
    await respond(request, response, file);
  } catch (error) {
    const missing = (error as NodeJS.ErrnoException).code === "ENOENT";
    response.writeHead(missing ? 404 : 500).end(missing ? "file is no longer available\n" : "error reading file\n");
  }
};

const listen = (server: Server, port: number): Promise<void> =>
  new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "0.0.0.0", () => {
      server.off("error", reject);
      resolve();
    });
  });

const closeServer = (server: Server): Promise<void> =>
  new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

export const startServer = async (options: StartServerOptions): Promise<RunningServer> => {
  const file: ServedFile = { path: options.filePath, name: basename(options.filePath) };
  const respond: Responder = options.renderMarkdown === true ? sendMarkdown : sendFile;
  const server = createServer((request, response) => {
    void handleRequest(respond, request, response, file);
  });
  await listen(server, options.port);
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("server has no bound port");
  }
  return { server, port: address.port, close: () => closeServer(server) };
};
