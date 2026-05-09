import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCw, X } from "lucide-react";

interface DocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentUrl: string;
  documentType: string;
  title?: string;
}

export const DocumentViewer = ({ 
  open, 
  onOpenChange, 
  documentUrl, 
  documentType,
  title = "Document Viewer"
}: DocumentViewerProps) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(100);
    setRotation(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-secondary">{title}</DialogTitle>
          <div className="flex gap-2 pt-4">
            <Button size="sm" variant="outline" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleRotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleReset}>
              <X className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <div className="ml-auto text-sm text-muted-foreground self-center">
              {zoom}%
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/30 rounded-lg p-4">
          <div className="flex items-center justify-center min-h-full">
            <img
              src={documentUrl}
              alt={documentType}
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease-in-out',
                maxWidth: '100%',
                height: 'auto'
              }}
              className="object-contain"
            loading="lazy"/>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
