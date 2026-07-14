import { describe, expect, it } from "vitest";
import { assertSafeInternalHost, assertSafeOutboundUrl } from "@/lib/ssrf";

describe("assertSafeOutboundUrl", () => {
  it("allows public https URLs", () => {
    expect(assertSafeOutboundUrl("https://hooks.slack.com/services/T/B/X").ok).toBe(
      true
    );
  });

  it("rejects private and metadata targets", () => {
    expect(assertSafeOutboundUrl("http://127.0.0.1/hook").ok).toBe(false);
    expect(assertSafeOutboundUrl("http://10.0.0.5/hook").ok).toBe(false);
    expect(assertSafeOutboundUrl("http://169.254.169.254/latest").ok).toBe(false);
    expect(assertSafeOutboundUrl("http://localhost/hook").ok).toBe(false);
  });
});

describe("assertSafeInternalHost", () => {
  it("allows private LAN hosts for routers", () => {
    expect(assertSafeInternalHost("192.168.88.1").ok).toBe(true);
    expect(assertSafeInternalHost("10.0.0.1").ok).toBe(true);
  });

  it("rejects loopback, link-local, and cloud metadata", () => {
    expect(assertSafeInternalHost("127.0.0.1").ok).toBe(false);
    expect(assertSafeInternalHost("169.254.169.254").ok).toBe(false);
    expect(assertSafeInternalHost("169.254.1.1").ok).toBe(false);
    expect(assertSafeInternalHost("localhost").ok).toBe(false);
  });
});
