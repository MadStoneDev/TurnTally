export interface Game {
  id: string;
  title: string;
  avatar?: string;
  description?: string;
}

export interface PlayerTurn {
  duration: number; // in seconds
  timestamp: number;
}

export interface SessionNote {
  id: string;
  timestamp: number;
  playerId?: string; // optional - can be general session note
  note: string;
}

export interface GameSession {
  sessionId: string;
  gameId: string;
  sessionStart: number;
  sessionEnd?: number;
  playerTurns: PlayerTurn[];
  notes?: SessionNote[];
}

export interface PlayerGameStats {
  gameId: string;
  sessions: GameSession[];
}

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  games: PlayerGameStats[];
}

export interface Session {
  id: string;
  gameId: string;
  playerIds: string[];
  startTime: number;
  endTime?: number;
  currentPlayerIndex: number;
  isActive: boolean;
  isPaused: boolean;
  currentTurnStartTime?: number;
  notes?: SessionNote[];
  turns?: number[][];
}

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  startTime?: number;
  currentTime: number;
}

export interface QuickStartData {
  recentGames: {
    gameId: string;
    lastPlayed: number;
    playCount: number;
  }[];
  recentPlayerCombinations: {
    playerIds: string[];
    lastUsed: number;
    useCount: number;
  }[];
}

export interface TimerWarningLevel {
  level: "fast" | "normal" | "slow" | "very-slow" | "extremely-slow";
  message: string;
  shouldPulse: boolean;
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  playerAvatar?: string;
  value: number;
  rank: number;
  category: string;
}
