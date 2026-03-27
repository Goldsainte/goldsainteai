import { useState, useRef, useEffect, useCallback } from "react";
import { Canvas as FabricCanvas, FabricText, Rect, Circle, FabricImage } from "fabric";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Type,
  Square,
  CircleIcon,
  ImagePlus,
  Download,
  Loader2,
  Trash2,
  Palette,
} from "lucide-react";
import { toast } from "sonner";

interface DesignEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (imageUrl: string) => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const PRESET_COLORS = [
  "#0a2225", "#0c4d47", "#C7A962", "#E5DFC6", "#ffffff",
  "#1a1a1a", "#e74c3c", "#3498db", "#2ecc71", "#f39c12",
  "#9b59b6", "#1abc9c", "#e67e22", "#34495e", "#ecf0f1",
];

export function DesignEditorModal({ open, onOpenChange, onExport }: DesignEditorModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [activeColor, setActiveColor] = useState("#0a2225");

  useEffect(() => {
    if (!open || !canvasRef.current) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (fabricRef.current) {
        fabricRef.current.dispose();
      }
      const canvas = new FabricCanvas(canvasRef.current!, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: "#ffffff",
      });
      fabricRef.current = canvas;
    }, 100);

    return () => {
      clearTimeout(timer);
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
    };
  }, [open]);

  const addText = useCallback(() => {
    if (!fabricRef.current) return;
    const text = new FabricText("Your text here", {
      left: 100,
      top: 100,
      fontSize: 32,
      fontFamily: "Georgia, serif",
      fill: activeColor,
    });
    fabricRef.current.add(text);
    fabricRef.current.setActiveObject(text);
    fabricRef.current.renderAll();
  }, [activeColor]);

  const addRect = useCallback(() => {
    if (!fabricRef.current) return;
    const rect = new Rect({
      left: 150,
      top: 150,
      width: 200,
      height: 150,
      fill: activeColor,
      rx: 12,
      ry: 12,
    });
    fabricRef.current.add(rect);
    fabricRef.current.setActiveObject(rect);
    fabricRef.current.renderAll();
  }, [activeColor]);

  const addCircle = useCallback(() => {
    if (!fabricRef.current) return;
    const circle = new Circle({
      left: 200,
      top: 200,
      radius: 80,
      fill: activeColor,
    });
    fabricRef.current.add(circle);
    fabricRef.current.setActiveObject(circle);
    fabricRef.current.renderAll();
  }, [activeColor]);

  const addImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricRef.current) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const imgEl = new Image();
      imgEl.onload = () => {
        const fabImg = new FabricImage(imgEl, {
          left: 50,
          top: 50,
        });
        // Scale to fit canvas
        const scale = Math.min(
          (CANVAS_WIDTH * 0.6) / imgEl.width,
          (CANVAS_HEIGHT * 0.6) / imgEl.height,
          1
        );
        fabImg.scale(scale);
        fabricRef.current?.add(fabImg);
        fabricRef.current?.setActiveObject(fabImg);
        fabricRef.current?.renderAll();
      };
      imgEl.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const deleteSelected = useCallback(() => {
    if (!fabricRef.current) return;
    const active = fabricRef.current.getActiveObjects();
    if (active.length > 0) {
      active.forEach((obj) => fabricRef.current?.remove(obj));
      fabricRef.current.discardActiveObject();
      fabricRef.current.renderAll();
    }
  }, []);

  const handleExport = async () => {
    if (!fabricRef.current) return;
    setExporting(true);
    try {
      const dataUrl = fabricRef.current.toDataURL({
        format: "png",
        quality: 1,
        multiplier: 2,
      });

      // Convert dataURL to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const fileName = `storyboard-designs/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

      const { error } = await supabase.storage
        .from("trip-assets")
        .upload(fileName, blob, {
          contentType: "image/png",
          cacheControl: "3600",
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("trip-assets")
        .getPublicUrl(fileName);

      onExport(urlData.publicUrl);
      onOpenChange(false);
      toast.success("Design added to storyboard!");
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error("Failed to export design: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Design Editor</DialogTitle>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageFile}
          className="hidden"
        />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
          <Button variant="outline" size="sm" onClick={addText} className="gap-1.5">
            <Type className="h-3.5 w-3.5" /> Text
          </Button>
          <Button variant="outline" size="sm" onClick={addRect} className="gap-1.5">
            <Square className="h-3.5 w-3.5" /> Rectangle
          </Button>
          <Button variant="outline" size="sm" onClick={addCircle} className="gap-1.5">
            <CircleIcon className="h-3.5 w-3.5" /> Circle
          </Button>
          <Button variant="outline" size="sm" onClick={addImage} className="gap-1.5">
            <ImagePlus className="h-3.5 w-3.5" /> Image
          </Button>
          <div className="h-6 w-px bg-border mx-1" />
          <Button variant="outline" size="sm" onClick={deleteSelected} className="gap-1.5 text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>

        {/* Color palette */}
        <div className="flex items-center gap-2 flex-wrap">
          <Palette className="h-3.5 w-3.5 text-muted-foreground" />
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setActiveColor(color)}
              className={`h-6 w-6 rounded-full border-2 transition-transform ${
                activeColor === color ? "border-foreground scale-125" : "border-border"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* Canvas */}
        <div className="border border-border rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center">
          <canvas ref={canvasRef} />
        </div>

        {/* Export */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting} className="gap-1.5">
            {exporting ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Exporting...</>
            ) : (
              <><Download className="h-3.5 w-3.5" /> Export & Add to Storyboard</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
