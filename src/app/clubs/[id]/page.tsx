import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Users, BookOpen, MessageCircle, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { JoinClubButton } from "@/components/clubs/JoinClubButton";
import { DiscussionThread } from "@/components/clubs/DiscussionThread";
import { daysAgo } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const club = await db.bookClub.findUnique({ where: { id }, select: { name: true } });
  return { title: club?.name ?? "Book Club" };
}

export default async function ClubPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  const club = await db.bookClub.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, username: true, image: true } },
      members: {
        include: { user: { select: { id: true, name: true, username: true, image: true } } },
        orderBy: { joinedAt: "asc" },
        take: 12,
      },
      readings: {
        include: {
          book: true,
          discussions: {
            where: { parentId: null },
            include: {
              user: { select: { id: true, name: true, username: true, image: true } },
              _count: { select: { likes: true, replies: true } },
              replies: {
                include: {
                  user: { select: { id: true, name: true, username: true, image: true } },
                  _count: { select: { likes: true, replies: true } },
                },
                orderBy: { createdAt: "asc" },
                take: 5,
              },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      },
      _count: { select: { members: true, readings: true } },
    },
  });

  if (!club) notFound();

  const membership = session?.user.id
    ? await db.clubMember.findUnique({
        where: { clubId_userId: { clubId: id, userId: session.user.id } },
      })
    : null;

  const userRole = membership?.role ?? null;
  const activeReading = club.readings.find((r) => r.isActive);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Club header */}
      <div className="flex flex-col sm:flex-row gap-5 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="font-serif text-2xl font-bold text-ink">{club.name}</h1>
            {userRole && <Badge variant="accent" className="capitalize">{userRole.toLowerCase()}</Badge>}
          </div>
          {club.description && (
            <p className="text-ink-secondary text-sm mb-3">{club.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-ink-secondary">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {club._count.members} members
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              {club._count.readings} readings
            </span>
            <Link href={`/profile/${club.owner.username}`} className="hover:text-accent transition-colors">
              by {club.owner.name}
            </Link>
          </div>
        </div>

        <JoinClubButton clubId={id} userRole={userRole} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main: active reading + discussions */}
        <div className="lg:col-span-2 space-y-6">
          {activeReading ? (
            <div>
              {/* Active reading banner */}
              <div className="bg-surface border border-border rounded-lg p-5 shadow-card mb-5">
                <div className="text-xs font-medium text-accent uppercase tracking-wide mb-3">Currently reading</div>
                <div className="flex gap-4">
                  <Link href={`/books/${activeReading.bookId}`} className="shrink-0">
                    <div className="w-16 h-22 rounded-md overflow-hidden shadow-card bg-border-subtle">
                      {activeReading.book.coverUrl && (
                        <Image src={activeReading.book.coverUrl} alt={activeReading.book.title} width={64} height={88} className="object-cover w-full h-full" />
                      )}
                    </div>
                  </Link>
                  <div>
                    <Link href={`/books/${activeReading.bookId}`} className="font-serif font-semibold text-ink hover:text-accent">
                      {activeReading.book.title}
                    </Link>
                    <p className="text-sm text-ink-secondary">{activeReading.book.author}</p>
                    {activeReading.startDate && (
                      <p className="text-xs text-ink-tertiary mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Started {daysAgo(new Date(activeReading.startDate))}
                        {activeReading.endDate && (
                          <> · ends {new Date(activeReading.endDate).toLocaleDateString()}</>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Discussions */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif font-semibold text-ink flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-accent" />
                    Discussion ({activeReading.discussions.length})
                  </h2>
                </div>

                <DiscussionThread
                  discussions={activeReading.discussions}
                  readingId={activeReading.id}
                  clubId={id}
                  isMember={!!userRole}
                  currentUserId={session?.user.id}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-surface border border-border rounded-lg">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-border" />
              <p className="text-sm text-ink-secondary">No active reading scheduled yet.</p>
              {(userRole === "OWNER" || userRole === "ADMIN") && (
                <p className="text-xs text-ink-tertiary mt-1">Admins can schedule readings from the club management panel.</p>
              )}
            </div>
          )}

          {/* Past readings */}
          {club.readings.filter((r) => !r.isActive).length > 0 && (
            <div>
              <h2 className="font-serif font-semibold text-ink mb-3">Past readings</h2>
              <div className="space-y-2">
                {club.readings.filter((r) => !r.isActive).slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center gap-3 bg-surface border border-border rounded-lg p-3">
                    <div className="w-8 h-11 rounded overflow-hidden bg-border-subtle shrink-0">
                      {r.book.coverUrl && (
                        <Image src={r.book.coverUrl} alt={r.book.title} width={32} height={44} className="object-cover w-full h-full" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-ink">{r.book.title}</div>
                      <div className="text-xs text-ink-secondary">{r.discussions.length} discussions</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: members */}
        <div>
          <div className="bg-surface border border-border rounded-lg p-5 shadow-card">
            <h3 className="font-serif font-semibold text-ink mb-4">Members ({club._count.members})</h3>
            <div className="space-y-3">
              {club.members.map((m) => (
                <Link key={m.id} href={`/profile/${m.user.username}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-accent-light flex items-center justify-center text-xs font-bold text-accent shrink-0">
                    {m.user.image ? (
                      <Image src={m.user.image} alt="" width={32} height={32} className="object-cover" />
                    ) : (
                      (m.user.name ?? m.user.username)[0].toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{m.user.name}</div>
                    <div className="text-xs text-ink-tertiary">@{m.user.username}</div>
                  </div>
                  {m.role !== "MEMBER" && (
                    <Badge variant="accent" className="ml-auto shrink-0 capitalize text-2xs">
                      {m.role.toLowerCase()}
                    </Badge>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
