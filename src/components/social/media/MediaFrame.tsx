interface MediaFrameProps {
  src: string;
  alt?: string;
  ratio?: number;
  video?: boolean;
  poster?: string;
}

export function MediaFrame({
  src,
  alt,
  ratio = 1,
  video = false,
  poster,
}: MediaFrameProps) {
  return (
    <div 
      className="relative w-full overflow-hidden bg-black rounded-lg"
      style={{ 
        aspectRatio: `${ratio} / 1`,
        maxHeight: 'calc(90vh - 160px)'
      }}
    >
      {video ? (
        <video 
          className="absolute inset-0 w-full h-full object-contain bg-black" 
          controls 
          playsInline 
          poster={poster}
        >
          <source src={src} />
        </video>
      ) : (
        <img 
          src={src} 
          alt={alt} 
          className="absolute inset-0 w-full h-full object-contain bg-black" 
        />
      )}
    </div>
  );
}
