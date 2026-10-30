import type { Activity, AuthorReview, Photo, Post, Song } from "./types.ts";

export function visiblePosts(posts: Post[], viewerId: string, joins: Record<string, string[]>): Post[] {
  return posts.filter((post) => {
    if (post.visibility === "public") return true;
    if (post.authorId === viewerId) return true;
    if (!post.activityId) return false;
    return (joins[post.activityId] ?? []).includes(viewerId);
  });
}

export function suggestSongs(photo: Photo | null, songs: Song[]): Song[] {
  if (!photo) return [...songs];
  const score = (song: Song) => song.moods.filter((mood) => photo.moods.includes(mood)).length;
  return [...songs].sort((a, b) => score(b) - score(a));
}

export function authorAggregate(
  reviews: AuthorReview[],
  authorId: string,
): { average: number; count: number } | null {
  const mine = reviews.filter((review) => review.authorId === authorId);
  if (mine.length === 0) return null;
  const sum = mine.reduce((total, review) => total + review.rating, 0);
  return { average: Math.round((sum / mine.length) * 10) / 10, count: mine.length };
}

export type TrendingFacts = { joins: number; daysAgo: number; authorAvg: number | null };

export function trendingScores(
  activities: Activity[],
  joins: Record<string, string[]>,
  reviews: AuthorReview[],
  now: number = Date.now(),
): { activityId: string; score: number; facts: TrendingFacts }[] {
  return activities
    .map((activity) => {
      const joinCount = joins[activity.id]?.length ?? 0;
      const created = activity.createdAt ? Date.parse(activity.createdAt) : Date.parse(activity.startsAt);
      const daysAgo = Number.isNaN(created) ? 30 : Math.max(0, (now - created) / 86_400_000);
      const aggregate = authorAggregate(reviews, activity.creatorId);
      const score = joinCount * 10 + Math.max(0, 14 - daysAgo) + (aggregate ? aggregate.average * 2 : 0);
      return { activityId: activity.id, score, facts: { joins: joinCount, daysAgo: Math.round(daysAgo), authorAvg: aggregate?.average ?? null } };
    })
    .sort((a, b) => b.score - a.score);
}
