import { FixedSizeList } from 'react-window';
import { InfiniteLoader } from 'react-window-infinite-loader';
import TravelVideoCard from './TravelVideoCard';

interface TravelPost {
  id: string;
  user_id: string;
  video_url?: string;
  embed_url?: string;
  embed_platform?: string;
  original_creator?: string;
  thumbnail_url: string | null;
  image_urls?: string[];
  media_type?: string;
  caption: string | null;
  location: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count?: number;
  is_featured?: boolean;
  music_track_id?: string;
  music_track_name?: string;
  music_track_artist?: string;
  music_preview_url?: string;
  music_album_art?: string;
  music_service?: string;
  created_at: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
    is_verified?: boolean;
    instagram_username?: string | null;
  };
}

interface VirtualizedFeedProps {
  posts: TravelPost[];
  hasMore: boolean;
  loadMore: () => Promise<void>;
  isLoading: boolean;
  onUpdate: () => void;
  visibleVideoId: string | null;
  isMuted: boolean;
  onToggleMute: () => void;
  hasInteracted: boolean;
}

export const VirtualizedFeed = ({
  posts,
  hasMore,
  loadMore,
  isLoading,
  onUpdate,
  visibleVideoId,
  isMuted,
  onToggleMute,
  hasInteracted
}: VirtualizedFeedProps) => {
  const itemCount = hasMore ? posts.length + 1 : posts.length;
  
  const isItemLoaded = (index: number) => !hasMore || index < posts.length;
  
  const loadMoreItems = isLoading ? async () => {} : loadMore;
  
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    if (!isItemLoaded(index)) {
      return (
        <div style={style} className="flex justify-center py-8">
          <div className="text-muted-foreground text-sm">Loading more...</div>
        </div>
      );
    }
    
    const post = posts[index];
    return (
      <div style={style} data-video-id={post.id} className="border-b">
        <TravelVideoCard
          post={post}
          isActive={visibleVideoId === post.id}
          onUpdate={onUpdate}
          layout="desktop"
          isMuted={visibleVideoId !== post.id}
          onToggleMute={onToggleMute}
          hasInteracted={hasInteracted}
        />
      </div>
    );
  };
  
  return (
    <InfiniteLoader
      isItemLoaded={isItemLoaded}
      itemCount={itemCount}
      loadMoreItems={loadMoreItems}
    >
      {({ onItemsRendered, ref }) => (
        <FixedSizeList
          height={window.innerHeight}
          itemCount={itemCount}
          itemSize={600}
          width="100%"
          onItemsRendered={onItemsRendered}
          ref={ref}
        >
          {Row}
        </FixedSizeList>
      )}
    </InfiniteLoader>
  );
};
