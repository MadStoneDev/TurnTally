// /session/active
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
  IconSettings,
  IconX,
  IconCheck,
  IconGripVertical,
} from "@tabler/icons-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

interface SortablePlayerProps {
  player: Player;
  isSelected: boolean;
}

function SortablePlayer({ player, isSelected }: SortablePlayerProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`flex items-center space-x-3 p-3 border rounded-lg bg-white ${
        isSelected ? "border-neutral-900 bg-neutral-50" : "border-neutral-200"
      }`}
    >
      <div {...listeners} className="cursor-grab active:cursor-grabbing">
        <IconGripVertical size={18} className="text-neutral-400" />
      </div>
      <div className="text-xl">{player.avatar || "👤"}</div>
      <div className="flex-1">
        <div className="font-medium text-neutral-900 text-sm">
          {player.name}
        </div>
      </div>
      {isSelected && (
        <div className="text-green-600">
          <IconCheck size={18} />
        </div>
      )}
    </div>
  );
}

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
  const [showSettings, setShowSettings] = useState(false);
  const [showEndGameConfirm, setShowEndGameConfirm] = useState(false);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [tempSelectedPlayers, setTempSelectedPlayers] = useState<Player[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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
    setAllPlayers(allPlayers);
    setSessionNotes(currentSession.notes || []);
    setTempSelectedPlayers(sessionPlayers);

    // Initialize turns array for each player
    const savedTurns = currentSession.turns || sessionPlayers.map(() => []);
    setSessionTurns(savedTurns);

    // Set available players for settings
    setAvailablePlayers(
      allPlayers.filter((p) => !currentSession.playerIds.includes(p.id)),
    );
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

  const updateSessionWithTurns = useCallback(
    (updatedSession: Session, turns: number[][]) => {
      const sessionWithTurns = {
        ...updatedSession,
        turns: turns,
      };
      setSession(sessionWithTurns);
      setCurrentSession(sessionWithTurns);
    },
    [],
  );

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
      turns: sessionTurns,
    };

    updateSessionWithTurns(updatedSession, sessionTurns);
    setTurnStartTime(now);
    setCurrentTime(0);
  }, [session, sessionTurns, updateSessionWithTurns]);

  const pauseTimer = useCallback(() => {
    if (!session) return;

    const updatedSession: Session = {
      ...session,
      isPaused: true,
      turns: sessionTurns,
    };

    updateSessionWithTurns(updatedSession, sessionTurns);
  }, [session, sessionTurns, updateSessionWithTurns]);

  const resumeTimer = useCallback(() => {
    if (!session) return;

    const now = Date.now();
    const updatedSession: Session = {
      ...session,
      isPaused: false,
      currentTurnStartTime: now - currentTime * 1000,
      turns: sessionTurns,
    };

    updateSessionWithTurns(updatedSession, sessionTurns);
    setTurnStartTime(now - currentTime * 1000);
  }, [session, currentTime, sessionTurns, updateSessionWithTurns]);

  const nextPlayer = useCallback(
    (saveTime = true) => {
      if (!session || !turnStartTime) return;

      let newTurns = [...sessionTurns];
      if (saveTime) {
        // Save the current turn time
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
        turns: newTurns,
      };

      updateSessionWithTurns(updatedSession, newTurns);
      setTurnStartTime(now);
      setCurrentTime(0);
    },
    [session, sessionTurns, currentTime, turnStartTime, updateSessionWithTurns],
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
        turns: sessionTurns,
      };

      updateSessionWithTurns(updatedSession, sessionTurns);
    },
    [session, sessionNotes, sessionTurns, updateSessionWithTurns],
  );

  const handleAddNote = () => {
    if (noteText.trim()) {
      addNote(noteText.trim(), players[session?.currentPlayerIndex || 0]?.id);
      setNoteText("");
      setShowNoteInput(false);
    }
  };

  // Settings modal functions
  const handlePlayerToggle = (player: Player) => {
    if (tempSelectedPlayers.find((p) => p.id === player.id)) {
      // Remove player
      const newSelected = tempSelectedPlayers.filter((p) => p.id !== player.id);
      setTempSelectedPlayers(newSelected);
      setAvailablePlayers(
        [...availablePlayers, player].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
    } else {
      // Add player
      setTempSelectedPlayers([...tempSelectedPlayers, player]);
      setAvailablePlayers(availablePlayers.filter((p) => p.id !== player.id));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      const oldIndex = tempSelectedPlayers.findIndex((p) => p.id === active.id);
      const newIndex = tempSelectedPlayers.findIndex((p) => p.id === over.id);
      setTempSelectedPlayers(
        arrayMove(tempSelectedPlayers, oldIndex, newIndex),
      );
    }
  };

  const applySettings = () => {
    if (!session || tempSelectedPlayers.length < 2) return;

    // Update session with new player configuration
    const currentPlayerIds = players.map((p) => p.id);
    const newPlayerIds = tempSelectedPlayers.map((p) => p.id);

    const newTurns = tempSelectedPlayers.map((player) => {
      const oldIndex = currentPlayerIds.findIndex((id) => id === player.id);
      return oldIndex >= 0 ? sessionTurns[oldIndex] || [] : [];
    });

    const updatedSession: Session = {
      ...session,
      playerIds: newPlayerIds,
      currentPlayerIndex: Math.min(
        session.currentPlayerIndex,
        newPlayerIds.length - 1,
      ),
      turns: newTurns,
    };

    setSession(updatedSession);
    setCurrentSession(updatedSession);
    setPlayers(tempSelectedPlayers);

    // Initialize new turns array
    setSessionTurns(newTurns);

    setShowSettings(false);
  };

  const cancelSettings = () => {
    // Reset temp selections
    setTempSelectedPlayers(players);
    setAvailablePlayers(
      allPlayers.filter(
        (p) => !players.map((player) => player.id).includes(p.id),
      ),
    );
    setShowSettings(false);
  };

  const getTimerClasses = () => {
    const baseClasses = "text-6xl font-mono font-bold mb-8 timer-display";

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
    const baseClasses =
      "bg-white rounded-lg border-2 p-4 sm:p-8 text-center mb-4 transition-all duration-300 ease-in-out";

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
      const existingGameStats = player.games.find((g) => g.gameId === gameId);

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

  return (
    <div className="py-4 max-w-2xl mx-auto">
      {/* Game Header */}
      <div className="text-center mb-4">
        <div className="flex justify-center items-center space-x-3">
          <div className="text-3xl">{game.avatar || "🎲"}</div>
          <h1 className="text-3xl font-bold text-neutral-900">{game.title}</h1>
          <button
            onClick={() => setShowSettings(true)}
            className="ml-4 p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            title="Session Settings"
          >
            <IconSettings size={20} />
          </button>
        </div>
        <p className="text-neutral-600">Session in progress</p>
      </div>

      {/* End Game Confirmation Modal */}
      {showEndGameConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <IconPlayerStop size={32} className="text-red-600" />
                </div>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-2">
                  End Game Session?
                </h2>
                <p className="text-neutral-600">
                  Are you sure you want to end this game session? This will save
                  all player statistics and you won't be able to continue
                  playing.
                </p>
              </div>

              <div className="text-center text-sm text-neutral-500 mb-6">
                <div>Game: {game?.title}</div>
                <div>
                  Duration:{" "}
                  {formatTime(
                    Math.floor((Date.now() - (session?.startTime || 0)) / 1000),
                  )}
                </div>
                <div>Players: {players.map((p) => p.name).join(", ")}</div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setShowEndGameConfirm(false)}
                  className="flex-1 px-4 py-3 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors font-medium"
                >
                  Continue Playing
                </button>
                <button
                  onClick={() => {
                    setShowEndGameConfirm(false);
                    endGame();
                  }}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  End Game
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-neutral-900">
                  Session Settings
                </h2>
                <button
                  onClick={cancelSettings}
                  className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <IconX size={24} />
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Update Players ({tempSelectedPlayers.length} selected)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Available Players */}
                  <div>
                    <h4 className="text-md font-medium text-neutral-900 mb-3">
                      Available Players
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {availablePlayers.map((player) => (
                        <button
                          key={player.id}
                          onClick={() => handlePlayerToggle(player)}
                          className="w-full flex items-center space-x-2 p-2 border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 transition-colors text-sm"
                        >
                          <div className="text-lg">{player.avatar || "👤"}</div>
                          <div className="flex-1 text-left">
                            <div className="font-medium text-neutral-900 text-sm">
                              {player.name}
                            </div>
                          </div>
                          <div className="text-neutral-400">+</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Players */}
                  <div>
                    <h4 className="text-md font-medium text-neutral-900 mb-3">
                      Selected Players (drag to reorder)
                    </h4>
                    {tempSelectedPlayers.length === 0 ? (
                      <div className="border-2 border-dashed border-neutral-200 rounded-lg p-4 text-center text-neutral-500 text-sm">
                        No players selected
                      </div>
                    ) : (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={tempSelectedPlayers}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {tempSelectedPlayers.map((player, index) => (
                              <div key={player.id} className="relative">
                                <div className="absolute -left-4 top-2 bg-neutral-900 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                  {index + 1}
                                </div>
                                <SortablePlayer
                                  player={player}
                                  isSelected={true}
                                />
                                <button
                                  onClick={() => handlePlayerToggle(player)}
                                  className="absolute top-1 right-1 text-neutral-400 hover:text-red-600 transition-colors"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={cancelSettings}
                  className="px-4 py-2 text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={applySettings}
                  disabled={tempSelectedPlayers.length < 2}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    tempSelectedPlayers.length >= 2
                      ? "bg-neutral-900 text-white hover:bg-neutral-800"
                      : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                  }`}
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Player & Timer */}
      <div className={getCurrentPlayerCardClasses()}>
        <div className="mb-4">
          <div className="text-6xl mb-4"></div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            {currentPlayer.avatar || "👤"} {currentPlayer.name}&apos;s Turn
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {session.isActive && (
                <button
                  onClick={() => nextPlayer()}
                  className="bg-blue-600 text-white px-4 py-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <IconPlayerSkipForward size={20} />
                  <span>Next Player</span>
                </button>
              )}

              {session.isPaused ? (
                <button
                  onClick={resumeTimer}
                  className="bg-green-600 text-white px-4 py-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <IconPlayerPlay size={20} />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className="bg-yellow-600 text-white px-4 py-6 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <IconPlayerPause size={20} />
                  <span>Pause</span>
                </button>
              )}
            </div>
          )}

          {session.isActive && (
            <div className="mt-4">
              <button
                onClick={scrapAndNext}
                className="bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2 mx-auto"
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
                className="bg-neutral-600 text-white px-4 py-3 rounded-lg hover:bg-neutral-700 transition-colors flex items-center justify-center space-x-2 mx-auto"
              >
                <IconNote size={18} />
                <span>Add Note</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setShowEndGameConfirm(true)}
        className={`mb-4 bg-red-600 text-white px-4 py-6 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 w-full`}
      >
        <IconPlayerStop size={20} />
        <span>End Game</span>
      </button>

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
