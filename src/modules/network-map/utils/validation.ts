import { z } from "zod";
import { createLogger } from "@/lib/logger";

const log = createLogger("Validation");

/**
 * Validates data against a Zod schema and returns the parsed data.
 * Throws an error if validation fails.
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  if (!schema) {
    log.error("Schema is undefined. Check for circular dependencies.");
    throw new Error("Validation failed: Schema is undefined");
  }
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.issues
        .map((e: z.ZodIssue) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      log.error(`${details}`, { data });
      throw new Error(`Data validation failed: ${details}`);
    }
    throw error;
  }
}

/**
 * Safely validates data against a Zod schema.
 * Returns { success: true, data: T } or { success: false, error: string }.
 */
export function safeValidateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  if (!schema) {
    return { success: false, error: "Validation failed: Schema is undefined" };
  }
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const details = result.error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    return { success: false, error: details };
  }
}
