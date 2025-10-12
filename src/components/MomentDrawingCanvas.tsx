import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas } from "fabric";
import { Button } from "@/components/ui/button";
import { Pen, Eraser, Palette, Minus, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface MomentDrawingCanvasProps {
  backgroundImage?: string;
  width: number;
  height: number;
  onDrawingChange: (drawingData: string | null) => void;
  initialDrawing?: string | null;
}

export const MomentDrawingCanvas = ({
  backgroundImage,
  width,
  height,
  onDrawingChange,
  initialDrawing,
}: MomentDrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<"draw" | "erase">("draw");
  const [brushType, setBrushType] = useState<"marker" | "highlighter" | "neon">("marker");
  const [brushColor, setBrushColor] = useState("#FFFFFF");
  const [brushSize, setBrushSize] = useState(5);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width,
      height,
      backgroundColor: null,
    });

    // Enable drawing mode to initialize the brush
    canvas.isDrawingMode = true;

    // Wait for next tick to ensure brush is initialized
    setTimeout(() => {
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = brushColor;
        canvas.freeDrawingBrush.width = brushSize;
      }
    }, 0);

    // Load initial drawing if provided
    if (initialDrawing) {
      try {
        canvas.loadFromJSON(initialDrawing, () => {
          canvas.renderAll();
        });
      } catch (error) {
        console.error("Error loading drawing:", error);
      }
    }

    setFabricCanvas(canvas);

    // Save drawing on changes
    const handleChange = () => {
      try {
        const json = JSON.stringify(canvas.toJSON());
        onDrawingChange(json);
      } catch (error) {
        console.error("Error saving drawing:", error);
      }
    };

    canvas.on("path:created", handleChange);
    canvas.on("object:removed", handleChange);

    return () => {
      canvas.dispose();
    };
  }, [width, height, initialDrawing, onDrawingChange]);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === "draw";

    if (activeTool === "draw" && fabricCanvas.freeDrawingBrush) {
      // Apply brush type styles
      switch (brushType) {
        case "marker":
          fabricCanvas.freeDrawingBrush.color = brushColor;
          fabricCanvas.freeDrawingBrush.width = brushSize;
          break;
        case "highlighter":
          fabricCanvas.freeDrawingBrush.color = brushColor + "80"; // 50% opacity
          fabricCanvas.freeDrawingBrush.width = brushSize * 2;
          break;
        case "neon":
          fabricCanvas.freeDrawingBrush.color = brushColor;
          fabricCanvas.freeDrawingBrush.width = brushSize;
          fabricCanvas.freeDrawingBrush.shadow = {
            blur: 10,
            color: brushColor,
            offsetX: 0,
            offsetY: 0,
          } as any;
          break;
      }
    }
  }, [activeTool, brushType, brushColor, brushSize, fabricCanvas]);

  const handleErase = () => {
    if (!fabricCanvas) return;
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      fabricCanvas.remove(activeObject);
      fabricCanvas.renderAll();
    }
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    const objects = fabricCanvas.getObjects();
    objects.forEach((obj) => fabricCanvas.remove(obj));
    fabricCanvas.renderAll();
    onDrawingChange(null);
  };

  const colorPresets = [
    "#FFFFFF", "#000000", "#FF0000", "#00FF00", "#0000FF",
    "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080"
  ];

  return (
    <div className="flex flex-col gap-2">
      {/* Drawing Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-black/50 rounded-lg flex-wrap">
        {/* Tool Selection */}
        <Button
          variant={activeTool === "draw" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTool("draw")}
          className="gap-1"
        >
          <Pen className="w-4 h-4" />
          Draw
        </Button>
        <Button
          variant={activeTool === "erase" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setActiveTool("erase");
            handleErase();
          }}
          className="gap-1"
        >
          <Eraser className="w-4 h-4" />
          Erase
        </Button>

        {/* Brush Type */}
        {activeTool === "draw" && (
          <>
            <Select value={brushType} onValueChange={(v: any) => setBrushType(v)}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="marker">Marker</SelectItem>
                <SelectItem value="highlighter">Highlighter</SelectItem>
                <SelectItem value="neon">Neon</SelectItem>
              </SelectContent>
            </Select>

            {/* Color Picker */}
            <div className="flex items-center gap-1">
              <Palette className="w-4 h-4 text-white" />
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0"
              />
              <div className="flex gap-1">
                {colorPresets.slice(0, 5).map((color) => (
                  <button
                    key={color}
                    onClick={() => setBrushColor(color)}
                    className="w-6 h-6 rounded-full border-2 border-white/20 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    aria-label={`Set color to ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* Brush Size */}
            <div className="flex items-center gap-2 flex-1 min-w-32">
              <Minus className="w-4 h-4 text-white" />
              <Slider
                value={[brushSize]}
                onValueChange={(v) => setBrushSize(v[0])}
                min={1}
                max={20}
                step={1}
                className="flex-1"
              />
              <Plus className="w-4 h-4 text-white" />
            </div>
          </>
        )}

        {/* Clear */}
        <Button
          variant="destructive"
          size="sm"
          onClick={handleClear}
        >
          Clear All
        </Button>
      </div>

      {/* Canvas */}
      <div className="relative w-full" style={{ height: `${height}px` }}>
        {/* Background Image/Gradient */}
        {backgroundImage && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}
        {/* Drawing Canvas Overlay */}
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0" 
          style={{ pointerEvents: 'auto' }}
        />
      </div>
    </div>
  );
};
