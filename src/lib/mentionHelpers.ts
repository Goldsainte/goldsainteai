/**
 * Extracts @mentions from text
 * Returns array of usernames without the @ symbol
 */
export const extractMentions = (text: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  
  return [...new Set(mentions)]; // Remove duplicates
};

/**
 * Renders text with clickable @mentions
 * Returns an array suitable for rendering with .map()
 */
export const renderTextWithMentions = (
  text: string,
  onMentionClick: (username: string) => void,
  instagramUsername?: string
): Array<string | { type: 'mention'; key: string; username: string; isInstagram?: boolean }> => {
  const mentionRegex = /@(\w+)/g;
  const parts: Array<string | { type: 'mention'; key: string; username: string; isInstagram?: boolean }> = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add mention data
    const username = match[1];
    const isInstagram = instagramUsername?.toLowerCase() === username.toLowerCase();
    parts.push({
      type: 'mention',
      key: `mention-${match.index}`,
      username,
      isInstagram,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
};

/**
 * Renders text with both @mentions and #hashtags
 * Returns an array suitable for rendering with .map()
 */
export const renderTextWithMentionsAndHashtags = (
  text: string,
  onMentionClick: (username: string) => void,
  onHashtagClick: (hashtag: string) => void,
  instagramUsername?: string
): Array<string | { type: 'mention' | 'hashtag'; key: string; value: string; isInstagram?: boolean }> => {
  const combinedRegex = /(@\w+)|(#\w+)/g;
  const parts: Array<string | { type: 'mention' | 'hashtag'; key: string; value: string; isInstagram?: boolean }> = [];
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    if (match[1]) {
      // It's a mention
      const username = match[1].substring(1);
      const isInstagram = instagramUsername?.toLowerCase() === username.toLowerCase();
      parts.push({
        type: 'mention',
        key: `mention-${match.index}`,
        value: username,
        isInstagram,
      });
    } else if (match[2]) {
      // It's a hashtag
      const hashtag = match[2].substring(1);
      parts.push({
        type: 'hashtag',
        key: `hashtag-${match.index}`,
        value: hashtag,
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
};
