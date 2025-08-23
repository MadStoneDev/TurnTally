"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconPlayerPlay,
  IconDeviceGamepad2,
  IconUsers,
  IconClock,
  IconTrendingUp,
  IconTrophy,
} from "@tabler/icons-react";
import {
  getGames,
  getPlayers,
  getCurrentSession,
  initializeDummyData,
} from "@/utils/storage";
import { Game, Player, Session } from "@/types";

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  useEffect(() => {
    initializeDummyData();
    setGames(getGames());
    setPlayers(getPlayers());
    setCurrentSession(getCurrentSession());
  }, []);

  const quickActions = [
    {
      href: "/session/setup",
      title: "Start New Game",
      description: "Begin timing a new board game session",
      icon: IconPlayerPlay,
      color: "bg-green-100 text-green-600",
    },
    {
      href: "/games",
      title: "Manage Games",
      description: "Add or edit your board game collection",
      icon: IconDeviceGamepad2,
      color: "bg-blue-100 text-blue-600",
    },
    {
      href: "/players",
      title: "Manage Players",
      description: "Add or edit player profiles",
      icon: IconUsers,
      color: "bg-purple-100 text-purple-600",
    },
    {
      href: "/stats",
      title: "View Statistics",
      description: "See timing stats and game history",
      icon: IconTrendingUp,
      color: "bg-orange-100 text-orange-600",
    },
    {
      href: "/leaderboards",
      title: "Leaderboards",
      description: "See who tops the charts",
      icon: IconTrophy,
      color: "bg-yellow-100 text-yellow-600",
    },
  ];

  return (
    <div className="py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="bg-neutral-900 text-white p-4 rounded-full">
            <IconClock size={32} />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-neutral-900 mb-4">
          Welcome to TurnTimer
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Track and time player turns in your board games. Get insights into
          gameplay patterns and make your game nights more engaging.
        </p>
      </div>

      {/* Current Session Alert */}
      {currentSession && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-full">
                <IconPlayerPlay size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">
                  Game Session in Progress
                </h3>
                <p className="text-green-700 text-sm">
                  You have an active game session running
                </p>
              </div>
            </div>
            <Link
              href="/session/active"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Continue
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="bg-white rounded-lg p-6 border border-neutral-200 hover:border-neutral-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-full ${action.color}`}>
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    {action.title}
                  </h3>
                  <p className="text-neutral-600">{action.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Overview Stats */}
      <div className="bg-white rounded-lg p-6 border border-neutral-200">
        <h2 className="text-xl font-semibold text-neutral-900 mb-6">
          Quick Overview
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-neutral-900 mb-2">
              {games.length}
            </div>
            <div className="text-neutral-600">Games</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-neutral-900 mb-2">
              {players.length}
            </div>
            <div className="text-neutral-600">Players</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-neutral-900 mb-2">
              {currentSession ? "1" : "0"}
            </div>
            <div className="text-neutral-600">Active Sessions</div>
          </div>
        </div>
      </div>
    </div>
  );
}
