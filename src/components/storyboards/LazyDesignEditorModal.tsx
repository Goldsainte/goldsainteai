import { lazy, Suspense } from "react";

// Defers loading the heavy fabric.js bundle until the editor is actually opened.
const DesignEditorModal = lazy(() =>
  import("./DesignEditorModal").then((m) => ({ default: m.DesignEditorModal }))
);

interface LazyDesignEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (imageUrl: string) => void;
}

export function LazyDesignEditorModal(props: LazyDesignEditorModalProps) {
  if (!props.open) return null;
  return (
    <Suspense fallback={null}>
      <DesignEditorModal {...props} />
    </Suspense>
  );
}