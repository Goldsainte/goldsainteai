import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info } from "lucide-react";

interface SensitiveContentWarningProps {
  labelType: string;
  warningText: string;
  infoUrl?: string;
  children: React.ReactNode;
}

export default function SensitiveContentWarning({
  labelType,
  warningText,
  infoUrl,
  children,
}: SensitiveContentWarningProps) {
  const [showContent, setShowContent] = useState(false);

  if (showContent) {
    return <>{children}</>;
  }

  return (
    <Card className="p-8 text-center space-y-4">
      <div className="flex justify-center">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
      </div>
      
      <div>
        <h3 className="font-semibold text-lg mb-2">Sensitive Content</h3>
        <p className="text-muted-foreground">{warningText}</p>
      </div>

      {infoUrl && (
        <a
          href={infoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Info className="h-4 w-4" />
          Learn more about this topic
        </a>
      )}

      <Button onClick={() => setShowContent(true)} variant="outline">
        View Content
      </Button>
    </Card>
  );
}
