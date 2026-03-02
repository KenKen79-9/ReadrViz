import { EventType } from "@prisma/client";
import { db } from "@/lib/db";

interface TrackEventParams {
  userId: string;
  type: EventType;
  bookId?: string;
  properties?: Record<string, unknown>;
}

export async function trackEvent({ userId, type, bookId, properties = {} }: TrackEventParams) {
  return db.event.create({
    data: { userId, type, bookId, properties },
  });
}

/** Called by API routes — fire and forget, no await needed in most cases */
export function trackEventBackground(params: TrackEventParams) {
  trackEvent(params).catch((err) => {
    console.error("[events] Failed to track event:", err);
  });
}
