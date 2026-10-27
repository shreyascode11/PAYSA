/** Minimum group size before any aggregate is shown (k-anonymity). */
export const K_ANONYMITY = 5;

export function canShowAggregate(groupSize: number): boolean {
  return groupSize >= K_ANONYMITY;
}

// No 0/O, 1/I/L, so codes survive being read aloud or written on paper.
export const TRACKING_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const TRACKING_ID_PATTERN = /^PS-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/;

export function generateTrackingId(): string {
  const n = TRACKING_ALPHABET.length;
  // Rejection sampling keeps every character equally likely.
  const limit = 256 - (256 % n);
  let code = "";
  while (code.length < 6) {
    const bytes = crypto.getRandomValues(new Uint8Array(12));
    for (const b of bytes) {
      if (b < limit && code.length < 6) code += TRACKING_ALPHABET[b % n];
    }
  }
  return `PS-${code}`;
}

export function normalizeTrackingId(raw: string): string {
  const s = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return s.startsWith("PS") ? `PS-${s.slice(2)}` : `PS-${s}`;
}

/** Coarsen a timestamp to the hour so submission time can't be matched to a shift log. */
export function roundToHour(d: Date): string {
  const r = new Date(d);
  r.setUTCMinutes(0, 0, 0);
  return r.toISOString();
}

export interface ReportIdentityInput {
  anonymous: boolean;
  workerId?: string;
  now: Date;
}

/** The only place report identity fields are decided. */
export function reportIdentity({ anonymous, workerId, now }: ReportIdentityInput): {
  workerId?: string;
  createdAt: string;
} {
  if (anonymous) return { createdAt: roundToHour(now) };
  return { workerId, createdAt: now.toISOString() };
}
