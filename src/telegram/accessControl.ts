import { createHash, timingSafeEqual } from 'node:crypto';

export const MIN_ACCESS_PASSWORD_LENGTH = 8;
export const MAX_ACCESS_FAILURES = 5;
export const ACCESS_BLOCK_MS = 15 * 60 * 1000;

export interface AccessPasswordConfig {
  active: boolean;
  normalizedPassword?: string;
  fingerprint?: string;
  reason?: 'missing' | 'too_short';
}

export interface AccessAttemptStatus {
  allowed: boolean;
  retryAfterSeconds: number;
  remainingAttempts: number;
}

interface AttemptRecord {
  failures: number;
  blockedUntil: number;
}

/**
 * Password comparison is deliberately independent from Persian letter
 * normalisation used by the game.  NFKC makes visually equivalent input
 * stable while preserving case and internal spaces as meaningful password
 * characters.
 */
export function normalizeAccessPassword(value: string): string {
  return value.normalize('NFKC').trim();
}

export function fingerprintAccessPassword(value: string): string {
  return createHash('sha256').update(normalizeAccessPassword(value), 'utf8').digest('hex');
}

export function readAccessPasswordConfig(rawValue = process.env.PENTIMENTO_ACCESS_PASSWORD): AccessPasswordConfig {
  if (typeof rawValue !== 'string' || rawValue.length === 0) {
    return { active: false, reason: 'missing' };
  }

  const normalizedPassword = normalizeAccessPassword(rawValue);
  if (Array.from(normalizedPassword).length < MIN_ACCESS_PASSWORD_LENGTH) {
    return { active: false, reason: 'too_short' };
  }

  return {
    active: true,
    normalizedPassword,
    fingerprint: fingerprintAccessPassword(normalizedPassword),
  };
}

export function verifyAccessPassword(candidate: string, expectedNormalizedPassword: string): boolean {
  const candidateDigest = createHash('sha256')
    .update(normalizeAccessPassword(candidate), 'utf8')
    .digest();
  const expectedDigest = createHash('sha256')
    .update(expectedNormalizedPassword, 'utf8')
    .digest();
  return timingSafeEqual(candidateDigest, expectedDigest);
}

/** In-memory abuse protection. Durable authorization lives in SQLite. */
export class AccessAttemptLimiter {
  private readonly records = new Map<string, AttemptRecord>();

  constructor(
    private readonly maximumFailures = MAX_ACCESS_FAILURES,
    private readonly blockDurationMs = ACCESS_BLOCK_MS,
  ) {}

  status(subjectId: string, now = Date.now()): AccessAttemptStatus {
    const record = this.records.get(subjectId);
    if (!record) {
      return { allowed: true, retryAfterSeconds: 0, remainingAttempts: this.maximumFailures };
    }

    if (record.blockedUntil > now) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((record.blockedUntil - now) / 1000)),
        remainingAttempts: 0,
      };
    }

    if (record.blockedUntil > 0) {
      this.records.delete(subjectId);
      return { allowed: true, retryAfterSeconds: 0, remainingAttempts: this.maximumFailures };
    }

    return {
      allowed: true,
      retryAfterSeconds: 0,
      remainingAttempts: Math.max(0, this.maximumFailures - record.failures),
    };
  }

  recordFailure(subjectId: string, now = Date.now()): AccessAttemptStatus {
    const current = this.records.get(subjectId);
    const failures = (current?.blockedUntil && current.blockedUntil > now ? this.maximumFailures : current?.failures ?? 0) + 1;

    if (failures >= this.maximumFailures) {
      this.records.set(subjectId, { failures: this.maximumFailures, blockedUntil: now + this.blockDurationMs });
    } else {
      this.records.set(subjectId, { failures, blockedUntil: 0 });
    }

    return this.status(subjectId, now);
  }

  recordSuccess(subjectId: string): void {
    this.records.delete(subjectId);
  }
}
