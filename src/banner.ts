import { externalIPv4Addresses } from "./network.ts";

const UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

export const formatBytes = (bytes: number): string => {
  const tier = Math.min(Math.floor(Math.log2(Math.max(bytes, 1)) / 10), UNITS.length - 1);
  const value = bytes / 1024 ** tier;
  return `${tier === 0 ? value : value.toFixed(1)} ${UNITS[tier] ?? "B"}`;
};

export const urlsFor = (port: number, name: string): string[] =>
  ["localhost", ...externalIPv4Addresses()].map(
    (host) => `http://${host}:${port}/${encodeURIComponent(name)}`,
  );

export const bannerFor = (options: {
  readonly displayPath: string;
  readonly name: string;
  readonly size: number;
  readonly port: number;
}): string => {
  const urls = urlsFor(options.port, options.name)
    .map((url) => `  -> ${url}`)
    .join("\n");
  return [
    `Serving ${options.displayPath} (${formatBytes(options.size)}) on 0.0.0.0:${options.port}`,
    "",
    "Available at:",
    urls,
    "",
    "Press Ctrl+C to stop",
  ].join("\n");
};
