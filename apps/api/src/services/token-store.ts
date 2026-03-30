import { randomUUID } from 'node:crypto';
import type { AssetKind } from '@pixel/contracts';

export type TokenEntry = {
  sourceUrl: string;
  fileNameSuggestion: string;
  mimeType?: string;
  kind: AssetKind;
  previewUrl?: string;
  expiresAt: number;
};

export class TokenStore {
  private readonly entries = new Map<string, TokenEntry>();

  constructor(private readonly ttlMs: number) {}

  create(entry: Omit<TokenEntry, 'expiresAt'>) {
    this.cleanup();
    const token = randomUUID().replace(/-/g, '');
    this.entries.set(token, {
      ...entry,
      expiresAt: Date.now() + this.ttlMs
    });
    return token;
  }

  get(token: string) {
    this.cleanup();
    return this.entries.get(token);
  }

  has(token: string) {
    return Boolean(this.get(token));
  }

  private cleanup() {
    const now = Date.now();
    for (const [token, entry] of this.entries.entries()) {
      if (entry.expiresAt <= now) {
        this.entries.delete(token);
      }
    }
  }
}
