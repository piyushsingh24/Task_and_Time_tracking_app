export interface RetryOptions {
  retries: number;
  delayMs: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

async function wait(ms: number): Promise<void> {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const { retries, delayMs, shouldRetry = () => true } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      const shouldContinue = attempt < retries && shouldRetry(error, attempt);
      if (!shouldContinue) {
        throw error;
      }

      await wait(delayMs);
    }
  }

  throw lastError ?? new Error("Retry failed without an error.");
}
