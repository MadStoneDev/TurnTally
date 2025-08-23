import { Game, Player, Session, QuickStartData } from "@/types";

const STORAGE_KEYS = {
  GAMES: "turntally_games",
  PLAYERS: "turntally_players",
  SESSIONS: "turntally_sessions",
  CURRENT_SESSION: "turntally_current_session",
  QUICK_START: "turntally_quick_start",
};

// Game storage functions
export const getGames = (): Game[] => {
  if (typeof window === "undefined") return [];
  const games = localStorage.getItem(STORAGE_KEYS.GAMES);
  return games ? JSON.parse(games) : [];
};

export const saveGames = (games: Game[]): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games));
};

export const addGame = (game: Game): void => {
  const games = getGames();
  games.push(game);
  saveGames(games);
};

export const updateGame = (gameId: string, updates: Partial<Game>): void => {
  const games = getGames();
  const index = games.findIndex((g) => g.id === gameId);
  if (index !== -1) {
    games[index] = { ...games[index], ...updates };
    saveGames(games);
  }
};

export const deleteGame = (gameId: string): void => {
  const games = getGames().filter((g) => g.id !== gameId);
  saveGames(games);
};

// Player storage functions
export const getPlayers = (): Player[] => {
  if (typeof window === "undefined") return [];
  const players = localStorage.getItem(STORAGE_KEYS.PLAYERS);
  return players ? JSON.parse(players) : [];
};

export const savePlayers = (players: Player[]): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
};

export const addPlayer = (player: Player): void => {
  const players = getPlayers();
  players.push(player);
  savePlayers(players);
};

export const updatePlayer = (
  playerId: string,
  updates: Partial<Player>,
): void => {
  const players = getPlayers();
  const index = players.findIndex((p) => p.id === playerId);
  if (index !== -1) {
    players[index] = { ...players[index], ...updates };
    savePlayers(players);
  }
};

export const deletePlayer = (playerId: string): void => {
  const players = getPlayers().filter((p) => p.id !== playerId);
  savePlayers(players);
};

// Session storage functions
export const getSessions = (): Session[] => {
  if (typeof window === "undefined") return [];
  const sessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  return sessions ? JSON.parse(sessions) : [];
};

export const saveSessions = (sessions: Session[]): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
};

export const addSession = (session: Session): void => {
  const sessions = getSessions();
  sessions.push(session);
  saveSessions(sessions);
};

export const updateSession = (
  sessionId: string,
  updates: Partial<Session>,
): void => {
  const sessions = getSessions();
  const index = sessions.findIndex((s) => s.id === sessionId);
  if (index !== -1) {
    sessions[index] = { ...sessions[index], ...updates };
    saveSessions(sessions);
  }
};

export const getCurrentSession = (): Session | null => {
  if (typeof window === "undefined") return null;
  const session = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
  return session ? JSON.parse(session) : null;
};

export const setCurrentSession = (session: Session | null): void => {
  if (typeof window === "undefined") return;
  if (session) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
  }
};

// Quick Start data functions
export const getQuickStartData = (): QuickStartData => {
  if (typeof window === "undefined")
    return { recentGames: [], recentPlayerCombinations: [] };
  const data = localStorage.getItem(STORAGE_KEYS.QUICK_START);
  return data
    ? JSON.parse(data)
    : { recentGames: [], recentPlayerCombinations: [] };
};

export const updateQuickStartData = (
  gameId: string,
  playerIds: string[],
): void => {
  if (typeof window === "undefined") return;

  const data = getQuickStartData();
  const now = Date.now();

  // Update recent games
  const gameIndex = data.recentGames.findIndex((g) => g.gameId === gameId);
  if (gameIndex >= 0) {
    data.recentGames[gameIndex].lastPlayed = now;
    data.recentGames[gameIndex].playCount++;
  } else {
    data.recentGames.push({ gameId, lastPlayed: now, playCount: 1 });
  }

  // Keep only top 10 recent games
  data.recentGames.sort((a, b) => b.lastPlayed - a.lastPlayed);
  data.recentGames = data.recentGames.slice(0, 10);

  // Update recent player combinations
  const playerComboKey = playerIds.sort().join(",");
  const comboIndex = data.recentPlayerCombinations.findIndex(
    (combo) => combo.playerIds.sort().join(",") === playerComboKey,
  );

  if (comboIndex >= 0) {
    data.recentPlayerCombinations[comboIndex].lastUsed = now;
    data.recentPlayerCombinations[comboIndex].useCount++;
  } else {
    data.recentPlayerCombinations.push({
      playerIds: [...playerIds],
      lastUsed: now,
      useCount: 1,
    });
  }

  // Keep only top 5 recent combinations
  data.recentPlayerCombinations.sort((a, b) => b.lastUsed - a.lastUsed);
  data.recentPlayerCombinations = data.recentPlayerCombinations.slice(0, 5);

  localStorage.setItem(STORAGE_KEYS.QUICK_START, JSON.stringify(data));
};

// Timer warning calculation utilities
export const calculateTimerWarning = (
  currentTime: number,
  sessionTurns: number[][],
  currentPlayerIndex: number,
): {
  level: "fast" | "normal" | "slow" | "very-slow" | "extremely-slow";
  message: string;
  shouldPulse: boolean;
} => {
  // Get all turn times from current session for comparison
  const allTurns = sessionTurns.flat().filter((time) => time > 0);

  if (allTurns.length < 3) {
    return { level: "normal", message: "", shouldPulse: false };
  }

  // Calculate session average and standard deviation
  const average =
    allTurns.reduce((sum, time) => sum + time, 0) / allTurns.length;
  const variance =
    allTurns.reduce((sum, time) => sum + Math.pow(time - average, 2), 0) /
    allTurns.length;
  const standardDeviation = Math.sqrt(variance);

  // Calculate z-score for current time
  const zScore = (currentTime - average) / standardDeviation;

  // Determine warning level based on z-score
  if (zScore < -1.5) {
    return {
      level: "fast",
      message: "Lightning fast! ⚡",
      shouldPulse: false,
    };
  } else if (zScore > 2) {
    return {
      level: "extremely-slow",
      message: "Time to decide! ⏰",
      shouldPulse: true,
    };
  } else if (zScore > 1.5) {
    return {
      level: "very-slow",
      message: "Taking your time...",
      shouldPulse: false,
    };
  } else if (zScore > 1) {
    return {
      level: "slow",
      message: "Consider your options",
      shouldPulse: false,
    };
  }

  return { level: "normal", message: "", shouldPulse: false };
};
