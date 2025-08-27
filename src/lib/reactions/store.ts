/**
 * Reaction utilities
 */

export function createEmailHash(email: string): string {
  // Simple hash function for client-side use
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

export function getStoredEmailHash(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('user_email_hash');
}

export function setStoredEmailHash(hash: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user_email_hash', hash);
}
