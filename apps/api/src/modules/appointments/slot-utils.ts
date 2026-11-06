import crypto from 'node:crypto';

const IST_OFFSET_MINUTES = 330; // +05:30

/**
 * Returns a Date in UTC representing the given YYYY-MM-DD date and IST hour/minute.
 */
export function createUtcFromIst(dateStr: string, hour: number, minute: number): Date {
  const pad = (n: number) => String(n).padStart(2, '0');
  const isoString = `${dateStr}T${pad(hour)}:${pad(minute)}:00+05:30`;
  return new Date(isoString);
}

/**
 * Returns day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday) in Asia/Kolkata timezone.
 */
export function getKolkataDayOfWeek(date: Date): number {
  const istTimeMs = date.getTime() + IST_OFFSET_MINUTES * 60 * 1000;
  const istDate = new Date(istTimeMs);
  return istDate.getUTCDay();
}

/**
 * Formats a start and end Date into a readable IST time range.
 * e.g. "10:00 AM - 10:45 AM IST"
 */
export function formatIstTimeRange(start: Date, end: Date): string {
  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  return `${formatTime(start)} - ${formatTime(end)} IST`;
}

/**
 * Formats a Date to YYYY-MM-DD in Asia/Kolkata.
 */
export function formatKolkataDate(date: Date): string {
  const istTimeMs = date.getTime() + IST_OFFSET_MINUTES * 60 * 1000;
  const istDate = new Date(istTimeMs);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generates a human-friendly booking reference:
 * TD-2026-XXXX or SRV-2026-XXXX
 */
export function generateBookingReference(prefix: 'TD' | 'SRV'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let random = '';
  const randomBytes = crypto.randomBytes(4);
  for (let i = 0; i < 4; i++) {
    const byte = randomBytes[i] ?? 0;
    const char = chars[byte % chars.length];
    random += char ?? 'A';
  }
  return `${prefix}-2026-${random}`;
}

/**
 * Generates a secure, non-guessable confirmation token.
 */
export function generateConfirmationToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Masks customer name for public view if unauthenticated.
 * e.g. "Lochan Sharma" -> "L**** S****"
 */
export function maskName(fullName: string): string {
  if (!fullName) return '***';
  const parts = fullName.trim().split(/\s+/);
  return parts
    .map((part) => {
      if (part.length <= 1) return part;
      return `${part[0]}${'*'.repeat(Math.min(part.length - 1, 4))}`;
    })
    .join(' ');
}

/**
 * Masks phone number.
 * e.g. "+91 98765 43210" -> "******3210"
 */
export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '');
  if (cleaned.length <= 4) return '****';
  const last4 = cleaned.slice(-4);
  return `******${last4}`;
}

/**
 * Masks email address.
 * e.g. "john.doe@example.com" -> "j***e@example.com"
 */
export function maskEmail(email: string): string {
  const parts = email.trim().split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return '***@***.com';
  const local = parts[0];
  const domain = parts[1];
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 4))}${local[local.length - 1]}@${domain}`;
}
