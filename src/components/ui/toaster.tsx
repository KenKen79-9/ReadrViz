"use client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-start gap-3 rounded-lg border p-4 shadow-elevated animate-slide-up bg-surface",
            toast.variant === "destructive" && "border-danger-light bg-danger-light/20"
          )}
          role="alert"
        >
          <div className="flex-1 text-sm">
            {toast.title && <div className="font-medium text-ink">{toast.title}</div>}
            {toast.description && <div className="text-ink-secondary mt-0.5">{toast.description}</div>}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="text-ink-tertiary hover:text-ink transition-colors shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
