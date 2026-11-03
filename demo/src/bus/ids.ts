let fallbackCounter = 0;

/**
 * Generates a unique message ID safe for both SSR and browser execution.
 */
export function newMsgId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  fallbackCounter += 1;
  return `${Date.now()}-${fallbackCounter}`;
}
