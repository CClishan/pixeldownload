export const normalizeOptionalHttpUrl = (value?: string, base?: string | URL): string | undefined => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    const normalized = base ? new URL(trimmed, base) : new URL(trimmed);
    if (normalized.protocol !== 'http:' && normalized.protocol !== 'https:') {
      return undefined;
    }

    return normalized.toString();
  } catch {
    return undefined;
  }
};
