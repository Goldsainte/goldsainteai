import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

type Request = ConfirmOptions & { resolve: (value: boolean) => void };

const EVT = "lovable:confirm-request";

/**
 * Imperative replacement for window.confirm() that renders a styled
 * AlertDialog. Mount <ConfirmDialogHost /> once near the app root.
 *
 * Usage:
 *   if (!(await confirmDialog({ title: "Delete?", destructive: true }))) return;
 */
export function confirmDialog(opts: ConfirmOptions = {}): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    window.dispatchEvent(
      new CustomEvent<Request>(EVT, { detail: { ...opts, resolve } }),
    );
  });
}

export function ConfirmDialogHost() {
  const [req, setReq] = useState<Request | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<Request>).detail;
      setReq(detail);
    };
    window.addEventListener(EVT, handler as EventListener);
    return () => window.removeEventListener(EVT, handler as EventListener);
  }, []);

  const settle = (value: boolean) => {
    req?.resolve(value);
    setReq(null);
  };

  return (
    <AlertDialog
      open={!!req}
      onOpenChange={(open) => {
        if (!open) settle(false);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{req?.title ?? "Are you sure?"}</AlertDialogTitle>
          {req?.description ? (
            <AlertDialogDescription>{req.description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => settle(false)}>
            {req?.cancelText ?? "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => settle(true)}
            className={
              req?.destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : undefined
            }
          >
            {req?.confirmText ?? "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}