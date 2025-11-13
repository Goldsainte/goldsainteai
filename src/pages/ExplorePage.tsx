import ExploreGrid from "@/components/social/explore/ExploreGrid";
import { useEffect, useState } from "react";

export default function ExplorePage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    // Mock data - replace with real API call
    const mockItems = Array.from({ length: 20 }, (_, i) => ({
      id: `explore-${i}`,
      thumbUrl: `https://picsum.photos/seed/${i}/600/800`,
      kind: i % 3 === 0 ? "video" : "image",
      author: {
        username: `user_${i}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
      },
      caption: "Explore post caption",
      likes: Math.floor(Math.random() * 10000),
      commentCount: Math.floor(Math.random() * 500),
    }));
    setItems(mockItems);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Explore</h1>
      <ExploreGrid items={items} />
    </div>
  );
}
