"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerSkipForward,
  IconPlayerStop,
  IconClock,
  IconRotate2,
  IconHome,
  IconNote,
  IconPlus,
} from "@tabler/icons-react";
import {
  Game,
  Player,
  Session,
  PlayerGameStats,
  GameSession,
  PlayerTurn,
  SessionNote,
  TimerWarningLevel,
} from "@/types";
import {
  getCurrentSession,
  setCurrentSession,
  getGames,
  getPlayers,
  updatePlayer,
  addSession,
  updateQuickStartData,
  calculateTimerWarning,
} from "@/utils/storage";

export default function ActiveSessionPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [turnStartTime, setTurnStartTime] = useState<number | null>(null);
  const [sessionTurns, setSessionTurns] = useState<number[][]>([]);
  const [timerWarning, setTimerWarning] = useState<TimerWarningLevel>({
    level: "normal",
    message: "",
    shouldPulse: false,
  });
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>([]);

  // Initialize session data
  useEffect(() => {
    const currentSession = getCurrentSession();
    if (!currentSession) {
      router.push("/session/setup");
      return;
    }

    const games = getGames();
    const allPlayers = getPlayers();
    const currentGame = games.find((g) => g.id === currentSession.gameId);
    const sessionPlayers = currentSession.playerIds
      .map((id) => allPlayers.find((p) => p.id === id))
      .filter(Boolean) as Player[];

    if (!currentGame || sessionPlayers.length === 0) {
      router.push("/session/setup");
      return;
    }

    setSession(currentSession);
    setGame(currentGame);
    setPlayers(sessionPlayers);
    setSessionNotes(currentSession.notes || []);

    // Initialize turns array for each player
    setSessionTurns(sessionPlayers.map(() => []));
  }, [router]);

  // Timer effect with warning calculation
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (session?.isActive && !session?.isPaused && turnStartTime) {
      interval = setInterval(() => {
        const newTime = Math.floor((Date.now() - turnStartTime) / 1000);
        setCurrentTime(newTime);

        // Calculate timer warning
        if (newTime > 10) {
          // Only show warnings after 10 seconds
          const warning = calculateTimerWarning(
            newTime,
            sessionTurns,
            session.currentPlayerIndex,
          );
          setTimerWarning(warning);
        } else {
          setTimerWarning({ level: "normal", message: "", shouldPulse: false });
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    session?.isActive,
    session?.isPaused,
    turnStartTime,
    sessionTurns,
    session?.currentPlayerIndex,
  ]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const startTimer = useCallback(() => {
    if (!session) return;

    const now = Date.now();
    const updatedSession: Session = {
      ...session,
      isActive: true,
      isPaused: false,
      currentTurnStartTime: now,
    };

    setSession(updatedSession);
    setCurrentSession(updatedSession);
    setTurnStartTime(now);
    setCurrentTime(0);
  }, [session]);

  const pauseTimer = useCallback(() => {
    if (!session) return;

    const updatedSession: Session = {
      ...session,
      isPaused: true,
    };

    setSession(updatedSession);
    setCurrentSession(updatedSession);
  }, [session]);

  const resumeTimer = useCallback(() => {
    if (!session) return;

    const now = Date.now();
    const updatedSession: Session = {
      ...session,
      isPaused: false,
      currentTurnStartTime: now - currentTime * 1000,
    };

    setSession(updatedSession);
    setCurrentSession(updatedSession);
    setTurnStartTime(now - currentTime * 1000);
  }, [session, currentTime]);

  const nextPlayer = useCallback(
    (saveTime = true) => {
      if (!session || !turnStartTime) return;

      if (saveTime) {
        // Save the current turn time
        const newTurns = [...sessionTurns];
        newTurns[session.currentPlayerIndex].push(currentTime);
        setSessionTurns(newTurns);
      }

      // Move to next player
      const nextIndex =
        (session.currentPlayerIndex + 1) % session.playerIds.length;
      const now = Date.now();

      const updatedSession: Session = {
        ...session,
        currentPlayerIndex: nextIndex,
        currentTurnStartTime: now,
      };

      setSession(updatedSession);
      setCurrentSession(updatedSession);
      setTurnStartTime(now);
      setCurrentTime(0);
    },
    [session, sessionTurns, currentTime, turnStartTime],
  );

  const scrapAndNext = useCallback(() => {
    nextPlayer(false);
  }, [nextPlayer]);

  const addNote = useCallback(
    (note: string, playerId?: string) => {
      if (!session) return;

      const newNote: SessionNote = {
        id: uuidv4(),
        timestamp: Date.now(),
        playerId,
        note,
      };

      const updatedNotes = [...sessionNotes, newNote];
      setSessionNotes(updatedNotes);

      const updatedSession = {
        ...session,
        notes: updatedNotes,
      };

      setSession(updatedSession);
      setCurrentSession(updatedSession);
    },
    [session, sessionNotes],
  );

  const handleAddNote = () => {
    if (noteText.trim()) {
      addNote(noteText.trim(), players[session?.currentPlayerIndex || 0]?.id);
      setNoteText("");
      setShowNoteInput(false);
    }
  };

  const getTimerClasses = () => {
    let baseClasses = "text-6xl font-mono font-bold mb-8 timer-display";

    switch (timerWarning.level) {
      case "fast":
        return `${baseClasses} text-green-600`;
      case "slow":
        return `${baseClasses} text-yellow-600`;
      case "very-slow":
        return `${baseClasses} text-orange-600`;
      case "extremely-slow":
        return `${baseClasses} text-red-600 ${
          timerWarning.shouldPulse ? "timer-pulse" : ""
        }`;
      default:
        return `${baseClasses} text-neutral-900`;
    }
  };

  const getCurrentPlayerCardClasses = () => {
    let baseClasses = "bg-white rounded-lg border-2 p-8 text-center mb-8";

    switch (timerWarning.level) {
      case "fast":
        return `${baseClasses} timer-fast`;
      case "slow":
        return `${baseClasses} timer-slow`;
      case "very-slow":
        return `${baseClasses} timer-very-slow`;
      case "extremely-slow":
        return `${baseClasses} timer-extremely-slow`;
      default:
        return `${baseClasses} border-neutral-900`;
    }
  };

  const endGame = useCallback(() => {
    if (!session || !game || players.length === 0) return;

    // Save current turn if timer is running
    if (session.isActive && !session.isPaused && turnStartTime) {
      const newTurns = [...sessionTurns];
      newTurns[session.currentPlayerIndex].push(currentTime);
      setSessionTurns(newTurns);
    }

    // Update quick start data
    updateQuickStartData(session.gameId, session.playerIds);

    // Create session data for each player
    const sessionId = session.id;
    const gameId = session.gameId;
    const sessionStart = session.startTime;
    const sessionEnd = Date.now();

    // Update each player's game statistics
    const finalTurns =
      session.isActive && !session.isPaused && turnStartTime
        ? (() => {
            const newTurns = [...sessionTurns];
            newTurns[session.currentPlayerIndex].push(currentTime);
            return newTurns;
          })()
        : sessionTurns;

    players.forEach((player, playerIndex) => {
      const playerTurns: PlayerTurn[] = finalTurns[playerIndex].map(
        (duration) => ({
          duration,
          timestamp: Date.now(),
        }),
      );

      const gameSession: GameSession = {
        sessionId,
        gameId,
        sessionStart,
        sessionEnd,
        playerTurns,
        notes: sessionNotes,
      };

      // Find or create game stats for this player
      let existingGameStats = player.games.find((g) => g.gameId === gameId);

      if (existingGameStats) {
        existingGameStats.sessions.push(gameSession);
      } else {
        const newGameStats: PlayerGameStats = {
          gameId,
          sessions: [gameSession],
        };
        player.games.push(newGameStats);
      }

      updatePlayer(player.id, player);
    });

    // Save session record
    const completedSession = {
      ...session,
      endTime: sessionEnd,
      isActive: false,
      notes: sessionNotes,
    };
    addSession(completedSession);

    // Clear current session
    setCurrentSession(null);

    // Redirect to stats or home
    router.push("/stats");
  }, [
    session,
    game,
    players,
    sessionTurns,
    currentTime,
    turnStartTime,
    sessionNotes,
    router,
  ]);

  if (!session || !game || players.length === 0) {
    return <div>Loading...</div>;
  }

  const currentPlayer = players[session.currentPlayerIndex];
  const isRunning = session.isActive && !session.isPaused;

  return (
    <div className="py-8 max-w-2xl mx-auto">
      {/* Game Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center items-center space-x-3 mb-4">
          <div className="text-4xl">{game.avatar || "🎲"}</div>
          <h1 className="text-3xl font-bold text-neutral-900">{game.title}</h1>
        </div>
        <p className="text-neutral-600">Session in progress</p>
      </div>

      {/* Current Player & Timer */}
      <div className={getCurrentPlayerCardClasses()}>
        <div className="mb-6">
          <div className="text-6xl mb-4">{currentPlayer.avatar || "👤"}</div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            {currentPlayer.name}'s Turn
          </h2>
          <div className="flex justify-center items-center space-x-2 text-neutral-600">
            <IconClock size={20} />
            <span>
              Turn {sessionTurns[session.currentPlayerIndex].length + 1}
            </span>
          </div>
          {timerWarning.message && (
            <div className="mt-2 text-sm font-medium">
              {timerWarning.message}
            </div>
          )}
        </div>

        <div className={getTimerClasses()}>{formatTime(currentTime)}</div>

        {/* Control Buttons */}
        <div className="space-y-4">
          {!session.isActive ? (
            <button
              onClick={startTimer}
              className="w-full bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-lg font-semibold"
            >
              <IconPlayerPlay size={24} />
              <span>Start</span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {session.isPaused ? (
                <button
                  onClick={resumeTimer}
                  className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <IconPlayerPlay size={20} />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className="bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <IconPlayerPause size={20} />
                  <span>Pause</span>
                </button>
              )}

              <button
                onClick={endGame}
                className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
              >
                <IconPlayerStop size={20} />
                <span>End Game</span>
              </button>
            </div>
          )}

          {session.isActive && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <button
                onClick={() => nextPlayer()}
                className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <IconPlayerSkipForward size={20} />
                <span>Next Player</span>
              </button>

              <button
                onClick={scrapAndNext}
                className="bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
              >
                <IconRotate2 size={20} />
                <span>Scrap & Next</span>
              </button>
            </div>
          )}

          {/* Add Note Button */}
          {session.isActive && (
            <div className="mt-4">
              <button
                onClick={() => setShowNoteInput(!showNoteInput)}
                className="bg-neutral-600 text-white px-4 py-2 rounded-lg hover:bg-neutral-700 transition-colors flex items-center justify-center space-x-2 mx-auto"
              >
                <IconNote size={18} />
                <span>Add Note</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Note Input */}
      {showNoteInput && (
        <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-8">
          <div className="flex space-x-2">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note about this moment..."
              className="flex-1 px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-500"
              onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
            />
            <button
              onClick={handleAddNote}
              className="bg-neutral-900 text-white px-4 py-2 rounded-md hover:bg-neutral-800 transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => setShowNoteInput(false)}
              className="bg-neutral-300 text-neutral-700 px-4 py-2 rounded-md hover:bg-neutral-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Session Notes */}
      {sessionNotes.length > 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
            <IconNote size={20} className="mr-2" />
            Session Notes
          </h3>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {sessionNotes.map((note) => {
              const notePlayer = note.playerId
                ? players.find((p) => p.id === note.playerId)
                : null;
              return (
                <div
                  key={note.id}
                  className="flex items-start space-x-3 p-3 bg-neutral-50 rounded-lg"
                >
                  <div className="text-xl">
                    {notePlayer ? notePlayer.avatar || "👤" : "📝"}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-neutral-600 mb-1">
                      {notePlayer
                        ? `${notePlayer.name}'s turn`
                        : "General note"}{" "}
                      •{" "}
                      {new Date(note.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-neutral-900">{note.note}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Player List */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Players</h3>
        <div className="space-y-3">
          {players.map((player, index) => {
            const isCurrentPlayer = index === session.currentPlayerIndex;
            const playerTurns = sessionTurns[index] || [];
            const totalTime = playerTurns.reduce((sum, time) => sum + time, 0);
            const avgTime =
              playerTurns.length > 0
                ? Math.round(totalTime / playerTurns.length)
                : 0;

            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isCurrentPlayer
                    ? "border-neutral-900 bg-neutral-50"
                    : "border-neutral-200"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{player.avatar || "👤"}</div>
                  <div>
                    <div className="font-medium text-neutral-900">
                      {player.name}
                    </div>
                    <div className="text-sm text-neutral-500">
                      {playerTurns.length} turns • Avg: {formatTime(avgTime)}
                    </div>
                  </div>
                </div>
                {isCurrentPlayer && (
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    Current
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="text-center">
        <button
          onClick={() => router.push("/")}
          className="text-neutral-600 hover:text-neutral-900 transition-colors flex items-center justify-center space-x-2 mx-auto"
        >
          <IconHome size={18} />
          <span>Back to Home</span>
        </button>
      </div>
    </div>
  );
}
