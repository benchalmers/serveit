import { networkInterfaces } from "node:os";

export const externalIPv4Addresses = (): string[] =>
  Object.values(networkInterfaces())
    .flatMap((addresses) => addresses ?? [])
    .flatMap(({ family, internal, address }) =>
      family === "IPv4" && !internal ? [address] : [],
    )
    .sort((a, b) => a.localeCompare(b));
