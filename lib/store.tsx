"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type {
  Activity,
  ActivityRules,
  ChatLevel,
  Match,
  State,
  User,
} from "./types";
import { PERSONAS, USER_BY_ID, VIEWER } from "./data/users";
import { GENERATED_BOARD, GENERATED_JOINS } from "./data/board";
import { SEED_AUTHOR_REVIEWS, SEED_POSTS } from "./data/posts";
import { composeMatch, rankCandidates } from "./engine";
import { LEGACY_KEYS, STORAGE_KEY, readStoredState } from "./storage";

export type ResolvedMatch = {
  activity: Activity;
  candidate: User;
  ranked: Match[];
  index: number;
};

export type Store = {
  state: State;
  hydrate: boolean;
  update: (patch: Partial<State> | ((current: State) => Partial<State>)) => void;
  login: (accountId: string) => void;
  logout: () => void;
  viewer: User;
  match: (activityId: string, candidateId: string) => ResolvedMatch | null;
};

const seedRules = (): ActivityRules => ({
  chatLevel: { value: "chatty", required: false },
  mbti: { mode: "any", types: [], required: false },
  interest: { id: "film", required: true },
  mode: { value: "one_on_one", required: false },
  radius: { value: "km10", hardFilter: false },
  gender: { value: "any", hardFilter: false },
});

const baseRules = (chat: ChatLevel): ActivityRules => ({
  chatLevel: { value: chat, required: false },
  mbti: { mode: "any", types: [], required: false },
  interest: { id: null, required: false },
  mode: { value: "any", required: false },
  radius: { value: "km10", hardFilter: false },
  gender: { value: "any", hardFilter: false },
});

const SEED_BOARD: Activity[] = [
  {
    id: "a-nadia-tebet",
    creatorId: VIEWER.id,
    category: "movie",
    description: "Sabtu sore mau nonton di Tebet, budget 100 ribuan. Pengen teman yang asik diajak ngobrol setelah film.",
    startsAt: "2026-10-31T16:30:00+07:00",
    areaId: "tebet",
    venueName: null,
    budgetMin: 60000,
    budgetMax: 100000,
    partySize: 2,
    source: "free_text",
    status: "open",
    rules: seedRules(),
  },
  {
    id: "a-sekar-coffee",
    creatorId: "u-sekar",
    category: "coffee",
    description: "Ngopi sore di Tebet, cari yang bisa diajak ngobrol soal film yang lagi tayang.",
    startsAt: "2026-10-30T17:00:00+07:00",
    areaId: "tebet",
    venueName: null,
    budgetMin: 40000,
    budgetMax: 80000,
    partySize: 2,
    source: "form",
    status: "open",
    rules: { ...baseRules("chatty"), interest: { id: "coffee", required: true } },
  },
  {
    id: "a-lia-study",
    creatorId: "u-lia",
    category: "study",
    description: "Belajar bareng di perpustakaan, target dua jam tanpa distraksi.",
    startsAt: "2026-10-31T10:00:00+07:00",
    areaId: "kemanggisan",
    venueName: null,
    budgetMin: 30000,
    budgetMax: 60000,
    partySize: 4,
    source: "form",
    status: "open",
    rules: { ...baseRules("quiet"), mode: { value: "small_group", required: true } },
  },
  {
    id: "a-hanif-music",
    creatorId: "u-hanif",
    category: "music",
    description: "Gig kecil di Bintaro, ada satu tiket lebih buat yang mau ikut.",
    startsAt: "2026-11-01T19:00:00+07:00",
    areaId: "bintaro",
    venueName: null,
    budgetMin: 80000,
    budgetMax: 150000,
    partySize: 2,
    source: "form",
    status: "open",
    rules: baseRules("moderate"),
  },
  {
    id: "a-dewi-art",
    creatorId: "u-dewi",
    category: "shopping",
    description: "Keliling museum Minggu pagi, lanjut ngopi kalau masih sempat.",
    startsAt: "2026-11-01T09:00:00+07:00",
    areaId: "ciputat",
    venueName: null,
    budgetMin: 40000,
    budgetMax: 90000,
    partySize: 4,
    source: "form",
    status: "open",
    rules: { ...baseRules("quiet"), mode: { value: "small_group", required: false } },
  },
  {
    id: "a-dimas-sports",
    creatorId: "u-dim",
    category: "sports",
    description: "Lari pagi keliling Situ Lembang, pace santai buat pemula.",
    startsAt: "2026-11-02T06:00:00+07:00",
    areaId: "menteng",
    venueName: null,
    budgetMin: 0,
    budgetMax: 30000,
    partySize: 2,
    source: "form",
    status: "open",
    rules: baseRules("moderate"),
  },
    {
      id: "a-rani-sore",
      creatorId: "u-rani",
      category: "sports",
      description: "Lari sore keliling Kemang, pace santai, tutup dengan kopi.",
      startsAt: "2026-10-31T15:00:00+07:00",
      durationMin: 180,
      areaId: "kemang",
      venueName: null,
      budgetMin: 20000,
      budgetMax: 50000,
      partySize: 4,
      source: "form",
      status: "open",
      rules: { ...baseRules("moderate"), mode: { value: "small_group", required: false } },
    },
    {
      id: "a-hanif-gig",
      creatorId: "u-hanif",
      category: "music",
      description: "Nonton gig bareng di Kelapa Gading, grup terbuka buat siapa aja yang gas.",
      startsAt: "2026-11-01T19:00:00+07:00",
      durationMin: 180,
      areaId: "kelapa-gading",
      venueName: null,
      budgetMin: 100000,
      budgetMax: 200000,
      partySize: 6,
      openGroup: true,
      source: "form",
      status: "open",
      rules: { ...baseRules("chatty"), mode: { value: "small_group", required: false } },
    },
    {
      id: "a-reza-futsal",
      creatorId: "u-reza",
      category: "sports",
      description: "Sparing futsal di Bekasi Barat, butuh dua orang lagi.",
      startsAt: "2026-11-02T20:00:00+07:00",
      durationMin: 120,
      areaId: "bekasi-barat",
      venueName: null,
      budgetMin: 30000,
      budgetMax: 60000,
      partySize: 4,
      source: "form",
      status: "open",
      rules: { ...baseRules("moderate"), mode: { value: "small_group", required: false } },
    },
    {
      id: "a-tari-sketch",
      creatorId: "u-tari",
      category: "other",
      description: "Sketsa bareng di Taman Menteng, alat bawa sendiri.",
      startsAt: "2026-11-02T09:00:00+07:00",
      durationMin: 120,
      areaId: "menteng",
      venueName: null,
      budgetMin: 0,
      budgetMax: 30000,
      partySize: 2,
      source: "form",
      status: "open",
      rules: { ...baseRules("quiet"), mode: { value: "one_on_one", required: false } },
    }
];

