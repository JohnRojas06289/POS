export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      operation(),
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(timeoutMessage));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    retries: number;
    delayMs: number;
    shouldRetry?: (error: unknown) => boolean;
  },
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      attempt += 1;
      const canRetry = attempt <= options.retries && (options.shouldRetry?.(error) ?? true);

      if (!canRetry) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, options.delayMs * attempt));
    }
  }
}
