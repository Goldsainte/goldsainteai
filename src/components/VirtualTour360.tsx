import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, RotateCw, ZoomIn, ZoomOut, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface VirtualTour360Props {
  images360: Array<{
    url: string;
    title: string;
    description?: string;
  }>;
  hotelName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VirtualTour360 = ({
  images360,
  hotelName,
  open,
  onOpenChange,
}: VirtualTour360Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(true);
  const [fov, setFov] = useState(75);
  
  // Three.js refs
  const sceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const sphereRef = useRef<any>(null);
  const animationFrameRef = useRef<number>();
  
  // Mouse interaction refs
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!open || !canvasRef.current || images360.length === 0) return;

    const loadThreeJS = async () => {
      // Dynamically import Three.js
      const THREE = await import('three');
      
      // Scene setup
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        fov,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, 0.1);

      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current!,
        antialias: true,
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);

      // Create sphere for 360 image
      const geometry = new THREE.SphereGeometry(500, 60, 40);
      geometry.scale(-1, 1, 1); // Invert to see texture from inside

      // Load texture
      const textureLoader = new THREE.TextureLoader();
      setLoading(true);
      
      textureLoader.load(
        images360[currentIndex].url,
        (texture) => {
          const material = new THREE.MeshBasicMaterial({ map: texture });
          const sphere = new THREE.Mesh(geometry, material);
          scene.add(sphere);
          sphereRef.current = sphere;
          setLoading(false);
        },
        undefined,
        (error) => {
          console.error('Error loading 360 image:', error);
          setLoading(false);
        }
      );

      sceneRef.current = scene;
      cameraRef.current = camera;
      rendererRef.current = renderer;

      // Animation loop
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);
        
        // Apply rotation
        if (cameraRef.current) {
          cameraRef.current.rotation.y = rotationRef.current.y;
          cameraRef.current.rotation.x = Math.max(
            -Math.PI / 2,
            Math.min(Math.PI / 2, rotationRef.current.x)
          );
        }
        
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      };
      animate();

      // Handle window resize
      const handleResize = () => {
        if (cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = window.innerWidth / window.innerHeight;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(window.innerWidth, window.innerHeight);
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (rendererRef.current) {
          rendererRef.current.dispose();
        }
      };
    };

    loadThreeJS();
  }, [open, currentIndex, fov, images360]);

  // Mouse/touch controls
  useEffect(() => {
    if (!canvasRef.current) return;

    const handleMouseDown = (e: MouseEvent | TouchEvent) => {
      isDraggingRef.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      previousMousePositionRef.current = { x: clientX, y: clientY };
    };

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - previousMousePositionRef.current.x;
      const deltaY = clientY - previousMousePositionRef.current.y;

      rotationRef.current.y += deltaX * 0.003;
      rotationRef.current.x += deltaY * 0.003;

      previousMousePositionRef.current = { x: clientX, y: clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const canvas = canvasRef.current;
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleMouseDown);
    canvas.addEventListener('touchmove', handleMouseMove);
    canvas.addEventListener('touchend', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleMouseDown);
      canvas.removeEventListener('touchmove', handleMouseMove);
      canvas.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images360.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images360.length - 1 ? 0 : prev + 1));
  };

  const handleReset = () => {
    rotationRef.current = { x: 0, y: 0 };
  };

  const handleZoomIn = () => {
    setFov((prev) => Math.max(30, prev - 10));
    if (cameraRef.current) {
      cameraRef.current.fov = fov - 10;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  const handleZoomOut = () => {
    setFov((prev) => Math.min(120, prev + 10));
    if (cameraRef.current) {
      cameraRef.current.fov = fov + 10;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  const currentImage = images360[currentIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-full p-0 gap-0 border-0 overflow-hidden">
        {/* Canvas */}
        <div ref={containerRef} className="relative w-full h-full bg-black">
          <canvas ref={canvasRef} className="w-full h-full" />

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4" />
                <p className="text-lg">Loading 360° Experience...</p>
              </div>
            </div>
          )}

          {/* Controls overlay */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white text-xl font-semibold">{hotelName}</h2>
                <p className="text-white/80 text-sm">{currentImage.title}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
            <div className="flex items-center justify-between">
              {/* Navigation */}
              {images360.length > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <span className="text-white text-sm">
                    {currentIndex + 1} / {images360.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={handleNext}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              )}

              {/* Center controls */}
              <div className="flex items-center gap-2 mx-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={handleZoomOut}
                >
                  <ZoomOut className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={handleReset}
                >
                  <RotateCw className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={handleZoomIn}
                >
                  <ZoomIn className="h-5 w-5" />
                </Button>
              </div>

              {/* Info toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setShowInfo(!showInfo)}
              >
                <Info className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Info panel */}
          {showInfo && (
            <div className="absolute left-4 bottom-24 max-w-sm bg-black/70 backdrop-blur-md text-white p-4 rounded-lg">
              <h3 className="font-semibold mb-2">How to Navigate</h3>
              <ul className="text-sm space-y-1 text-white/80">
                <li>• Click and drag to look around</li>
                <li>• Use zoom buttons to get closer</li>
                <li>• Press reset to return to start</li>
                {images360.length > 1 && <li>• Navigate between rooms with arrows</li>}
              </ul>
              {currentImage.description && (
                <p className="mt-3 text-sm text-white/80 border-t border-white/20 pt-3">
                  {currentImage.description}
                </p>
              )}
            </div>
          )}

          {/* VR Badge */}
          <Badge className="absolute top-20 left-4 bg-primary text-primary-foreground">
            360° Virtual Tour
          </Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
};
