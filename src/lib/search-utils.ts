export function highlightSearchTerm(text: string, searchTerm: string): string {
  if (!searchTerm || !text) return text;

  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
  return text.replace(
    regex,
    '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
  );
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function createSearchExcerpt(
  text: string,
  searchTerm: string,
  maxLength: number = 200
): string {
  if (!searchTerm || !text) {
    return text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text;
  }

  const lowerText = text.toLowerCase();
  const lowerSearchTerm = searchTerm.toLowerCase();
  const index = lowerText.indexOf(lowerSearchTerm);

  if (index === -1) {
    return text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text;
  }

  // Calculate start position to center the search term
  const start = Math.max(
    0,
    index - Math.floor((maxLength - searchTerm.length) / 2)
  );
  const end = Math.min(text.length, start + maxLength);

  let excerpt = text.substring(start, end);

  // Add ellipsis if we're not at the beginning/end
  if (start > 0) excerpt = '...' + excerpt;
  if (end < text.length) excerpt = excerpt + '...';

  return excerpt;
}

export function extractTextFromTiptapContent(content: unknown): string {
  if (!content || typeof content !== 'object') return '';

  let text = '';

  function traverse(node: unknown) {
    if (typeof node === 'object' && node !== null) {
      const nodeObj = node as {
        type?: string;
        text?: string;
        content?: unknown[];
      };
      if (nodeObj.type === 'text') {
        text += nodeObj.text || '';
      } else if (nodeObj.content && Array.isArray(nodeObj.content)) {
        nodeObj.content.forEach(traverse);
      }
    }
  }

  if (typeof content === 'object' && content !== null) {
    const contentObj = content as { content?: unknown[] };
    if (contentObj.content && Array.isArray(contentObj.content)) {
      contentObj.content.forEach(traverse);
    }
  }

  return text;
}
