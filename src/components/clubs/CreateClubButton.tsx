"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export function CreateClubButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast({ title: "Club created!", description: name });
      setOpen(false);
      router.push(`/clubs/${json.data.id}`);
      router.refresh();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="w-4 h-4" />
        Create club
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="bg-surface border border-border rounded-xl shadow-elevated w-full max-w-md mx-4 p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif font-semibold text-ink">Create a book club</h2>
              <button onClick={() => setOpen(false)} className="text-ink-tertiary hover:text-ink transition-colors" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="club-name">Club name</Label>
                <Input
                  id="club-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Literary Fiction Society"
                  required
                  maxLength={100}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="club-desc">Description <span className="text-ink-tertiary font-normal">(optional)</span></Label>
                <textarea
                  id="club-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What will your club read and discuss?"
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none transition"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading || !name.trim()}>
                  {loading ? "Creating…" : "Create club"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
