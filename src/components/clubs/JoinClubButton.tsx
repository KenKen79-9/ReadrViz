"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Users, UserCheck } from "lucide-react";

interface JoinClubButtonProps {
  clubId: string;
  userRole: string | null;
}

export function JoinClubButton({ clubId, userRole }: JoinClubButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!session) {
    return (
      <a href="/login" className="inline-flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-accent-hover transition-colors">
        <Users className="w-4 h-4" />
        Join to participate
      </a>
    );
  }

  if (userRole === "OWNER") return null;

  async function handleAction() {
    setLoading(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: userRole ? "leave" : "join" }),
      });
      if (!res.ok) throw new Error();
      toast({ title: userRole ? "Left club" : "Joined club!" });
      router.refresh();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleAction}
      disabled={loading}
      variant={userRole ? "outline" : "default"}
      className="gap-1.5 shrink-0"
    >
      {userRole ? (
        <>
          <UserCheck className="w-4 h-4" />
          {loading ? "Leaving…" : "Leave club"}
        </>
      ) : (
        <>
          <Users className="w-4 h-4" />
          {loading ? "Joining…" : "Join club"}
        </>
      )}
    </Button>
  );
}
