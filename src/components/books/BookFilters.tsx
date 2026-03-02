"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const GENRES = ["Literary Fiction", "Fantasy", "Science Fiction", "Historical Fiction", "Thriller", "Mystery", "Romance", "Nonfiction", "Horror", "Dark Academia"];
const MOODS = ["uplifting", "melancholic", "atmospheric", "thrilling", "romantic", "funny", "dark", "thought-provoking", "emotional", "mysterious"];
const PACES = [{ value: "SLOW", label: "Slow burn" }, { value: "MEDIUM", label: "Moderate" }, { value: "FAST", label: "Fast-paced" }];
const SORT_OPTIONS = [
  { value: "ratingCount", label: "Most popular" },
  { value: "avgRating", label: "Highest rated" },
  { value: "completionRate", label: "Most finished" },
  { value: "publishedAt", label: "Newest" },
  { value: "title", label: "Title A–Z" },
];

export function BookFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  function update(key: string, value: string | null) {
    const p = new URLSearchParams(params.toString());
    if (value) p.set(key, value); else p.delete(key);
    p.delete("page");
    router.push(`/books?${p.toString()}`);
  }

  function toggleArray(key: string, value: string) {
    const p = new URLSearchParams(params.toString());
    const existing = p.getAll(key);
    if (existing.includes(value)) {
      p.delete(key);
      existing.filter((v) => v !== value).forEach((v) => p.append(key, v));
    } else {
      p.append(key, value);
    }
    p.delete("page");
    router.push(`/books?${p.toString()}`);
  }

  function clearAll() {
    router.push("/books");
  }

  const activeGenres = params.getAll("genre");
  const activeMoods = params.getAll("mood");
  const activePaces = params.getAll("pace");
  const activeSort = params.get("sortBy") ?? "ratingCount";
  const hasFilters = activeGenres.length + activeMoods.length + activePaces.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Sort + filter toggle row */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={activeSort}
          onChange={(e) => update("sortBy", e.target.value)}
          className="h-8 text-sm border border-border rounded-md px-2 bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label="Sort books by"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(!open)}
          className="gap-1.5"
          aria-expanded={open}
        >
          <Filter className="w-3.5 h-3.5" />
          Filters
          {hasFilters && (
            <span className="w-4 h-4 rounded-full bg-accent text-white text-2xs flex items-center justify-center">
              {activeGenres.length + activeMoods.length + activePaces.length}
            </span>
          )}
        </Button>

        {hasFilters && (
          <button onClick={clearAll} className="text-xs text-ink-secondary hover:text-danger flex items-center gap-1 transition-colors">
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      {/* Filter drawer */}
      {open && (
        <div className="bg-surface border border-border rounded-lg p-5 animate-slide-up space-y-5">
          {/* Genre */}
          <div>
            <div className="text-xs font-semibold text-ink-tertiary uppercase tracking-wide mb-2">Genre</div>
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => toggleArray("genre", g)}
                  className={cn(
                    "pill cursor-pointer border transition-colors",
                    activeGenres.includes(g)
                      ? "bg-accent text-white border-accent"
                      : "bg-surface text-ink-secondary border-border hover:border-accent hover:text-accent"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div>
            <div className="text-xs font-semibold text-ink-tertiary uppercase tracking-wide mb-2">Mood</div>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m}
                  onClick={() => toggleArray("mood", m)}
                  className={cn(
                    "pill cursor-pointer border transition-colors capitalize",
                    activeMoods.includes(m)
                      ? "bg-accent text-white border-accent"
                      : "bg-surface text-ink-secondary border-border hover:border-accent hover:text-accent"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Pace */}
          <div>
            <div className="text-xs font-semibold text-ink-tertiary uppercase tracking-wide mb-2">Pace</div>
            <div className="flex flex-wrap gap-1.5">
              {PACES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => toggleArray("pace", p.value)}
                  className={cn(
                    "pill cursor-pointer border transition-colors",
                    activePaces.includes(p.value)
                      ? "bg-accent text-white border-accent"
                      : "bg-surface text-ink-secondary border-border hover:border-accent hover:text-accent"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating range */}
          <div>
            <div className="text-xs font-semibold text-ink-tertiary uppercase tracking-wide mb-2">Min. rating</div>
            <div className="flex gap-2">
              {[3, 3.5, 4, 4.5].map((r) => (
                <button
                  key={r}
                  onClick={() => update("minRating", params.get("minRating") === String(r) ? null : String(r))}
                  className={cn(
                    "pill cursor-pointer border transition-colors",
                    params.get("minRating") === String(r)
                      ? "bg-accent text-white border-accent"
                      : "bg-surface text-ink-secondary border-border hover:border-accent hover:text-accent"
                  )}
                >
                  {r}+ ★
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
