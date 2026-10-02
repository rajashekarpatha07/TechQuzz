export type Team = "js" | "python";
export type Phase =
  | "lobby"
  | "tap"
  | "tap_results"
  | "hot"
  | "hot_reveal"
  | "quiz"
  | "quiz_reveal"
  | "podium";

export type PublicPlayer = {
  id: string;
  name: string;
  team: Team;
  score: number;
  taps: number;
  connected: boolean;
};

export type RoomState = {
  code: string;
  phase: Phase;
  endsAt: number | null;
  players: PublicPlayer[];
  teamScores: { js: number; python: number };
  isHost?: boolean;
  you?: {
    id: string;
    name: string;
    team: Team;
    voted: boolean;
    answered: boolean;
    vote?: "agree" | "disagree";
    answerIndex?: number;
  };
  hot?: {
    index: number;
    total: number;
    text: string;
    roastAgree?: string;
    roastDisagree?: string;
    votes?: {
      js: { agree: number; disagree: number };
      python: { agree: number; disagree: number };
    };
  };
  quiz?: {
    index: number;
    total: number;
    question: string;
    options: string[];
    extra: string;
    correct?: number;
    counts?: number[];
  };
  podium?: {
    top3: PublicPlayer[];
    winningTeam: Team | "tie";
  };
};

export const TEAM_LABEL: Record<Team, string> = {
  js: "JavaScript",
  python: "Python",
};

export const TAP_MS = 10_000;
export const HOT_MS = 15_000;
export const QUIZ_MS = 15_000;
export const HOT_COUNT = 5;
export const QUIZ_COUNT = 8;
