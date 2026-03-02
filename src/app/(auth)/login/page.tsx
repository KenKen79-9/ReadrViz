"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      toast({ title: "Invalid credentials", description: "Check your email and password.", variant: "destructive" });
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  function fillDemo() {
    setEmail("demo@readrviz.dev");
    setPassword("password123");
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-3">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-ink">Welcome back</h1>
          <p className="text-sm text-ink-secondary mt-1">Sign in to your ReadrViz account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink transition-colors"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        {/* Demo shortcut */}
        <div className="mt-4 p-3 bg-accent-light rounded-lg">
          <p className="text-xs text-accent text-center">
            <button onClick={fillDemo} className="font-medium underline hover:no-underline">
              Use demo account
            </button>{" "}
            — demo@readrviz.dev / password123
          </p>
        </div>

        <p className="text-center text-sm text-ink-secondary mt-6">
          No account?{" "}
          <Link href="/register" className="text-accent hover:underline font-medium">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
