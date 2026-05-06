/**
 * Sanitizes a string for search queries to prevent XSS and other injection attacks.
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return "";
  // Remove potentially dangerous characters and limit length
  return query
    .trim()
    .replace(/[<>\"\'\&]/g, "") // Basic XSS prevention
    .slice(0, 100);
}

/**
 * Sanitizes metadata objects to ensure they only contain serializable data.
 */
export function sanitizeMetadata(
  metadata: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    // Basic sanitization: only allow primitive types and simple objects
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.filter(
        (item) =>
          typeof item === "string" ||
          typeof item === "number" ||
          typeof item === "boolean"
      );
    } else if (typeof value === "object") {
      // Shallow sanitization for nested objects
      sanitized[key] = "[Object]";
    }
  }

  return sanitized;
}
