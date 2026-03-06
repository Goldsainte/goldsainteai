import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { generateArchitecturePDF } from "@/utils/generateArchitecturePDF";

export default function ArchitectureDiagramPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-3xl font-bold text-foreground">Goldsainte Architecture Diagram</h1>
        <p className="text-muted-foreground">Download the full platform architecture as a PDF document.</p>
        <Button size="lg" onClick={generateArchitecturePDF} className="gap-2">
          <FileDown className="w-5 h-5" />
          Download Architecture PDF
        </Button>
      </div>
    </div>
  );
}
