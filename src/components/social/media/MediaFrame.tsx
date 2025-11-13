interface MediaFrameProps {
  media: {
    type: "image" | "video";
    url: string;
  };
}

export function MediaFrame({ media }: MediaFrameProps) {
  return (
    <div className="relative w-full" style={{ maxHeight: "calc(100vh - 160px)" }}>
      {media.type === "image" ? (
        <img
          src={media.url}
          alt=""
          className="mx-auto block max-w-full h-auto"
          style={{ maxHeight: "calc(100vh - 200px)" }}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <video
          src={media.url}
          controls
          className="mx-auto block max-w-full h-auto"
          style={{ maxHeight: "calc(100vh - 200px)" }}
        />
      )}
    </div>
  );
}
