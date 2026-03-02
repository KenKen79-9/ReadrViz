import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Users, BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateClubButton } from "@/components/clubs/CreateClubButton";

export const metadata = { title: "Book Clubs" };

async function ClubGrid({ userId }: { userId?: string }) {
  const clubs = await db.bookClub.findMany({
    where: { isPrivate: false },
    include: {
      owner: { select: { id: true, name: true, username: true, image: true } },
      _count: { select: { members: true, readings: true } },
      readings: {
        where: { isActive: true },
        include: { book: { select: { id: true, title: true, coverUrl: true } } },
        take: 1,
      },
      members: userId ? { where: { userId }, take: 1 } : false,
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  if (clubs.length === 0) {
    return (
      <div className="text-center py-20">
        <Users className="w-12 h-12 mx-auto mb-4 text-border" />
        <h3 className="font-serif text-lg font-semibold text-ink mb-2">No clubs yet</h3>
        <p className="text-sm text-ink-secondary">Be the first to create a book club!</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {clubs.map((club) => {
        const activeReading = club.readings[0];
        const isMember = userId && (club.members as Array<{ userId: string }>).length > 0;

        return (
          <Link
            key={club.id}
            href={`/clubs/${club.id}`}
            className="bg-surface border border-border rounded-lg p-5 shadow-card hover:shadow-card-hover transition-shadow flex flex-col gap-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-serif font-semibold text-ink truncate">{club.name}</h3>
                  {isMember && <Badge variant="accent">Member</Badge>}
                </div>
                {club.description && (
                  <p className="text-sm text-ink-secondary line-clamp-2">{club.description}</p>
                )}
              </div>
            </div>

            {/* Active reading */}
            {activeReading && (
              <div className="flex items-center gap-3 bg-accent-light/50 rounded-md p-3">
                <div className="w-8 h-11 rounded overflow-hidden shrink-0 shadow-sm bg-border-subtle">
                  {activeReading.book.coverUrl && (
                    <Image src={activeReading.book.coverUrl} alt={activeReading.book.title} width={32} height={44} className="object-cover w-full h-full" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-2xs text-accent font-medium uppercase tracking-wide">Currently reading</div>
                  <div className="text-sm font-medium text-ink truncate">{activeReading.book.title}</div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
              <div className="flex items-center gap-1.5 text-sm text-ink-secondary">
                <Users className="w-4 h-4" />
                {club._count.members} members
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full overflow-hidden bg-border-subtle">
                  {club.owner.image ? (
                    <Image src={club.owner.image} alt="" width={20} height={20} className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-accent-light flex items-center justify-center text-2xs font-bold text-accent">
                      {(club.owner.name ?? "?")[0]}
                    </div>
                  )}
                </div>
                <span className="text-xs text-ink-tertiary">by {club.owner.name}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default async function ClubsPage() {
  const session = await auth();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1>Book Clubs</h1>
          <p>Read together. Discuss together. Grow together.</p>
        </div>
        {session && <CreateClubButton />}
      </div>

      <Suspense fallback={
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-lg p-5 h-40 animate-pulse" />
          ))}
        </div>
      }>
        <ClubGrid userId={session?.user.id} />
      </Suspense>
    </div>
  );
}
