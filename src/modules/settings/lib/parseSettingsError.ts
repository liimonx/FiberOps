export async function parseSettingsError(
  res: Response,
  fallback: string
): Promise<never> {
  try {
    const body = await res.json();

    if (body.error === "Validation failed" && body.issues) {
      const fieldErrors = body.issues.fieldErrors as Record<string, string[]>;
      const formErrors = body.issues.formErrors as string[] | undefined;
      const messages = [
        ...Object.values(fieldErrors ?? {}).flat(),
        ...(formErrors ?? []),
      ];

      if (messages.length > 0) {
        throw new Error(messages.join(". "));
      }
    }

    if (typeof body.error === "string" && body.error.length > 0) {
      throw new Error(body.error);
    }
  } catch (error) {
    if (error instanceof Error && error.message !== fallback) {
      throw error;
    }
  }

  throw new Error(fallback);
}
