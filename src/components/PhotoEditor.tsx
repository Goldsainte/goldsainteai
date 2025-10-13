import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Type, Image, Shapes, Frame, Sparkles, X, Eraser, Palette } from "lucide-react";
import { toast } from "sonner";
import { removeBackground, loadImage } from "@/lib/backgroundRemoval";

interface PhotoEditorProps {
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
  onCancel: () => void;
}

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
}

interface Sticker {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const PhotoEditor = ({ imageUrl, onSave, onCancel }: PhotoEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selectedShape, setSelectedShape] = useState<'none' | 'circle' | 'heart' | 'star'>('none');
  const [frameStyle, setFrameStyle] = useState<'none' | 'polaroid' | 'vintage' | 'modern'>('none');
  const [shakeDetected, setShakeDetected] = useState(false);
  
  // Text overlay state
  const [newText, setNewText] = useState("");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [fontSize, setFontSize] = useState([24]);
  const [fontFamily, setFontFamily] = useState("Arial");

  // Filters and adjustments
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  const [saturation, setSaturation] = useState([100]);
  const [selectedFilter, setSelectedFilter] = useState<'none' | 'sepia' | 'grayscale' | 'vintage' | 'cool' | 'warm'>('none');
  const [removingBg, setRemovingBg] = useState(false);

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);
      drawCanvas(img);
    };
    img.src = imageUrl;

    // Shake detection for frame effect
    let lastX = 0, lastY = 0, lastZ = 0;
    let shakeThreshold = 15;

    const handleMotion = (event: DeviceMotionEvent) => {
      const { x, y, z } = event.accelerationIncludingGravity || {};
      if (x && y && z) {
        const deltaX = Math.abs(x - lastX);
        const deltaY = Math.abs(y - lastY);
        const deltaZ = Math.abs(z - lastZ);
        
        if (deltaX + deltaY + deltaZ > shakeThreshold && frameStyle !== 'none') {
          setShakeDetected(true);
          toast.success("Frame developed! 📸");
          setTimeout(() => setShakeDetected(false), 1000);
        }
        
        lastX = x;
        lastY = y;
        lastZ = z;
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [frameStyle]);

  useEffect(() => {
    if (image) {
      drawCanvas(image);
    }
  }, [textOverlays, stickers, selectedShape, frameStyle, shakeDetected, brightness, contrast, saturation, selectedFilter]);

  const drawCanvas = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply shape transformation
    if (selectedShape !== 'none') {
      ctx.save();
      applyShapeMask(ctx, canvas.width, canvas.height, selectedShape);
      ctx.clip();
    }

    // Apply filters and adjustments
    ctx.filter = `brightness(${brightness[0]}%) contrast(${contrast[0]}%) saturate(${saturation[0]}%)`;
    
    // Apply color filters
    if (selectedFilter === 'sepia') {
      ctx.filter += ' sepia(100%)';
    } else if (selectedFilter === 'grayscale') {
      ctx.filter += ' grayscale(100%)';
    } else if (selectedFilter === 'vintage') {
      ctx.filter += ' sepia(50%) contrast(110%)';
    } else if (selectedFilter === 'cool') {
      ctx.filter += ' hue-rotate(190deg)';
    } else if (selectedFilter === 'warm') {
      ctx.filter += ' hue-rotate(20deg) saturate(130%)';
    }

    // Draw image
    ctx.drawImage(img, 0, 0);

    // Reset filter
    ctx.filter = 'none';

    if (selectedShape !== 'none') {
      ctx.restore();
    }

    // Draw frame
    if (frameStyle !== 'none') {
      drawFrame(ctx, canvas.width, canvas.height, frameStyle, shakeDetected);
    }

    // Draw stickers
    stickers.forEach(sticker => {
      const stickerImg = new window.Image();
      stickerImg.src = sticker.url;
      stickerImg.onload = () => {
        ctx.drawImage(stickerImg, sticker.x, sticker.y, sticker.width, sticker.height);
      };
    });

    // Draw text overlays
    textOverlays.forEach(overlay => {
      ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
      ctx.fillStyle = overlay.color;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeText(overlay.text, overlay.x, overlay.y);
      ctx.fillText(overlay.text, overlay.x, overlay.y);
    });
  };

  const applyShapeMask = (ctx: CanvasRenderingContext2D, width: number, height: number, shape: string) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2;

    ctx.beginPath();
    
    if (shape === 'circle') {
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    } else if (shape === 'heart') {
      // Heart shape
      const topCurveHeight = radius * 0.3;
      ctx.moveTo(centerX, centerY + topCurveHeight);
      ctx.bezierCurveTo(
        centerX, centerY - radius * 0.3,
        centerX - radius, centerY - radius * 0.3,
        centerX - radius, centerY + topCurveHeight
      );
      ctx.bezierCurveTo(
        centerX - radius, centerY + (radius + topCurveHeight) * 0.5,
        centerX, centerY + (radius + topCurveHeight) * 1.2,
        centerX, centerY + radius * 1.5
      );
      ctx.bezierCurveTo(
        centerX, centerY + (radius + topCurveHeight) * 1.2,
        centerX + radius, centerY + (radius + topCurveHeight) * 0.5,
        centerX + radius, centerY + topCurveHeight
      );
      ctx.bezierCurveTo(
        centerX + radius, centerY - radius * 0.3,
        centerX, centerY - radius * 0.3,
        centerX, centerY + topCurveHeight
      );
    } else if (shape === 'star') {
      // Star shape
      const points = 5;
      const outerRadius = radius;
      const innerRadius = radius * 0.5;
      
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI * i) / points;
        const x = centerX + r * Math.sin(angle);
        const y = centerY - r * Math.cos(angle);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
    }
  };

  const drawFrame = (ctx: CanvasRenderingContext2D, width: number, height: number, style: string, shake: boolean) => {
    const frameWidth = 40;
    const opacity = shake ? 1 : 0.8;

    ctx.save();
    ctx.globalAlpha = opacity;

    if (style === 'polaroid') {
      // White polaroid frame
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, frameWidth);
      ctx.fillRect(0, height - frameWidth * 2, width, frameWidth * 2);
      ctx.fillRect(0, 0, frameWidth, height);
      ctx.fillRect(width - frameWidth, 0, frameWidth, height);
      
      // Shadow effect
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;
    } else if (style === 'vintage') {
      // Vintage sepia frame
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(0, 0, width, frameWidth / 2);
      ctx.fillRect(0, height - frameWidth / 2, width, frameWidth / 2);
      ctx.fillRect(0, 0, frameWidth / 2, height);
      ctx.fillRect(width - frameWidth / 2, 0, frameWidth / 2, height);
    } else if (style === 'modern') {
      // Modern minimal frame
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 10, width - 20, height - 20);
    }

    ctx.restore();
  };

  const addTextOverlay = () => {
    if (!newText.trim()) {
      toast.error("Please enter some text");
      return;
    }

    const overlay: TextOverlay = {
      id: Date.now().toString(),
      text: newText,
      x: 50,
      y: 100,
      fontSize: fontSize[0],
      color: textColor,
      fontFamily: fontFamily,
    };

    setTextOverlays([...textOverlays, overlay]);
    setNewText("");
    toast.success("Text added!");
  };

  const addSticker = (stickerType: string) => {
    // Emoji stickers
    const emojis: Record<string, string> = {
      heart: '❤️',
      star: '⭐',
      fire: '🔥',
      plane: '✈️',
      camera: '📷',
      location: '📍',
    };

    // Create emoji as image data URL
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = '80px Arial';
      ctx.fillText(emojis[stickerType] || '✨', 10, 80);
      
      const sticker: Sticker = {
        id: Date.now().toString(),
        url: canvas.toDataURL(),
        x: 100,
        y: 100,
        width: 100,
        height: 100,
      };

      setStickers([...stickers, sticker]);
      toast.success("Sticker added!");
    }
  };

  const handleRemoveBackground = async () => {
    if (!image) return;
    
    setRemovingBg(true);
    toast.info("Removing background... This may take a moment.");
    
    try {
      // Convert current image to blob
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      
      ctx.drawImage(image, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Failed to create blob')), 'image/png');
      });
      
      // Load as image element
      const imgElement = await loadImage(blob);
      
      // Remove background
      const resultBlob = await removeBackground(imgElement);
      
      // Load the result back as the main image
      const resultUrl = URL.createObjectURL(resultBlob);
      const newImg = new window.Image();
      newImg.crossOrigin = "anonymous";
      newImg.onload = () => {
        setImage(newImg);
        toast.success("Background removed!");
      };
      newImg.src = resultUrl;
    } catch (error) {
      console.error('Background removal error:', error);
      toast.error("Failed to remove background. Try a different image.");
    } finally {
      setRemovingBg(false);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        onSave(url);
        toast.success("Edits saved!");
      }
    }, 'image/jpeg', 0.95);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto">
          <canvas
            ref={canvasRef}
            className="w-full h-auto border border-border rounded-lg"
          />
        </div>
      </div>

      <div className="bg-background border-t border-border p-4 overflow-y-auto max-h-[40vh]">
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-4">
            <TabsTrigger value="text">
              <Type className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="stickers">
              <Image className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="shapes">
              <Shapes className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="frames">
              <Frame className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="filters">
              <Palette className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="adjust">
              <Eraser className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label>Text</Label>
              <Input
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Enter text..."
              />
            </div>
            <div className="space-y-2">
              <Label>Font Size: {fontSize[0]}px</Label>
              <Slider
                value={fontSize}
                onValueChange={setFontSize}
                min={12}
                max={72}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
              />
            </div>
            <Button onClick={addTextOverlay} className="w-full">
              Add Text
            </Button>
          </TabsContent>

          <TabsContent value="stickers" className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {['heart', 'star', 'fire', 'plane', 'camera', 'location'].map((sticker) => (
                <Button
                  key={sticker}
                  variant="outline"
                  onClick={() => addSticker(sticker)}
                  className="h-20 text-4xl"
                >
                  {sticker === 'heart' && '❤️'}
                  {sticker === 'star' && '⭐'}
                  {sticker === 'fire' && '🔥'}
                  {sticker === 'plane' && '✈️'}
                  {sticker === 'camera' && '📷'}
                  {sticker === 'location' && '📍'}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="shapes" className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant={selectedShape === 'none' ? 'default' : 'outline'}
                onClick={() => setSelectedShape('none')}
              >
                None
              </Button>
              <Button
                variant={selectedShape === 'circle' ? 'default' : 'outline'}
                onClick={() => setSelectedShape('circle')}
              >
                Circle
              </Button>
              <Button
                variant={selectedShape === 'heart' ? 'default' : 'outline'}
                onClick={() => setSelectedShape('heart')}
              >
                Heart
              </Button>
              <Button
                variant={selectedShape === 'star' ? 'default' : 'outline'}
                onClick={() => setSelectedShape('star')}
              >
                Star
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="frames" className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant={frameStyle === 'none' ? 'default' : 'outline'}
                onClick={() => setFrameStyle('none')}
              >
                None
              </Button>
              <Button
                variant={frameStyle === 'polaroid' ? 'default' : 'outline'}
                onClick={() => setFrameStyle('polaroid')}
              >
                Polaroid
              </Button>
              <Button
                variant={frameStyle === 'vintage' ? 'default' : 'outline'}
                onClick={() => setFrameStyle('vintage')}
              >
                Vintage
              </Button>
              <Button
                variant={frameStyle === 'modern' ? 'default' : 'outline'}
                onClick={() => setFrameStyle('modern')}
              >
                Modern
              </Button>
            </div>
            {frameStyle !== 'none' && (
              <div className="text-sm text-muted-foreground text-center">
                <Sparkles className="w-4 h-4 inline mr-2" />
                Shake your device to develop the frame!
              </div>
            )}
          </TabsContent>

          <TabsContent value="filters" className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={selectedFilter === 'none' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('none')}
              >
                None
              </Button>
              <Button
                variant={selectedFilter === 'sepia' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('sepia')}
              >
                Sepia
              </Button>
              <Button
                variant={selectedFilter === 'grayscale' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('grayscale')}
              >
                B&W
              </Button>
              <Button
                variant={selectedFilter === 'vintage' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('vintage')}
              >
                Vintage
              </Button>
              <Button
                variant={selectedFilter === 'cool' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('cool')}
              >
                Cool
              </Button>
              <Button
                variant={selectedFilter === 'warm' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('warm')}
              >
                Warm
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="adjust" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Brightness: {brightness[0]}%</Label>
                <Slider
                  value={brightness}
                  onValueChange={setBrightness}
                  min={0}
                  max={200}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Contrast: {contrast[0]}%</Label>
                <Slider
                  value={contrast}
                  onValueChange={setContrast}
                  min={0}
                  max={200}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Saturation: {saturation[0]}%</Label>
                <Slider
                  value={saturation}
                  onValueChange={setSaturation}
                  min={0}
                  max={200}
                  step={1}
                />
              </div>
              <Button 
                onClick={handleRemoveBackground} 
                variant="outline" 
                className="w-full"
                disabled={removingBg}
              >
                <Eraser className="w-4 h-4 mr-2" />
                {removingBg ? 'Removing Background...' : 'Remove Background'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Save Edits
          </Button>
        </div>
      </div>
    </div>
  );
};