const SEED_JOINS: Record<string, string[]> = {
  "a-nadia-tebet": ["u-arif"],
  "a-sekar-coffee": ["u-rani", "u-nadia"],
  "a-lia-study": ["u-putri", "u-nadia"],
  "a-hanif-music": ["u-eko"],
  "a-rani-sore": ["u-sekar", "u-eko", "u-bagas", "u-dim"],
  "a-hanif-gig": ["u-eko", "u-arif", "u-bagas"],
  "a-reza-futsal": ["u-eko"],
  ...GENERATED_JOINS,
};

// ponytail: demo anchor keeps every timing state (ongoing/upcoming/finished) alive; whole seed slides with wall clock.
const SEED_ANCHOR = Date.parse("2026-10-31T12:00:00+07:00");
const SEED_OFFSET = Date.now() - SEED_ANCHOR;
const shiftSeed = (iso: string) => new Date(Date.parse(iso) + SEED_OFFSET).toISOString();
const INITIAL: State = {
  viewerId: null,
  locale: "en",
  mode: "system",
  verification: "unverified",
  profile: {
    aboutMe: "",
    name: VIEWER.name,
    gender: VIEWER.gender,
    birthDate: VIEWER.birthDate,
    areaId: VIEWER.areaId,
    mbti: VIEWER.mbti,
    interests: VIEWER.interests,
    energyProfile: VIEWER.energyProfile,
  },
  // ponytail: seeds carry no real posted timestamps; stagger createdAt over ~11 days so Newest sort and ages look alive.
  activities: [...SEED_BOARD, ...GENERATED_BOARD].map((activity, index, list) => ({
...activity,
startsAt: shiftSeed(activity.startsAt),
createdAt: activity.createdAt ?? new Date(Date.now() - (list.length - 1 - index) * 100 * 60e3).toISOString(),
  })),
  savedRules: null,
  selected: {},
  joins: SEED_JOINS,
  approved: { "a-sekar-coffee": ["u-rani"], "a-lia-study": ["u-putri"], "a-rani-sore": ["u-sekar", "u-eko"], "a-hanif-gig": ["u-eko", "u-arif", "u-bagas"] },
  confirms: { "a-sekar-coffee": ["u-rani"] },
  removed: { "a-rani-sore": ["u-dim"] },
  blocked: {},
  reported: {},
  hiddenPlans: {},
  messages: [],
  meetups: [],
  checkins: [],
  reviews: [],
  planShared: {},
  posts: SEED_POSTS.map((post) => ({ ...post, createdAt: shiftSeed(post.createdAt) })),
  following: ["u-sekar", "u-arif", "u-lia", "u-rani", "u-hanif"],
  authorReviews: SEED_AUTHOR_REVIEWS,
};

