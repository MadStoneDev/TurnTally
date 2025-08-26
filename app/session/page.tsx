"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  IconPlayerPlay,
  IconPlus,
  IconClock,
  IconUsers,
  IconDeviceGamepad2,
  IconCalendar,
  IconNote,
  IconEye,
} from "@tabler/icons-react";
import { Game, Player, Session } from "@/types";
import {
  getCurrentSession,
  getSessions,
  getGames,
  getPlayers,
} from "@/utils/storage";

export default function SessionPage() {
  const router = useRouter();
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [previousSessions, setPreviousSessions] = useState<Session[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const current = getCurrentSession();
    const sessions = getSessions();
    const gamesList = getGames();
    const playersList = getPlayers();

    setCurrentSession(current);
    setPreviousSessions(sessions.sort((a, b) => b.startTime - a.startTime));
    setGames(gamesList);
    setPlayers(playersList);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSessionDuration = (session: Session): string => {
    if (!session.endTime) {
      // Active session - calculate current duration
      const duration = Math.floor((Date.now() - session.startTime) / 1000);
      return formatTime(duration);
    }
    const duration = Math.floor((session.endTime - session.startTime) / 1000);
    return formatTime(duration);
  };

  const getGameForSession = (session: Session): Game | undefined => {
    return games.find((g) => g.id === session.gameId);
  };

  const getPlayersForSession = (session: Session): Player[] => {
    return session.playerIds
      .map((id) => players.find((p) => p.id === id))
      .filter(Boolean) as Player[];
  };

  const viewSessionDetails = (session: Session) => {
    // For now, just log the session details
    // In a real app, you'd navigate to a detailed view
    console.log("View session details:", session);
    // Could navigate to a detailed session view page
    // router.push(`/session/details/${session.id}`);
  };

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">Game Sessions</h1>
        <p className="text-neutral-600 mt-2">
          Track your gameplay sessions and timing statistics
        </p>
      </div>

      {/* Active Session */}
      {currentSession && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">
            Active Session
          </h2>
          <div className="bg-white rounded-lg border-2 border-green-500 p-6">
            <div className="mb-4 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm text-center font-medium">
              {currentSession.isActive
                ? currentSession.isPaused
                  ? "Paused"
                  : "Playing"
                : "Ready to Start"}
            </div>

            <div className="flex items-center justify-between">
              <div className="mb-2 flex items-center space-x-4">
                <div className={``}>
                  <h3 className="text-xl font-bold text-neutral-900">
                    <div className="text-3xl">
                      {getGameForSession(currentSession)?.avatar || "🎲"}
                    </div>
                    {getGameForSession(currentSession)?.title || "Unknown Game"}
                  </h3>
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 text-sm text-neutral-600 mt-1">
                    <div className="flex items-center space-x-1">
                      <IconUsers size={16} />
                      <span>
                        {getPlayersForSession(currentSession).length} players
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <IconClock size={16} />
                      <span>{getSessionDuration(currentSession)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <IconCalendar size={16} />
                      <span>
                        Started {formatDateTime(currentSession.startTime)}
                      </span>
                    </div>
                  </div>
                  {currentSession.notes && currentSession.notes.length > 0 && (
                    <div className="flex items-center space-x-1 text-sm text-neutral-500 mt-1">
                      <IconNote size={16} />
                      <span>
                        {currentSession.notes.length} note
                        {currentSession.notes.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Player avatars */}
            <div className="mt-4 flex flex-col space-x-2">
              <span className="text-sm text-neutral-600">Players:</span>
              <div className={`flex flex-row flex-wrap gap-2`}>
                {getPlayersForSession(currentSession).map((player, index) => (
                  <div key={player.id} className="flex items-center space-x-1">
                    <div className="text-lg">{player.avatar || "👤"}</div>
                    <span className="text-sm text-neutral-700">
                      {player.name}
                    </span>
                    {index <
                      getPlayersForSession(currentSession).length - 1 && (
                      <span className="text-neutral-400 mx-1">•</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => router.push("/session/active")}
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex justify-center items-center space-x-2 w-full"
            >
              <IconPlayerPlay size={18} />
              <span>Continue</span>
            </button>
          </div>
        </div>
      )}

      {/* New Session Button */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/session/setup")}
          className="bg-neutral-900 text-white px-6 py-3 rounded-lg hover:bg-neutral-800 transition-colors flex items-center space-x-3 text-lg font-semibold"
        >
          <IconPlus size={24} />
          <span>Start New Game Session</span>
        </button>
      </div>

      {/* Previous Sessions */}
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">
          Previous Sessions
        </h2>

        {previousSessions.length === 0 ? (
          <div className="bg-neutral-100 border border-neutral-200 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">🎮</div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              No Previous Sessions
            </h3>
            <p className="text-neutral-600 mb-4">
              Start your first game session to see your gameplay history here.
            </p>
            <button
              onClick={() => router.push("/session/setup")}
              className="bg-neutral-900 text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Start Your First Session
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {previousSessions.map((session) => {
              const game = getGameForSession(session);
              const sessionPlayers = getPlayersForSession(session);

              return (
                <div
                  key={session.id}
                  className="bg-white rounded-lg border border-neutral-200 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{game?.avatar || "🎲"}</div>
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900">
                          {game?.title || "Unknown Game"}
                        </h3>
                        <div className="flex flex-col md:flex-row items-center space-x-4 text-sm text-neutral-600 mt-1">
                          <div className="flex items-center space-x-1">
                            <IconUsers size={16} />
                            <span>{sessionPlayers.length} players</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <IconClock size={16} />
                            <span>{getSessionDuration(session)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <IconCalendar size={16} />
                            <span>{formatDate(session.startTime)}</span>
                          </div>
                        </div>
                        {session.notes && session.notes.length > 0 && (
                          <div className="flex items-center space-x-1 text-sm text-neutral-500 mt-1">
                            <IconNote size={16} />
                            <span>
                              {session.notes.length} note
                              {session.notes.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="bg-neutral-100 text-neutral-700 px-3 py-1 rounded-full text-sm font-medium">
                        Completed
                      </div>
                      <button
                        onClick={() => viewSessionDetails(session)}
                        className="text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 p-2 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <IconEye size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Player avatars */}
                  <div className="mt-4 flex items-center space-x-2">
                    <span className="text-sm text-neutral-600">Players:</span>
                    {sessionPlayers.map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center space-x-1"
                      >
                        <div className="text-lg">{player.avatar || "👤"}</div>
                        <span className="text-sm text-neutral-700">
                          {player.name}
                        </span>
                        {index < sessionPlayers.length - 1 && (
                          <span className="text-neutral-400 mx-1">•</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Session stats preview */}
                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-neutral-900">
                          {formatDateTime(session.startTime)}
                        </div>
                        <div className="text-xs text-neutral-600">Started</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-neutral-900">
                          {session.endTime
                            ? formatDateTime(session.endTime)
                            : "In Progress"}
                        </div>
                        <div className="text-xs text-neutral-600">Ended</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-neutral-900">
                          {getSessionDuration(session)}
                        </div>
                        <div className="text-xs text-neutral-600">Duration</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-neutral-900">
                          {session.notes?.length || 0}
                        </div>
                        <div className="text-xs text-neutral-600">Notes</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
