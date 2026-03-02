"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BookOpen, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const SHELF_OPTIONS = [
  { type: "WANT_TO_READ", label: "Want to Read", icon: "📋" },
  { type: "CURRENTLY_READING", label: "Currently Reading", icon: "📖" },
  { type: "READ", label: "Read", icon: "✅" },
  { type: "DNF", label: "Did Not Finish", icon: "🚫" },
] as const;

interface AddToShelfButtonProps {
  bookId: string;
  currentShelfType?: string | null;
}

export function AddToShelfButton({ bookId, currentShelfType }: AddToShelfButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const current = SHELF_OPTIONS.find((s) => s.type === currentShelfType);

  async function addToShelf(shelfType: string) {
    if (!session) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setOpen(false);

    try {
      const res = await fetch("/api/shelves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, shelfType }),
      });

      if (!res.ok) throw new Error("Failed to add to shelf");

      toast({ title: "Added to shelf", description: SHELF_OPTIONS.find((s) => s.type === shelfType)?.label });
      router.refresh();
    } catch {
      toast({ title: "Error", description: "Could not add to shelf. Try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <div className="flex rounded-md overflow-hidden shadow-sm">
        <Button
          onClick={() => current ? undefined : addToShelf("WANT_TO_READ")}
          disabled={loading}
          className={cn("rounded-r-none", current && "bg-success hover:bg-success/90")}
        >
          {current ? (
            <>
              <Check className="w-4 h-4" />
              {current.label}
            </>
          ) : (
            <>
              <BookOpen className="w-4 h-4" />
              Add to Shelf
            </>
          )}
        </Button>
        <Button
          onClick={() => setOpen(!open)}
          disabled={loading}
          className="rounded-l-none border-l border-accent-hover px-2"
          aria-label="More shelf options"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>

      {open && (
        <div
          className="absolute top-full mt-1 left-0 w-48 bg-surface border border-border rounded-lg shadow-elevated z-10 py-1 animate-slide-up"
          role="menu"
        >
          {SHELF_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              onClick={() => addToShelf(opt.type)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-border-subtle transition-colors text-left",
                currentShelfType === opt.type && "text-accent font-medium"
              )}
              role="menuitem"
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
              {currentShelfType === opt.type && <Check className="w-3 h-3 ml-auto text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
