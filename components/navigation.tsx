"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHome,
  IconDeviceGamepad2,
  IconUsers,
  IconPlayerPlay,
  IconChartBar,
  IconTrophy,
  IconPlayerPause,
  IconClock,
} from "@tabler/icons-react";
import { Session, Game } from "@/types";
import { getCurrentSession, getGames } from "@/utils/storage";

const navItems = [
  { href: "/", label: "Home", icon: IconHome },
  { href: "/games", label: "Games", icon: IconDeviceGamepad2 },
  { href: "/players", label: "Players", icon: IconUsers },
  { href: "/session", label: "Play", icon: IconPlayerPlay },
  { href: "/stats", label: "Stats", icon: IconChartBar },
  { href: "/leaderboards", label: "Leaderboards", icon: IconTrophy },
];

export default function Navigation() {
  const pathname = usePathname();
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [sessionDuration, setSessionDuration] = useState<string>("00:00");

  useEffect(() => {
    const updateSessionStatus = () => {
      const session = getCurrentSession();
      setCurrentSession(session);

      if (session) {
        const games = getGames();
        const game = games.find((g) => g.id === session.gameId);
        setCurrentGame(game || null);

        // Calculate duration
        const duration = Math.floor((Date.now() - session.startTime) / 1000);
        const mins = Math.floor(duration / 60);
        const secs = duration % 60;
        setSessionDuration(
          `${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`,
        );
      }
    };

    // Update immediately
    updateSessionStatus();

    // Update every second when there's an active session
    const interval = setInterval(updateSessionStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  const getSessionStatusIcon = () => {
    if (!currentSession) return null;

    if (!currentSession.isActive) {
      return <IconPlayerPlay size={16} className="text-blue-600" />;
    } else if (currentSession.isPaused) {
      return <IconPlayerPause size={16} className="text-yellow-600" />;
    } else {
      return <IconClock size={16} className="text-green-600" />;
    }
  };

  const getSessionStatusText = () => {
    if (!currentSession) return null;

    if (!currentSession.isActive) {
      return "Ready";
    } else if (currentSession.isPaused) {
      return "Paused";
    } else {
      return "Playing";
    }
  };

  const getSessionStatusColor = () => {
    if (!currentSession) return "";

    if (!currentSession.isActive) {
      return "text-blue-600";
    } else if (currentSession.isPaused) {
      return "text-yellow-600";
    } else {
      return "text-green-600";
    }
  };

  return (
    <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center md:justify-between h-16">
          <Link href="/" className="text-xl font-bold text-neutral-900">
            TurnTally
          </Link>

          <div className="hidden md:flex items-center">
            {/* Navigation Items */}
            <div className="flex space-x-2 lg:space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm lg:font-medium transition-all duration-300 ease-in-out ${
                      isActive
                        ? "text-neutral-900 bg-neutral-100"
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Session Status */}
            {currentSession && (
              <div className="hidden lg:flex items-center">
                <div className="h-8 w-px bg-neutral-200 mx-4" />
                <Link
                  href="/session/active"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-colors bg-white"
                >
                  {getSessionStatusIcon()}
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-neutral-900">
                        {currentGame?.title || "Active Session"}
                      </span>
                    </div>
                    <div className={`text-xs ${getSessionStatusColor()}`}>
                      {getSessionStatusText()} • {sessionDuration}
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Session Status */}
      {currentSession && (
        <div className="container mx-auto hidden md:flex lg:hidden items-center">
          <Link
            href={`/session/active`}
            className="flex justify-between items-center space-x-2 px-3 py-2 w-full border-t border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-all duration-300 ease-in-out bg-white"
          >
            <div className={`flex items-center gap-2`}>
              {getSessionStatusIcon()}
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-neutral-900">
                    {currentGame?.title || "Active Session"}
                  </span>
                </div>
                <div className={`text-xs ${getSessionStatusColor()}`}>
                  {getSessionStatusText()} • {sessionDuration}
                </div>
              </div>
            </div>

            <div className="text-xs text-neutral-500">Tap to continue</div>
          </Link>
        </div>
      )}

      {/* Mobile navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-50">
        {/* Session Status Bar for Mobile */}
        {currentSession && (
          <div className="border-b border-neutral-200 px-4 py-2">
            <Link
              href="/session/active"
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center space-x-3">
                {getSessionStatusIcon()}
                <div>
                  <div className="text-sm font-medium text-neutral-900">
                    {currentGame?.title || "Active Session"}
                  </div>
                  <div className={`text-xs ${getSessionStatusColor()}`}>
                    {getSessionStatusText()} • {sessionDuration}
                  </div>
                </div>
              </div>
              <div className="text-xs text-neutral-500">Tap to continue</div>
            </Link>
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive ? "text-neutral-900" : "text-neutral-600"
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
