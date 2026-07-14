const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.goog",
  "kubernetes.default",
  "kubernetes.default.svc",
]);

const IPV4_PRIVATE_RANGES: Array<{ base: number; mask: number }> = [
  { base: ipToInt("0.0.0.0"), mask: 8 },
  { base: ipToInt("10.0.0.0"), mask: 8 },
  { base: ipToInt("127.0.0.0"), mask: 8 },
  { base: ipToInt("169.254.0.0"), mask: 16 },
  { base: ipToInt("172.16.0.0"), mask: 12 },
  { base: ipToInt("192.168.0.0"), mask: 16 },
];

function ipToInt(ip: string): number {
  const parts = ip.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return -1;
  }
  return ((parts[0]! << 24) >>> 0) + (parts[1]! << 16) + (parts[2]! << 8) + parts[3]!;
}

function isIpv4(hostname: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

function isPrivateOrLoopbackIpv4(hostname: string): boolean {
  const value = ipToInt(hostname);
  if (value < 0) return false;
  return IPV4_PRIVATE_RANGES.some(({ base, mask }) => {
    const shift = 32 - mask;
    return value >>> shift === base >>> shift;
  });
}

function isLinkLocalIpv4(hostname: string): boolean {
  const value = ipToInt(hostname);
  if (value < 0) return false;
  const linkLocalBase = ipToInt("169.254.0.0");
  return value >>> 16 === linkLocalBase >>> 16;
}

function isIpv6Literal(hostname: string): boolean {
  return hostname.includes(":");
}

function isBlockedIpv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80")
  );
}

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, "");
}

export type HostSafetyResult =
  | { ok: true; hostname: string }
  | { ok: false; message: string };

/**
 * Reject cloud metadata, loopback, and link-local hosts. Private LAN addresses
 * (10/8, 172.16/12, 192.168/16) are allowed for on-prem targets such as Mikrotik routers.
 */
export function assertSafeInternalHost(host: string): HostSafetyResult {
  const trimmed = host.trim();
  if (!trimmed) {
    return { ok: false, message: "Host is required" };
  }

  let hostname = trimmed;
  if (trimmed.includes("://")) {
    try {
      hostname = new URL(trimmed).hostname;
    } catch {
      return { ok: false, message: "Enter a valid host" };
    }
  } else if (trimmed.includes("/") || trimmed.includes("?")) {
    return { ok: false, message: "Enter a hostname or IP without a path" };
  } else if (trimmed.includes(":") && !trimmed.startsWith("[") && !isIpv6Literal(trimmed)) {
    // host:port form
    hostname = trimmed.slice(0, trimmed.lastIndexOf(":"));
  }

  hostname = normalizeHostname(hostname.replace(/^\[|\]$/g, ""));

  if (!hostname) {
    return { ok: false, message: "Enter a valid host" };
  }

  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost")) {
    return { ok: false, message: "This host is not allowed" };
  }

  if (hostname === "169.254.169.254" || hostname === "metadata") {
    return { ok: false, message: "This host is not allowed" };
  }

  if (isIpv4(hostname) && hostname === "169.254.169.254") {
    return { ok: false, message: "This host is not allowed" };
  }

  if (isIpv6Literal(hostname) && isBlockedIpv6(hostname)) {
    return { ok: false, message: "Loopback and link-local IPv6 hosts are not allowed" };
  }

  if (isIpv4(hostname)) {
    if (hostname.startsWith("127.")) {
      return { ok: false, message: "Loopback addresses are not allowed" };
    }
    // Reject the full link-local range (169.254.0.0/16), not only the AWS metadata IP.
    if (isLinkLocalIpv4(hostname)) {
      return { ok: false, message: "Link-local addresses are not allowed" };
    }
  }

  return { ok: true, hostname };
}

/**
 * Reject private, loopback, and metadata targets for outbound HTTP callbacks.
 */
export function assertSafeOutboundUrl(urlString: string): HostSafetyResult {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return { ok: false, message: "Enter a valid URL" };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, message: "URL must use http or https" };
  }

  const hostname = normalizeHostname(parsed.hostname);

  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost")) {
    return { ok: false, message: "Webhook URL host is not allowed" };
  }

  if (hostname === "169.254.169.254") {
    return { ok: false, message: "Webhook URL host is not allowed" };
  }

  if (isIpv4(hostname) && isPrivateOrLoopbackIpv4(hostname)) {
    return { ok: false, message: "Webhook URL cannot target private or loopback addresses" };
  }

  if (isIpv6Literal(hostname) && isBlockedIpv6(hostname)) {
    return { ok: false, message: "Webhook URL cannot target private or loopback addresses" };
  }

  return { ok: true, hostname };
}
