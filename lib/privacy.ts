import type { Activity, Meetup, User, VerificationStatus } from "./types";

export type VisibleActivity = {
  id: string;
  description: string;
  category: Activity["category"];
  sealed: boolean;
  creatorId: string | null;
  areaId: string | null;
  startsAt: string | null;
};

/**
 * The privacy boundary lives here, not in the components: unverified viewers
 * receive the description only, so a UI bug cannot leak a name, area or time.
 */
export function visibleActivityFor(activity: Activity, viewerVerification: VerificationStatus): VisibleActivity {
  const sealed = viewerVerification !== "verified";
  return {
    id: activity.id,
    description: activity.description,
    category: activity.category,
    sealed,
    creatorId: sealed ? null : activity.creatorId,
    areaId: sealed ? null : activity.areaId,
    startsAt: sealed ? null : activity.startsAt,
  };
}

export function exactVenueVisible(meetup: Meetup | undefined): boolean {
  return Boolean(meetup?.confirmedByCreatorAt && meetup.confirmedByCandidateAt);
}

export function canMatch(user: User): boolean {
  return user.verification === "verified";
}

export function canReceiveContact(user: User, meetup: Meetup | undefined): boolean {
  return canMatch(user) && exactVenueVisible(meetup);
}
