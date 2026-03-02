import Link from "next/link";
import { db } from "@/lib/db";
import { BookCard } from "@/components/books/BookCard";
import { ArrowRight, BarChart2, Users, BookOpen, TrendingUp } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  const featuredBooks = await db.book.findMany({
    orderBy: { ratingCount: "desc" },
    take: 6,
    select: {
      id: true, title: true, author: true, coverUrl: true,
      avgRating: true, ratingCount: true, completionRate: true,
      pace: true, genre: true, pageCount: true,
    },
  });

  const stats = await Promise.all([
    db.book.count(),
    db.user.count(),
    db.review.count(),
  ]);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-b from-accent-light/40 to-canvas border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 pill bg-accent-light text-accent border border-accent/20 mb-6 text-sm">
            <TrendingUp className="w-3.5 h-3.5" />
            The modern Goodreads alternative
          </div>
          <h1 className="font-serif text-5xl sm:text-6xl font-bold text-ink leading-tight mb-6">
            Read more.<br />
            <span className="text-accent">Understand your reading.</span>
          </h1>
          <p className="text-lg text-ink-secondary max-w-2xl mx-auto mb-10">
            Track every book, discover what you'll actually finish, and connect with readers who share your taste. Analytics that make you a better reader.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-lg font-medium hover:bg-accent-hover transition-colors shadow-sm"
            >
              Start tracking free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/books"
              className="inline-flex items-center gap-2 bg-surface text-ink px-6 py-3 rounded-lg font-medium border border-border hover:bg-border-subtle transition-colors"
            >
              Browse books
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-12 text-center">
            {[
              { value: stats[0].toLocaleString(), label: "Books" },
              { value: stats[1].toLocaleString(), label: "Readers" },
              { value: stats[2].toLocaleString(), label: "Reviews" },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-serif text-2xl font-bold text-ink">{s.value}</div>
                <div className="text-xs text-ink-secondary mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl font-bold text-ink mb-3">Everything Goodreads should have been</h2>
          <p className="text-ink-secondary max-w-xl mx-auto">Built for readers who want to understand their reading habits, not just log them.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: BarChart2,
              title: "Reading Analytics",
              desc: "Pages per day, streaks, DNF rates by genre, cost per book, and a Spotify Wrapped–style year-end card.",
            },
            {
              icon: BookOpen,
              title: "Smart Recommendations",
              desc: "Hybrid content-based + collaborative filtering. Includes a 'probability you\u2019ll finish this' score.",
            },
            {
              icon: Users,
              title: "Book Clubs",
              desc: "Schedule reads, discuss by chapter milestone, track participation and retention for club admins.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-surface border border-border rounded-lg p-6 shadow-card">
              <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-serif font-semibold text-ink mb-2">{title}</h3>
              <p className="text-sm text-ink-secondary leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured books */}
      <section className="py-16 bg-canvas border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-2xl font-bold text-ink">Trending this month</h2>
            <Link href="/books" className="text-sm text-accent hover:underline flex items-center gap-1">
              Browse all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="font-serif text-3xl font-bold text-ink mb-4">Ready to actually understand your reading?</h2>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-lg font-medium hover:bg-accent-hover transition-colors"
          >
            Create your free account <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-ink-tertiary mt-4">
            Or{" "}
            <Link href="/login" className="text-accent hover:underline">
              sign in with demo@readrviz.dev / password123
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
