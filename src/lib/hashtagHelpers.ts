export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#(\w+)/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.slice(1).toLowerCase()) : [];
}

export function renderTextWithHashtags(
  text: string, 
  onHashtagClick?: (hashtag: string) => void
): (string | { type: string; props: any; key: number })[] {
  const parts: (string | { type: string; props: any; key: number })[] = [];
  const regex = /(#\w+)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    const hashtag = match[1];
    parts.push({
      type: 'span',
      props: {
        className: "text-primary font-semibold cursor-pointer hover:underline",
        onClick: (e: any) => {
          e.stopPropagation();
          onHashtagClick?.(hashtag.slice(1));
        },
        children: hashtag
      },
      key: match.index
    });
    
    lastIndex = regex.lastIndex;
  }
  
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts.length > 0 ? parts : [text];
}

export async function processHashtagsForPost(postId: string, caption: string) {
  const { supabase } = await import("@/integrations/supabase/client");
  
  try {
    await supabase.rpc("extract_and_store_hashtags", {
      p_post_id: postId,
      p_caption: caption,
    });
  } catch (error) {
    console.error("Error processing hashtags:", error);
  }
}
