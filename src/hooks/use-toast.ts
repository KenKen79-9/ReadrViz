"use client";
import { useState, useCallback } from "react";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

let toastCount = 0;
const listeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

function notify(t: Toast) {
  toasts = [...toasts, t];
  listeners.forEach((fn) => fn(toasts));
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    listeners.forEach((fn) => fn(toasts));
  }, 4000);
}

export function toast(opts: Omit<Toast, "id">) {
  notify({ ...opts, id: String(++toastCount) });
}

export function useToast() {
  const [state, setState] = useState<Toast[]>(toasts);

  const subscribe = useCallback(() => {
    const fn = (t: Toast[]) => setState([...t]);
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  // Subscribe on mount
  useState(() => { const unsub = subscribe(); return unsub; });

  const dismiss = useCallback((id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    listeners.forEach((fn) => fn(toasts));
  }, []);

  return { toasts: state, toast, dismiss };
}