export type Session = {
  hydrate: boolean;
  update: Store["update"];
  login: Store["login"];
  logout: Store["logout"];
  viewer: User;
};

type Board = {
  state: State;
  match: Store["match"];
};

// Split contexts: board state changes on every post/join/message, while the
// session (viewer + actions) stays stable, so action-only components skip renders.
const StateCtx = createContext<Board | null>(null);
const SessionCtx = createContext<Session | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(INITIAL);
  const [hydrate, setHydrate] = useState(false);

  // Stored state can only be read after mount: server markup renders INITIAL, so a
  // lazy initializer would hydrate mismatched text.
  useEffect(() => {
    const stored = readStoredState((key) => window.localStorage.getItem(key));
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
      setState((current) => ({ ...current, ...stored }));
      for (const key of LEGACY_KEYS) window.localStorage.removeItem(key);
    } else if (window.localStorage.getItem(STORAGE_KEY)) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setHydrate(true);
  }, []);

  useEffect(() => {
    if (!hydrate) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const root = document.documentElement;
    if (state.mode === "system") delete root.dataset.mode;
    else root.dataset.mode = state.mode;
    root.lang = state.locale;
  }, [state, hydrate]);

  const update = useCallback((patch: Partial<State> | ((current: State) => Partial<State>)) => {
    setState((current) => ({ ...current, ...(typeof patch === "function" ? patch(current) : patch) }));
}, []);
  const account = (state.viewerId ? USER_BY_ID.get(state.viewerId) : null) ?? VIEWER;
  const viewer = useMemo<User>(
    () => ({
      ...account,
      name: account.id === VIEWER.id ? state.profile.name : account.name,
      gender: account.id === VIEWER.id ? state.profile.gender : account.gender,
      birthDate: account.id === VIEWER.id ? state.profile.birthDate : account.birthDate,
      areaId: account.id === VIEWER.id ? state.profile.areaId : account.areaId,
      mbti: account.id === VIEWER.id ? state.profile.mbti : account.mbti,
      interests: account.id === VIEWER.id ? state.profile.interests : account.interests,
      energyProfile: account.id === VIEWER.id ? state.profile.energyProfile : account.energyProfile,
      verification: state.verification,
    }),
    [account, state.profile, state.verification],
  );

    const login = useCallback((accountId: string) => {
    const account = USER_BY_ID.get(accountId) ?? VIEWER;
    setState((current) => ({
      ...current,
      viewerId: account.id,
      verification: account.verification,
      profile: {
        aboutMe: current.profile.aboutMe,
        name: account.name,
        gender: account.gender,
        birthDate: account.birthDate,
        areaId: account.areaId,
        mbti: account.mbti,
        interests: account.interests,
        energyProfile: account.energyProfile,
      },
    }));
  }, []);

  const logout = useCallback(() => {
    setState((current) => ({ ...current, viewerId: null }));
  }, []);

const match = useCallback(
    (activityId: string, candidateId: string): ResolvedMatch | null => {
      const activity = state.activities.find((item) => item.id === activityId);
      const candidate = USER_BY_ID.get(candidateId) ?? PERSONAS.find((item) => item.id === candidateId);
      if (!activity || !candidate) return null;
      const ranked = rankCandidates(activity, PERSONAS.filter((p) => p.id !== activity.creatorId), viewer);
      let index = ranked.findIndex((item) => item.candidateId === candidateId);
      if (index < 0 && candidate.id === activity.creatorId) {
        // Poster row: you are meeting the host, so score the host against yourself.
        ranked.unshift(composeMatch(activity, viewer, candidate));
        index = 0;
      }
      return { activity, candidate, ranked, index };
    },
    [state.activities, viewer],
  );

  const board = useMemo<Board>(() => ({ state, match }), [state, match]);
  const session = useMemo<Session>(() => ({ hydrate, update, login, logout, viewer }), [hydrate, update, login, logout, viewer]);

  return (
    <StateCtx.Provider value={board}>
      <SessionCtx.Provider value={session}>{children}</SessionCtx.Provider>
    </StateCtx.Provider>
  );
}

function useBoard(): Board {
  const board = useContext(StateCtx);
  if (!board) throw new Error("useStore must be used inside StoreProvider");
  return board;
}

export function useSession(): Session {
  const session = useContext(SessionCtx);
  if (!session) throw new Error("useSession must be used inside StoreProvider");
  return session;
}

export function useStore(): Store {
  const { state, match } = useBoard();
  const { hydrate, update, login, logout, viewer } = useSession();
  return { state, hydrate, update, login, logout, viewer, match };
}
