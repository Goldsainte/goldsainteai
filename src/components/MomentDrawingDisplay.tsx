import { useEffect, useRef } from "react";
import { Canvas as FabricCanvas } from "fabric";

interface MomentDrawingDisplayProps {
  drawingData: string;
  width: number;
  height: number;
}

export const MomentDrawingDisplay = ({
  drawingData,
  width,
  height,
}: MomentDrawingDisplayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !drawingData) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width,
      height,
      selection: false,
      interactive: false,
    });

    // Make canvas transparent
    canvas.backgroundColor = null;

    try {
      canvas.loadFromJSON(drawingData, () => {
        // Disable interactivity for all objects
        canvas.getObjects().forEach((obj) => {
          obj.selectable = false;
          obj.evented = false;
        });
        canvas.renderAll();
      });
    } catch (error) {
      console.error("Error loading drawing:", error);
    }

    return () => {
      canvas.dispose();
    };
  }, [drawingData, width, height]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none"
    />
  );
};
