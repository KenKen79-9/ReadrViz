"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { daysAgo } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface DiscussionUser {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
}

interface DiscussionData {
  id: string;
  content: string;
  milestone: string | null;
  createdAt: Date | string;
  userId: string;
  user: DiscussionUser;
  _count: { likes: number; replies: number };
  replies?: DiscussionData[];
}

interface DiscussionThreadProps {
  discussions: DiscussionData[];
  readingId: string;
  clubId: string;
  isMember: boolean;
  currentUserId?: string;
}

function Avatar({ user }: { user: DiscussionUser }) {
  return (
    <div className="w-7 h-7 rounded-full overflow-hidden bg-accent-light flex items-center justify-center text-xs font-bold text-accent shrink-0">
      {user.image ? (
        <Image src={user.image} alt={user.name ?? ""} width={28} height={28} className="object-cover" />
      ) : (
        (user.name ?? user.username)[0].toUpperCase()
      )}
    </div>
  );
}

function DiscussionItem({ discussion, clubId, readingId, isMember, currentUserId, depth = 0 }: {
  discussion: DiscussionData;
  clubId: string;
  readingId: string;
  isMember: boolean;
  currentUserId?: string;
  depth?: number;
}) {
  const router = useRouter();
  const [replying, setReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitReply() {
    if (!replyContent.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readingId, content: replyContent, parentId: discussion.id }),
      });
      if (!res.ok) throw new Error();
      setReplyContent("");
      setReplying(false);
      router.refresh();
    } catch {
      toast({ title: "Error posting reply", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={depth > 0 ? "ml-8 border-l-2 border-border pl-4" : ""}>
      <div className="flex gap-3 mb-3">
        <Avatar user={discussion.user} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Link href={`/profile/${discussion.user.username}`} className="text-sm font-medium text-ink hover:text-accent">
              {discussion.user.name}
            </Link>
            {discussion.milestone && (
              <span className="pill bg-accent-light text-accent text-2xs">{discussion.milestone}</span>
            )}
            <span className="text-xs text-ink-tertiary">{daysAgo(new Date(discussion.createdAt))}</span>
          </div>
          <p className="text-sm text-ink-secondary leading-relaxed">{discussion.content}</p>
          <div className="flex items-center gap-3 mt-2">
            <button className="flex items-center gap-1 text-xs text-ink-tertiary hover:text-danger transition-colors">
              <Heart className="w-3.5 h-3.5" />
              {discussion._count.likes}
            </button>
            {isMember && depth < 2 && (
              <button
                onClick={() => setReplying(!replying)}
                className="flex items-center gap-1 text-xs text-ink-tertiary hover:text-accent transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Reply
              </button>
            )}
          </div>
        </div>
      </div>

      {replying && (
        <div className="ml-10 mb-4">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={2}
            placeholder="Write a reply…"
            className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          />
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={submitReply} disabled={loading || !replyContent.trim()}>
              {loading ? "Posting…" : "Reply"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setReplying(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {discussion.replies?.map((reply) => (
        <DiscussionItem
          key={reply.id}
          discussion={reply}
          clubId={clubId}
          readingId={readingId}
          isMember={isMember}
          currentUserId={currentUserId}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

export function DiscussionThread({ discussions, readingId, clubId, isMember, currentUserId }: DiscussionThreadProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [milestone, setMilestone] = useState("general");
  const [loading, setLoading] = useState(false);

  async function submitPost() {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readingId, content, milestone }),
      });
      if (!res.ok) throw new Error();
      setContent("");
      router.refresh();
    } catch {
      toast({ title: "Error posting discussion", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Compose */}
      {isMember && (
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <label className="text-xs text-ink-secondary font-medium">Post in:</label>
            <select
              value={milestone}
              onChange={(e) => setMilestone(e.target.value)}
              className="text-xs border border-border rounded-md px-2 py-1 bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="general">General</option>
              <option value="chapters-1-5">Chapters 1–5</option>
              <option value="chapters-6-10">Chapters 6–10</option>
              <option value="halfway">Halfway point</option>
              <option value="finished">Finished!</option>
            </select>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="Share your thoughts on the reading…"
            className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          />
          <div className="flex justify-end mt-2">
            <Button size="sm" onClick={submitPost} disabled={loading || !content.trim()}>
              {loading ? "Posting…" : "Post"}
            </Button>
          </div>
        </div>
      )}

      {/* Thread */}
      {discussions.length === 0 ? (
        <div className="text-center py-12 text-ink-secondary">
          <MessageCircle className="w-8 h-8 mx-auto mb-3 text-border" />
          <p className="text-sm">No discussions yet. Start the conversation!</p>
        </div>
      ) : (
        <div className="space-y-5 bg-surface border border-border rounded-lg p-5">
          {discussions.map((d) => (
            <DiscussionItem
              key={d.id}
              discussion={d}
              clubId={clubId}
              readingId={readingId}
              isMember={isMember}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
