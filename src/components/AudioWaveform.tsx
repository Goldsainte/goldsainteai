import { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isRecording: boolean;
  audioLevel: number; // 0-1 range
}

export const AudioWaveform = ({ isRecording, audioLevel }: AudioWaveformProps) => {
  const barsRef = useRef<number[]>([0, 0, 0, 0, 0]);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!isRecording) {
      barsRef.current = [0, 0, 0, 0, 0];
      return;
    }

    const animate = () => {
      // Shift bars to the left
      barsRef.current = [
        barsRef.current[1],
        barsRef.current[2],
        barsRef.current[3],
        barsRef.current[4],
        audioLevel
      ];

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording, audioLevel]);

  if (!isRecording) return null;

  return (
    <div className="flex items-center gap-1 h-8 px-2">
      {barsRef.current.map((level, index) => {
        const height = Math.max(8, level * 32); // Min 8px, max 32px
        return (
          <div
            key={index}
            className="w-1 bg-gradient-to-t from-primary to-accent rounded-full transition-all duration-100 ease-out"
            style={{ 
              height: `${height}px`,
              opacity: 0.4 + (level * 0.6) // 0.4 to 1.0 opacity
            }}
          />
        );
      })}
    </div>
  );
};
