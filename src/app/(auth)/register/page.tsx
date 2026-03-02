"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  function update(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await res.json();

    if (!res.ok) {
      toast({ title: "Registration failed", description: json.error, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Auto sign in
    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-3">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-ink">Create your account</h1>
          <p className="text-sm text-ink-secondary mt-1">Start tracking your reading journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Display name</Label>
            <Input id="name" value={form.name} onChange={update("name")} placeholder="Alice Chen" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary text-sm">@</span>
              <Input
                id="username"
                value={form.username}
                onChange={update("username")}
                placeholder="alice_reads"
                pattern="[a-z0-9_]+"
                title="Lowercase letters, numbers, underscores only"
                className="pl-7"
                required
              />
            </div>
            <p className="text-2xs text-ink-tertiary">Lowercase letters, numbers, and underscores only</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-email">Email</Label>
            <Input id="reg-email" type="email" value={form.email} onChange={update("email")} placeholder="you@example.com" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-password">Password</Label>
            <Input id="reg-password" type="password" value={form.password} onChange={update("password")} placeholder="At least 8 characters" minLength={8} required />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-ink-secondary mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
