import { Loader2 } from "lucide-react";

interface LoadingFallbackProps {
  message?: string;
}

export const LoadingFallback = ({ message = "Loading..." }: LoadingFallbackProps) => {
  return (
    <div className="min-h-[400px] w-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};
