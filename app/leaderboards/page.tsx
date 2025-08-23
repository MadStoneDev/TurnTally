"use client";

import { useState, useEffect } from "react";
import {
  IconTrophy,
  IconClock,
  IconBolt,
  IconDeviceGamepad2,
  IconCalendar,
  IconTarget,
  IconMedal,
} from "@tabler/icons-react";
import { Player, LeaderboardEntry } from "@/types";
import { getPlayers } from "@/utils/storage";

export default function LeaderboardsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<string>("fastest-average");
  const [leaderboards, setLeaderboards] = useState<
    Record<string, LeaderboardEntry[]>
  >({});

  useEffect(() => {
    const playersList = getPlayers();
    setPlayers(playersList);

    calculateLeaderboards(playersList);
  }, []);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return `${mins}m ${secs}s`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return <IconTrophy size={24} className="text-yellow-500" />;
    }

    if (rank === 2) {
      return <IconMedal size={24} className="text-gray-400" />;
    }

    if (rank === 3) {
      return <IconMedal size={24} className="text-amber-600" />;
    }

    return (
      <div className="w-6 h-6 bg-neutral-200 rounded-full flex items-center justify-center text-sm font-bold text-neutral-600">
        {rank}
      </div>
    );
  };

  const calculateLeaderboards = (playersList: Player[]) => {
    const boards: Record<string, LeaderboardEntry[]> = {};

    // Helper function to create leaderboard entry
    const createEntry = (
      player: Player,
      value: number,
      category: string,
    ): LeaderboardEntry => ({
      playerId: player.id,
      playerName: player.name,
      playerAvatar: player.avatar,
      value,
      rank: 0, // Will be set after sorting
      category,
    });

    // Calculate various statistics for each player
    const playerStats = playersList
      .map((player) => {
        const allSessions = player.games.flatMap((g) => g.sessions);
        const allTurns = allSessions.flatMap((s) => s.playerTurns);
        const allTurnDurations = allTurns.map((t) => t.duration);

        return {
          player,
          totalSessions: allSessions.length,
          totalTurns: allTurns.length,
          totalTime: allTurnDurations.reduce(
            (sum, duration) => sum + duration,
            0,
          ),
          avgTurnTime:
            allTurnDurations.length > 0
              ? allTurnDurations.reduce((sum, duration) => sum + duration, 0) /
                allTurnDurations.length
              : 0,
          fastestTurn:
            allTurnDurations.length > 0 ? Math.min(...allTurnDurations) : 0,
          slowestTurn:
            allTurnDurations.length > 0 ? Math.max(...allTurnDurations) : 0,
          gamesPlayed: player.games.length,
          turnsUnder30s: allTurnDurations.filter((d) => d < 30).length,
          turnsOver2min: allTurnDurations.filter((d) => d > 120).length,
          recentSessions: allSessions.filter(
            (s) => s.sessionStart > Date.now() - 30 * 24 * 60 * 60 * 1000, // Last 30 days
          ).length,
        };
      })
      .filter((stat) => stat.totalSessions > 0); // Only include players with sessions

    // Fastest Average Turn Time
    boards["fastest-average"] = playerStats
      .filter((stat) => stat.avgTurnTime > 0)
      .map((stat) =>
        createEntry(stat.player, stat.avgTurnTime, "Fastest Average"),
      )
      .sort((a, b) => a.value - b.value);

    // Most Sessions Played
    boards["most-sessions"] = playerStats
      .map((stat) =>
        createEntry(stat.player, stat.totalSessions, "Most Sessions"),
      )
      .sort((a, b) => b.value - a.value);

    // Most Games Played
    boards["most-games"] = playerStats
      .map((stat) => createEntry(stat.player, stat.gamesPlayed, "Most Games"))
      .sort((a, b) => b.value - a.value);

    // Fastest Single Turn
    boards["fastest-turn"] = playerStats
      .filter((stat) => stat.fastestTurn > 0)
      .map((stat) => createEntry(stat.player, stat.fastestTurn, "Fastest Turn"))
      .sort((a, b) => a.value - b.value);

    // Most Total Play Time
    boards["total-time"] = playerStats
      .filter((stat) => stat.totalTime > 0)
      .map((stat) =>
        createEntry(stat.player, stat.totalTime, "Total Play Time"),
      )
      .sort((a, b) => b.value - a.value);

    // Speed Demon (Most turns under 30s)
    boards["speed-demon"] = playerStats
      .filter((stat) => stat.turnsUnder30s > 0)
      .map((stat) =>
        createEntry(stat.player, stat.turnsUnder30s, "Quick Turns"),
      )
      .sort((a, b) => b.value - a.value);

    // Most Active (Recent sessions in last 30 days)
    boards["most-active"] = playerStats
      .filter((stat) => stat.recentSessions > 0)
      .map((stat) =>
        createEntry(stat.player, stat.recentSessions, "Recent Activity"),
      )
      .sort((a, b) => b.value - a.value);

    // Set ranks for each leaderboard
    Object.keys(boards).forEach((category) => {
      boards[category].forEach((entry, index) => {
        entry.rank = index + 1;
      });
      // Only keep top 10
      boards[category] = boards[category].slice(0, 10);
    });

    setLeaderboards(boards);
  };

  const formatValue = (value: number, category: string): string => {
    switch (category) {
      case "Fastest Average":
      case "Fastest Turn":
        return formatTime(value);
      case "Total Play Time":
        return formatTime(value);
      default:
        return value.toString();
    }
  };

  const categories = [
    {
      key: "fastest-average",
      label: "Fastest Average",
      icon: IconBolt,
      description: "Lowest average turn time",
    },
    {
      key: "most-sessions",
      label: "Most Sessions",
      icon: IconCalendar,
      description: "Most games played",
    },
    {
      key: "most-games",
      label: "Most Games",
      icon: IconDeviceGamepad2,
      description: "Most different games played",
    },
    {
      key: "fastest-turn",
      label: "Speed Record",
      icon: IconTarget,
      description: "Fastest single turn",
    },
    {
      key: "total-time",
      label: "Total Play Time",
      icon: IconClock,
      description: "Most total time played",
    },
    {
      key: "speed-demon",
      label: "Speed Demon",
      icon: IconBolt,
      description: "Most turns under 30 seconds",
    },
    {
      key: "most-active",
      label: "Most Active",
      icon: IconCalendar,
      description: "Most sessions in last 30 days",
    },
  ];

  const currentLeaderboard = leaderboards[selectedCategory] || [];

  return (
    <div className="py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 flex items-center">
          <IconTrophy size={36} className="mr-3 text-yellow-500" />
          Leaderboards
        </h1>
        <p className="text-neutral-600 mt-2">
          See who&apos;s dominating the board game scene
        </p>
      </div>

      {players.length === 0 || Object.keys(leaderboards).length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-neutral-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <IconTrophy size={32} className="text-neutral-400" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            &quot;No leaderboard data yet&quot;
          </h3>
          <p className="text-neutral-600">
            Play some games to see leaderboards
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Category Selection */}
          <div className="bg-white rounded-lg p-4 border border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Categories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {categories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.key;
                const hasData = leaderboards[category.key]?.length > 0;

                return (
                  <button
                    key={category.key}
                    onClick={() => setSelectedCategory(category.key)}
                    disabled={!hasData}
                    className={`p-4 rounded-lg text-left transition-all ${
                      !hasData
                        ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                        : isSelected
                          ? "bg-neutral-900 text-white"
                          : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <Icon size={20} />
                      <span className="font-medium">{category.label}</span>
                    </div>
                    <p
                      className={`text-sm ${
                        isSelected ? "text-neutral-300" : "text-neutral-500"
                      }`}
                    >
                      {category.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Leaderboard */}
          {currentLeaderboard.length > 0 && (
            <div className="bg-white rounded-lg border border-neutral-200">
              <div className="p-6 border-b border-neutral-200">
                <div className="flex items-center space-x-3">
                  {(() => {
                    const category = categories.find(
                      (c) => c.key === selectedCategory,
                    );
                    const Icon = category?.icon || IconTrophy;
                    return <Icon size={24} className="text-neutral-700" />;
                  })()}
                  <h2 className="text-xl font-semibold text-neutral-900">
                    {categories.find((c) => c.key === selectedCategory)?.label}
                  </h2>
                </div>
              </div>

              <div className="divide-y divide-neutral-100">
                {currentLeaderboard.map((entry, index) => (
                  <div
                    key={entry.playerId}
                    className={`p-6 flex items-center justify-between transition-colors ${
                      index < 3
                        ? "bg-gradient-to-r from-yellow-50 to-transparent"
                        : "hover:bg-neutral-50"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12">
                        {getRankIcon(entry.rank)}
                      </div>

                      <div className="text-4xl">
                        {entry.playerAvatar || "👤"}
                      </div>

                      <div>
                        <h3
                          className={`text-lg font-semibold ${
                            index === 0 ? "text-yellow-700" : "text-neutral-900"
                          }`}
                        >
                          {entry.playerName}
                        </h3>
                        {index < 3 && (
                          <p className="text-sm text-neutral-500">
                            {index === 0
                              ? "👑 Champion"
                              : index === 1
                                ? "🥈 Runner-up"
                                : "🥉 Third place"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-2xl font-bold ${
                          index === 0 ? "text-yellow-600" : "text-neutral-900"
                        }`}
                      >
                        {formatValue(entry.value, entry.category)}
                      </div>
                      <div className="text-sm text-neutral-500">
                        {entry.category}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hall of Fame - Top 3 across all categories */}
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-6 border border-yellow-200">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6 flex items-center">
              <IconTrophy size={24} className="mr-2 text-yellow-600" />
              Hall of Fame
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.slice(0, 3).map((category) => {
                const Icon = category.icon;
                const topEntry = leaderboards[category.key]?.[0];

                if (!topEntry) return null;

                return (
                  <div
                    key={category.key}
                    className="bg-white rounded-lg p-4 border border-yellow-200 text-center"
                  >
                    <div className="flex justify-center mb-3">
                      <Icon size={32} className="text-yellow-600" />
                    </div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      {category.label}
                    </h3>
                    <div className="text-3xl mb-2">
                      {topEntry.playerAvatar || "👤"}
                    </div>
                    <div className="font-medium text-neutral-900">
                      {topEntry.playerName}
                    </div>
                    <div className="text-sm text-yellow-700 font-semibold">
                      {formatValue(topEntry.value, topEntry.category)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
