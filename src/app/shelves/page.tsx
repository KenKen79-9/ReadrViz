import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BookOpen, Calendar, DollarSign } from "lucide-react";
import { formatPercent, daysAgo } from "@/lib/utils";

export const metadata = { title: "My Shelves" };

export default async function ShelvesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const shelves = await db.shelf.findMany({
    where: { userId: session.user.id },
    include: {
      books: {
        include: { book: true },
        orderBy: { updatedAt: "desc" },
      },
      _count: { select: { books: true } },
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  const defaultShelves = shelves.filter((s) => s.isDefault);
  const customShelves = shelves.filter((s) => !s.isDefault);

  const totalBooks = shelves.reduce((s, sh) => s + sh._count.books, 0);
  const readShelf = shelves.find((s) => s.type === "READ");
  const currentlyReading = shelves.find((s) => s.type === "CURRENTLY_READING");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1>My Shelves</h1>
          <p>{totalBooks} books tracked · {readShelf?._count.books ?? 0} read this year</p>
        </div>
      </div>

      {/* Currently reading — prominent */}
      {(currentlyReading?.books.length ?? 0) > 0 && (
        <div className="mb-8">
          <h2 className="font-serif font-semibold text-ink mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent" />
            Currently Reading
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentlyReading!.books.map((sb) => (
              <div key={sb.id} className="bg-surface border border-border rounded-lg p-4 shadow-card">
                <div className="flex gap-3 mb-4">
                  <Link href={`/books/${sb.bookId}`} className="shrink-0">
                    <div className="w-12 h-16 rounded overflow-hidden bg-border-subtle shadow-card">
                      {sb.book.coverUrl ? (
                        <Image src={sb.book.coverUrl} alt={sb.book.title} width={48} height={64} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-accent-light">
                          <BookOpen className="w-4 h-4 text-accent" />
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/books/${sb.bookId}`} className="font-medium text-sm text-ink hover:text-accent line-clamp-2">
                      {sb.book.title}
                    </Link>
                    <p className="text-xs text-ink-secondary mt-0.5">{sb.book.author}</p>
                    {sb.startDate && (
                      <p className="text-xs text-ink-tertiary mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Started {daysAgo(new Date(sb.startDate))}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-ink-secondary">Progress</span>
                    <span className="text-xs font-medium text-ink">{sb.progress}%</span>
                  </div>
                  <Progress value={sb.progress} />
                  {sb.pagesRead !== null && sb.book.pageCount && (
                    <p className="text-xs text-ink-tertiary mt-1">
                      {sb.pagesRead.toLocaleString()} / {sb.book.pageCount.toLocaleString()} pages
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All shelves tabs */}
      <Tabs defaultValue={defaultShelves[2]?.id ?? defaultShelves[0]?.id}>
        <TabsList className="flex-wrap h-auto gap-1 mb-6">
          {defaultShelves.map((shelf) => (
            <TabsTrigger key={shelf.id} value={shelf.id}>
              {shelf.name}
              <span className="ml-1.5 text-ink-tertiary text-2xs">({shelf._count.books})</span>
            </TabsTrigger>
          ))}
          {customShelves.map((shelf) => (
            <TabsTrigger key={shelf.id} value={shelf.id}>
              {shelf.name}
              <span className="ml-1.5 text-ink-tertiary text-2xs">({shelf._count.books})</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {shelves.map((shelf) => (
          <TabsContent key={shelf.id} value={shelf.id}>
            {shelf.books.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">📚</div>
                <p className="text-sm text-ink-secondary">No books on this shelf yet.</p>
                <Link href="/books" className="text-sm text-accent hover:underline mt-2 inline-block">
                  Browse books to add →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {shelf.books.map((sb) => (
                  <div key={sb.id} className="bg-surface border border-border rounded-lg p-4 flex items-center gap-4 hover:shadow-card-hover transition-shadow">
                    <Link href={`/books/${sb.bookId}`} className="shrink-0">
                      <div className="w-10 h-14 rounded overflow-hidden bg-border-subtle shadow-sm">
                        {sb.book.coverUrl ? (
                          <Image src={sb.book.coverUrl} alt={sb.book.title} width={40} height={56} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full bg-accent-light flex items-center justify-center">
                            <BookOpen className="w-3 h-3 text-accent" />
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link href={`/books/${sb.bookId}`} className="font-medium text-sm text-ink hover:text-accent">
                        {sb.book.title}
                      </Link>
                      <p className="text-xs text-ink-secondary">{sb.book.author}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-ink-tertiary flex-wrap">
                        <span className="capitalize">{sb.format.toLowerCase()}</span>
                        <span className="capitalize">{sb.ownership.toLowerCase()}</span>
                        {sb.startDate && <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />{new Date(sb.startDate).toLocaleDateString()}</span>}
                        {sb.finishDate && <span>→ {new Date(sb.finishDate).toLocaleDateString()}</span>}
                        {sb.costPaid != null && <span className="flex items-center gap-0.5"><DollarSign className="w-3 h-3" />{sb.costPaid.toFixed(2)}</span>}
                      </div>
                    </div>

                    {shelf.type === "CURRENTLY_READING" && (
                      <div className="w-24 text-right shrink-0">
                        <div className="text-xs text-ink-secondary mb-1">{sb.progress}%</div>
                        <Progress value={sb.progress} className="h-1.5" />
                      </div>
                    )}

                    {shelf.type === "READ" && sb.startDate && sb.finishDate && (
                      <div className="text-right shrink-0">
                        <div className="text-xs font-medium text-ink">
                          {Math.ceil((new Date(sb.finishDate).getTime() - new Date(sb.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                        </div>
                        <div className="text-2xs text-ink-tertiary">to finish</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
