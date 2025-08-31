"use client";

import { useState, useEffect } from "react";
import {
  IconChartBar,
  IconClock,
  IconDeviceGamepad2,
  IconUsers,
  IconCalendar,
  IconTrash,
  IconHistory,
} from "@tabler/icons-react";
import { Game, Player, Session } from "@/types";
import { getGames, getPlayers, getSessions, saveSessions, savePlayers } from "@/utils/storage";
import { getGameDisplayImage } from "@/lib/helpers";
import ConfirmDialog from "@/components/confirm-dialog";

interface PlayerStats {
  id: string;
  name: string;
  avatar?: string;
  totalSessions: number;
  totalTurns: number;
  avgTurnTime: number;
  fastestTurn: number;
  slowestTurn: number;
  totalTime: number;
  gamesPlayed: number;
}

interface GameStats {
  id: string;
  title: string;
  avatar?: string;
  thumbnail?: string;
  sessionsCount: number;
  totalPlayers: Set<string>;
  avgSessionLength: number;
  lastPlayed?: number;
}

interface SessionWithGameInfo extends Session {
  gameTitle: string;
  gameDisplayImage: { type: "thumbnail" | "avatar" | "default"; value: string };
  playerNames: string[];
}

export default function StatsPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [gameStats, setGameStats] = useState<GameStats[]>([]);
  const [sessionsWithInfo, setSessionsWithInfo] = useState<SessionWithGameInfo[]>([]);
  const [selectedTab, setSelectedTab] = useState<
      "overview" | "players" | "games" | "sessions"
  >("overview");
  const [deletingSession, setDeletingSession] = useState<Session | null>(null);

  const refreshData = () => {
    const gamesList = getGames();
    const playersList = getPlayers();
    const sessionsList = getSessions();

    setGames(gamesList);
    setPlayers(playersList);
    setSessions(sessionsList);

    // Calculate player statistics
    const playerStatsMap = new Map<string, PlayerStats>();

    playersList.forEach((player) => {
      const stats: PlayerStats = {
        id: player.id,
        name: player.name,
        avatar: player.avatar,
        totalSessions: 0,
        totalTurns: 0,
        avgTurnTime: 0,
        fastestTurn: Infinity,
        slowestTurn: 0,
        totalTime: 0,
        gamesPlayed: player.games.length,
      };

      const allTurnTimes: number[] = [];

      player.games.forEach((gameStats) => {
        stats.totalSessions += gameStats.sessions.length;

        gameStats.sessions.forEach((session) => {
          stats.totalTurns += session.playerTurns.length;

          session.playerTurns.forEach((turn) => {
            allTurnTimes.push(turn.duration);
            stats.totalTime += turn.duration;
            stats.fastestTurn = Math.min(stats.fastestTurn, turn.duration);
            stats.slowestTurn = Math.max(stats.slowestTurn, turn.duration);
          });
        });
      });

      if (allTurnTimes.length > 0) {
        stats.avgTurnTime = Math.round(stats.totalTime / allTurnTimes.length);
        if (stats.fastestTurn === Infinity) stats.fastestTurn = 0;
      } else {
        stats.fastestTurn = 0;
      }

      playerStatsMap.set(player.id, stats);
    });

    setPlayerStats(Array.from(playerStatsMap.values()));

    // Calculate game statistics
    const gameStatsMap = new Map<string, GameStats>();

    gamesList.forEach((game) => {
      const stats: GameStats = {
        id: game.id,
        title: game.title,
        avatar: game.avatar,
        thumbnail: game.thumbnail,
        sessionsCount: 0,
        totalPlayers: new Set<string>(),
        avgSessionLength: 0,
        lastPlayed: undefined,
      };

      let totalSessionTime = 0;
      let sessionCount = 0;

      playersList.forEach((player) => {
        const gameData = player.games.find((g) => g.gameId === game.id);
        if (gameData) {
          stats.totalPlayers.add(player.id);
          stats.sessionsCount += gameData.sessions.length;

          gameData.sessions.forEach((session) => {
            sessionCount++;
            const sessionLength = session.sessionEnd
                ? session.sessionEnd - session.sessionStart
                : 0;
            totalSessionTime += sessionLength;

            if (!stats.lastPlayed || session.sessionStart > stats.lastPlayed) {
              stats.lastPlayed = session.sessionStart;
            }
          });
        }
      });

      if (sessionCount > 0) {
        stats.avgSessionLength = Math.round(
            totalSessionTime / sessionCount / 1000,
        ); // Convert to seconds
      }

      gameStatsMap.set(game.id, stats);
    });

    setGameStats(Array.from(gameStatsMap.values()));

    // Prepare sessions with additional info for display
    const sessionsInfo: SessionWithGameInfo[] = sessionsList.map((session) => {
      const game = gamesList.find((g) => g.id === session.gameId);
      const sessionPlayerNames = session.playerIds.map((playerId) => {
        const player = playersList.find((p) => p.id === playerId);
        return player ? player.name : "Unknown Player";
      });

      return {
        ...session,
        gameTitle: game ? game.title : "Unknown Game",
        gameDisplayImage: game ? getGameDisplayImage(game) : { type: "avatar", value: "🎲" },
        playerNames: sessionPlayerNames,
      };
    });

    setSessionsWithInfo(sessionsInfo);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleDeleteSession = (session: Session) => {
    // Remove session from sessions list
    const updatedSessions = sessions.filter((s) => s.id !== session.id);
    setSessions(updatedSessions);
    saveSessions(updatedSessions);

    // Remove session from players' game data
    const updatedPlayers = players.map((player) => {
      const updatedPlayer = { ...player };
      updatedPlayer.games = player.games.map((gameData) => {
        if (gameData.gameId === session.gameId) {
          return {
            ...gameData,
            sessions: gameData.sessions.filter((s) => s.sessionId !== session.id),
          };
        }
        return gameData;
      }).filter((gameData) => gameData.sessions.length > 0); // Remove game data if no sessions left

      return updatedPlayer;
    });

    setPlayers(updatedPlayers);
    savePlayers(updatedPlayers);

    // Refresh all calculated data
    refreshData();
    setDeletingSession(null);
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return `${mins}m ${secs}s`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatDateTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const overallStats = {
    totalGames: games.length,
    totalPlayers: players.length,
    totalSessions: sessions.length,
    totalPlayTime: playerStats.reduce(
        (sum, player) => sum + player.totalTime,
        0,
    ),
  };

  return (
      <div className="py-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Statistics</h1>
          <p className="text-neutral-600 mt-2">
            View your gaming statistics and insights
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-neutral-100 p-1 rounded-lg w-fit">
          {[
            { key: "overview", label: "Overview", icon: IconChartBar },
            { key: "players", label: "Players", icon: IconUsers },
            { key: "games", label: "Games", icon: IconDeviceGamepad2 },
            { key: "sessions", label: "Sessions", icon: IconHistory },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
                <button
                    key={tab.key}
                    onClick={() => setSelectedTab(tab.key as any)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedTab === tab.key
                            ? "bg-white text-neutral-900 shadow-sm"
                            : "text-neutral-600 hover:text-neutral-900"
                    }`}
                >
                  <Icon size={18} />
                  <span className={`hidden sm:block`}>{tab.label}</span>
                </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {selectedTab === "overview" && (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg p-6 border border-neutral-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <IconDeviceGamepad2 size={20} className="text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-neutral-900">Games</h3>
                  </div>
                  <div className="text-3xl font-bold text-neutral-900">
                    {overallStats.totalGames}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border border-neutral-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <IconUsers size={20} className="text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-neutral-900">Players</h3>
                  </div>
                  <div className="text-3xl font-bold text-neutral-900">
                    {overallStats.totalPlayers}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border border-neutral-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="bg-green-100 p-2 rounded-full">
                      <IconCalendar size={20} className="text-green-600" />
                    </div>
                    <h3 className="font-semibold text-neutral-900">Sessions</h3>
                  </div>
                  <div className="text-3xl font-bold text-neutral-900">
                    {overallStats.totalSessions}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border border-neutral-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="bg-orange-100 p-2 rounded-full">
                      <IconClock size={20} className="text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-neutral-900">Play Time</h3>
                  </div>
                  <div className="text-3xl font-bold text-neutral-900">
                    {formatTime(overallStats.totalPlayTime)}
                  </div>
                </div>
              </div>

              {/* Top Players */}
              {playerStats.length > 0 && (
                  <div className="bg-white rounded-lg p-6 border border-neutral-200">
                    <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                      Top Players by Sessions
                    </h2>
                    <div className="space-y-3">
                      {playerStats
                          .sort((a, b) => b.totalSessions - a.totalSessions)
                          .slice(0, 5)
                          .map((player, index) => (
                              <div
                                  key={player.id}
                                  className="flex items-center justify-between"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center text-sm font-medium">
                                    {index + 1}
                                  </div>
                                  <div className="text-2xl">{player.avatar || "👤"}</div>
                                  <div>
                                    <div className="font-medium text-neutral-900">
                                      {player.name}
                                    </div>
                                    <div className="text-sm text-neutral-500">
                                      {player.totalSessions} sessions • Avg:{" "}
                                      {formatTime(player.avgTurnTime)}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-neutral-600">
                                    {player.totalTurns} turns
                                  </div>
                                  <div className="text-sm text-neutral-600">
                                    {formatTime(player.totalTime)} total
                                  </div>
                                </div>
                              </div>
                          ))}
                    </div>
                  </div>
              )}

              {/* Additional Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Most Played Games */}
                {gameStats.length > 0 && (
                    <div className="bg-white rounded-lg p-6 border border-neutral-200">
                      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                        Most Played Games
                      </h3>
                      <div className="space-y-3">
                        {gameStats
                            .sort((a, b) => b.sessionsCount - a.sessionsCount)
                            .slice(0, 3)
                            .map((game, index) => (
                                <div
                                    key={game.id}
                                    className="flex items-center space-x-3"
                                >
                                  <div className="w-6 h-6 bg-neutral-100 rounded-full flex items-center justify-center text-xs font-medium">
                                    {index + 1}
                                  </div>
                                  {(() => {
                                    const displayImage = getGameDisplayImage(game);
                                    return displayImage.type === 'thumbnail' ? (
                                        <img src={displayImage.value} alt={game.title} className="w-10 h-10 object-cover rounded" />
                                    ) : (
                                        <div className="text-2xl">{displayImage.value}</div>
                                    );
                                  })()}
                                  <div className="flex-1">
                                    <div className="font-medium text-neutral-900">
                                      {game.title}
                                    </div>
                                    <div className="text-sm text-neutral-500">
                                      {game.sessionsCount} sessions
                                    </div>
                                  </div>
                                </div>
                            ))}
                      </div>
                    </div>
                )}

                {/* Speed Records */}
                {playerStats.length > 0 && (
                    <div className="bg-white rounded-lg p-6 border border-neutral-200">
                      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                        Speed Records
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm text-neutral-600">Fastest Turn</div>
                          <div className="text-lg font-semibold text-green-600">
                            {formatTime(
                                Math.min(
                                    ...playerStats
                                        .filter((p) => p.fastestTurn > 0)
                                        .map((p) => p.fastestTurn),
                                ),
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-neutral-600">
                            Fastest Average
                          </div>
                          <div className="text-lg font-semibold text-blue-600">
                            {formatTime(
                                Math.min(
                                    ...playerStats
                                        .filter((p) => p.avgTurnTime > 0)
                                        .map((p) => p.avgTurnTime),
                                ),
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-neutral-600">
                            Most Sessions
                          </div>
                          <div className="text-lg font-semibold text-purple-600">
                            {Math.max(...playerStats.map((p) => p.totalSessions))}
                          </div>
                        </div>
                      </div>
                    </div>
                )}
              </div>
            </div>
        )}

        {/* Players Tab */}
        {selectedTab === "players" && (
            <div>
              {playerStats.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-neutral-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconUsers size={32} className="text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      No player statistics
                    </h3>
                    <p className="text-neutral-600">
                      Play some games to see player statistics
                    </p>
                  </div>
              ) : (
                  <div className="space-y-6">
                    {playerStats
                        .sort((a, b) => b.totalSessions - a.totalSessions)
                        .map((player) => (
                            <div
                                key={player.id}
                                className="bg-white rounded-lg p-6 border border-neutral-200"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-4">
                                  <div className="text-4xl">{player.avatar || "👤"}</div>
                                  <div>
                                    <h3 className="text-xl font-semibold text-neutral-900">
                                      {player.name}
                                    </h3>
                                    <p className="text-neutral-600">
                                      {player.gamesPlayed} games played
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-neutral-900">
                                    {player.totalSessions}
                                  </div>
                                  <div className="text-sm text-neutral-600">Sessions</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-neutral-900">
                                    {player.totalTurns}
                                  </div>
                                  <div className="text-sm text-neutral-600">Turns</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-neutral-900">
                                    {formatTime(player.avgTurnTime)}
                                  </div>
                                  <div className="text-sm text-neutral-600">Avg Turn</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-green-600">
                                    {formatTime(player.fastestTurn)}
                                  </div>
                                  <div className="text-sm text-neutral-600">Fastest</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-red-600">
                                    {formatTime(player.slowestTurn)}
                                  </div>
                                  <div className="text-sm text-neutral-600">Slowest</div>
                                </div>
                              </div>
                            </div>
                        ))}
                  </div>
              )}
            </div>
        )}

        {/* Games Tab */}
        {selectedTab === "games" && (
            <div>
              {gameStats.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-neutral-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconDeviceGamepad2 size={32} className="text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      No game statistics
                    </h3>
                    <p className="text-neutral-600">
                      Play some games to see game statistics
                    </p>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {gameStats
                        .sort((a, b) => b.sessionsCount - a.sessionsCount)
                        .map((game) => (
                            <div
                                key={game.id}
                                className="bg-white rounded-lg p-6 border border-neutral-200"
                            >
                              <div className="flex items-start space-x-4 mb-4">
                                {(() => {
                                  const displayImage = getGameDisplayImage(game);
                                  return displayImage.type === 'thumbnail' ? (
                                      <img src={displayImage.value} alt={game.title} className="w-14 h-14 object-cover rounded" />
                                  ) : (
                                      <div className="text-4xl">{displayImage.value}</div>
                                  );
                                })()}
                                <div className="flex-1">
                                  <h3 className="text-xl font-semibold text-neutral-900">
                                    {game.title}
                                  </h3>
                                  <p className="text-neutral-600">
                                    {game.totalPlayers.size} players •{" "}
                                    {game.sessionsCount} sessions
                                  </p>
                                  {game.lastPlayed && (
                                      <p className="text-sm text-neutral-500">
                                        Last played: {formatDate(game.lastPlayed)}
                                      </p>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-100">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-neutral-900">
                                    {game.sessionsCount}
                                  </div>
                                  <div className="text-sm text-neutral-600">Sessions</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-neutral-900">
                                    {game.totalPlayers.size}
                                  </div>
                                  <div className="text-sm text-neutral-600">Players</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-neutral-900">
                                    {formatTime(game.avgSessionLength)}
                                  </div>
                                  <div className="text-sm text-neutral-600">
                                    Avg Session
                                  </div>
                                </div>
                              </div>
                            </div>
                        ))}
                  </div>
              )}
            </div>
        )}

        {/* Sessions Tab */}
        {selectedTab === "sessions" && (
            <div>
              {sessionsWithInfo.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-neutral-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconHistory size={32} className="text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      No sessions yet
                    </h3>
                    <p className="text-neutral-600">
                      Complete some games to see session history
                    </p>
                  </div>
              ) : (
                  <div className="space-y-4">
                    {sessionsWithInfo
                        .sort((a, b) => b.startTime - a.startTime)
                        .map((session) => (
                            <div
                                key={session.id}
                                className="bg-white rounded-lg p-6 border border-neutral-200"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-4 flex-1">
                                  {session.gameDisplayImage.type === 'thumbnail' ? (
                                      <img
                                          src={session.gameDisplayImage.value}
                                          alt={session.gameTitle}
                                          className="w-12 h-12 object-cover rounded"
                                      />
                                  ) : (
                                      <div className="text-3xl">{session.gameDisplayImage.value}</div>
                                  )}
                                  <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-neutral-900">
                                      {session.gameTitle}
                                    </h3>
                                    <div className="text-sm text-neutral-600 space-y-1">
                                      <div>
                                        <strong>Players:</strong> {session.playerNames.join(", ")}
                                      </div>
                                      <div>
                                        <strong>Started:</strong> {formatDateTime(session.startTime)}
                                      </div>
                                      {session.endTime && (
                                          <div>
                                            <strong>Duration:</strong> {formatTime((session.endTime - session.startTime) / 1000)}
                                          </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <button
                                    onClick={() => setDeletingSession(session)}
                                    className="text-neutral-400 hover:text-red-600 transition-colors ml-4"
                                    title="Delete session"
                                >
                                  <IconTrash size={20} />
                                </button>
                              </div>
                            </div>
                        ))}
                  </div>
              )}
            </div>
        )}

        {/* Delete Confirmation */}
        {deletingSession && (
            <ConfirmDialog
                title="Delete Session"
                message={`Are you sure you want to delete this session? This will remove all turn data and statistics for this session. This action cannot be undone.`}
                confirmText="Delete Session"
                confirmVariant="danger"
                onConfirm={() => handleDeleteSession(deletingSession)}
                onClose={() => setDeletingSession(null)}
            />
        )}
      </div>
  );
}