export interface ParsedWordEntry {
  word: string;
  translation: string;
  category?: string;
  sentence?: string;
}

/**
 * Parses CSV lines considering quotes and commas.
 */
export function parseWordCSV(text: string): ParsedWordEntry[] {
  if (!text || !text.trim()) return [];

  const lines = text.split(/\r?\n/);
  const results: ParsedWordEntry[] = [];

  let startIndex = 0;
  if (lines.length > 0) {
    const firstLineLower = lines[0].toLowerCase();
    if (firstLineLower.includes('word') || firstLineLower.includes('kelime')) {
      startIndex = 1;
    }
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split on comma not within double quotes
    const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

    if (parts.length >= 2) {
      const word = parts[0].replace(/^"|"$/g, '').trim();
      const translation = parts[1].replace(/^"|"$/g, '').trim();
      const category = parts.length > 2 ? parts[2].replace(/^"|"$/g, '').trim() : '';
      const sentence = parts.length > 3 ? parts[3].replace(/^"|"$/g, '').trim() : '';

      if (word && translation) {
        results.push({
          word,
          translation,
          category: category || undefined,
          sentence: sentence || undefined
        });
      }
    }
  }

  return results;
}

