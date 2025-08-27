/**
 * Bookmark utilities
 */

export function getStoredBookmarks(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('user_bookmarks');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function setStoredBookmarks(bookmarks: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('user_bookmarks', JSON.stringify(bookmarks));
  } catch {
    // Ignore storage errors
  }
}
