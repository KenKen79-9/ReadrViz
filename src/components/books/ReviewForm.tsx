"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface ReviewFormProps {
  bookId: string;
  existingReview?: { rating: number; text: string | null };
  onSuccess?: () => void;
}

export function ReviewForm({ bookId, existingReview, onSuccess }: ReviewFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [hovered, setHovered] = useState(0);
  const [text, setText] = useState(existingReview?.text ?? "");
  const [hasSpoilers, setHasSpoilers] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!session) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      toast({ title: "Please select a rating", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, rating, text: text.trim() || undefined, hasSpoilers }),
      });
      if (!res.ok) throw new Error();
      toast({ title: existingReview ? "Review updated" : "Review posted" });
      onSuccess?.();
      router.refresh();
    } catch {
      toast({ title: "Error", description: "Could not post review.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Star rating */}
      <div>
        <div className="text-sm font-medium text-ink mb-2">Your rating</div>
        <div className="flex gap-1" role="group" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              aria-label={`${star} star${star !== 1 ? "s" : ""}`}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  "w-7 h-7 transition-colors",
                  star <= (hovered || rating)
                    ? "fill-warning text-warning"
                    : "text-border"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Review text */}
      <div>
        <label className="text-sm font-medium text-ink block mb-1.5" htmlFor="review-text">
          Review <span className="text-ink-tertiary font-normal">(optional)</span>
        </label>
        <textarea
          id="review-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          maxLength={5000}
          placeholder="What did you think?"
          className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none transition"
        />
        <div className="text-2xs text-ink-tertiary text-right mt-0.5">{text.length}/5000</div>
      </div>

      {/* Spoiler toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={hasSpoilers}
          onChange={(e) => setHasSpoilers(e.target.checked)}
          className="rounded border-border text-accent focus:ring-accent"
        />
        <span className="text-sm text-ink-secondary">Contains spoilers</span>
      </label>

      <Button type="submit" disabled={loading || rating === 0}>
        {loading ? "Posting…" : existingReview ? "Update review" : "Post review"}
      </Button>
    </form>
  );
}
