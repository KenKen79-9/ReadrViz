"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserCheck, UserPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function FollowButton({ username, initialFollowing }: { username: string; initialFollowing: boolean }) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${username}/follow`, { method: "POST" });
      const json = await res.json();
      setFollowing(json.following);
      toast({ title: json.following ? `Following ${username}` : `Unfollowed ${username}` });
      router.refresh();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={toggle}
      disabled={loading}
      variant={following ? "outline" : "default"}
      size="sm"
      className="gap-1.5"
    >
      {following ? (
        <><UserCheck className="w-3.5 h-3.5" />{loading ? "…" : "Following"}</>
      ) : (
        <><UserPlus className="w-3.5 h-3.5" />{loading ? "…" : "Follow"}</>
      )}
    </Button>
  );
}
