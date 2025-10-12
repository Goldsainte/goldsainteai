export const PostGridSkeleton = () => {
  return (
    <div className="grid grid-cols-3 gap-1">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square bg-muted animate-pulse"
        />
      ))}
    </div>
  );
};
