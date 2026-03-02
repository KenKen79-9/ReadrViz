"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface SearchResult {
  books: Array<{ id: string; title: string; author: string; coverUrl: string | null }>;
  users: Array<{ id: string; name: string | null; username: string; image: string | null }>;
  clubs: Array<{ id: string; name: string; _count: { members: number } }>;
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const json = await res.json();
    setResults(json.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasResults = results && (results.books.length + results.users.length + results.clubs.length > 0);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary pointer-events-none" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search books, authors, users…"
          className="w-full pl-9 pr-3 py-1.5 text-sm bg-canvas border border-border rounded-md placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
          aria-label="Search"
          aria-expanded={open && hasResults ? true : false}
          aria-haspopup="listbox"
        />
      </div>

      {open && query.length >= 2 && (
        <div className="absolute top-full mt-1 w-full min-w-[320px] bg-surface border border-border rounded-lg shadow-elevated z-50 overflow-hidden animate-slide-up">
          {loading && (
            <div className="p-4 text-sm text-ink-tertiary text-center">Searching…</div>
          )}

          {!loading && !hasResults && (
            <div className="p-4 text-sm text-ink-tertiary text-center">No results for "{query}"</div>
          )}

          {!loading && hasResults && (
            <div className="py-2" role="listbox">
              {results!.books.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-2xs font-semibold text-ink-tertiary uppercase tracking-wide">Books</div>
                  {results!.books.map((book) => (
                    <Link
                      key={book.id}
                      href={`/books/${book.id}`}
                      onClick={() => { setOpen(false); setQuery(""); }}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-border-subtle transition-colors"
                      role="option"
                    >
                      <div className="w-8 h-10 rounded shrink-0 bg-border-subtle overflow-hidden">
                        {book.coverUrl && (
                          <Image src={book.coverUrl} alt={book.title} width={32} height={40} className="object-cover w-full h-full" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-ink truncate">{book.title}</div>
                        <div className="text-xs text-ink-secondary truncate">{book.author}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {results!.users.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-2xs font-semibold text-ink-tertiary uppercase tracking-wide mt-1">Readers</div>
                  {results!.users.map((user) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.username}`}
                      onClick={() => { setOpen(false); setQuery(""); }}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-border-subtle transition-colors"
                      role="option"
                    >
                      <div className={cn("w-7 h-7 rounded-full shrink-0 bg-accent-light flex items-center justify-center overflow-hidden")}>
                        {user.image ? (
                          <Image src={user.image} alt={user.name ?? ""} width={28} height={28} className="object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-accent">{(user.name ?? user.username)[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-ink">{user.name}</div>
                        <div className="text-xs text-ink-secondary">@{user.username}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {results!.clubs.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-2xs font-semibold text-ink-tertiary uppercase tracking-wide mt-1">Clubs</div>
                  {results!.clubs.map((club) => (
                    <Link
                      key={club.id}
                      href={`/clubs/${club.id}`}
                      onClick={() => { setOpen(false); setQuery(""); }}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-border-subtle transition-colors"
                      role="option"
                    >
                      <div className="w-7 h-7 rounded shrink-0 bg-accent-light flex items-center justify-center">
                        <span className="text-xs font-bold text-accent">C</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-ink">{club.name}</div>
                        <div className="text-xs text-ink-secondary">{club._count.members} members</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <div className="border-t border-border mt-2 pt-2 pb-1 px-3">
                <Link
                  href={`/books?query=${encodeURIComponent(query)}`}
                  onClick={() => { setOpen(false); setQuery(""); }}
                  className="text-xs text-accent hover:underline"
                >
                  Search all books for "{query}" →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
