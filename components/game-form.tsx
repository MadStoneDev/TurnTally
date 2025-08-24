"use client";

import { useState } from "react";
import { IconX } from "@tabler/icons-react";
import { Game } from "@/types";

interface GameFormProps {
  game?: Game;
  onSubmit: (game: Omit<Game, "id">) => void;
  onClose: () => void;
}

const gameEmojis = [
  "🎲",
  "♟️",
  "🎳 ",
  "🧩 ",
  "🃏",
  "🎯",
  "📝",
    "🎮 ",
    "🕹️",
    "🦅 ",
    "🦆 ",
    "🦉 ",
    "🐉 ",
    "🗡️",
  "⚔️",
    "🏹 ",
  "🧙‍♂️",
  "👑",
  "🛡️",
    "🏰 ",
  "🏠",
    "🎪", 
    "⚰️",
    "💣 ",
  "🚗",
    "✈️",
    "🚁 ",
  "🚂 ",
    "🚢 ",
  "🏝️",
];

export default function GameForm({ game, onSubmit, onClose }: GameFormProps) {
  const [formData, setFormData] = useState({
    title: game?.title || "",
    avatar: game?.avatar || "🎲",
    description: game?.description || "",
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Game title is required";
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit({
        title: formData.title.trim(),
        avatar: formData.avatar,
        description: formData.description.trim() || undefined,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-neutral-900">
            {game ? "Edit Game" : "Add New Game"}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Avatar
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2  max-h-[200px] overflow-y-auto">
              {gameEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, avatar: emoji })}
                  className={`text-2xl p-2 rounded-md border-2 transition-colors ${
                    formData.avatar === emoji
                      ? "border-neutral-900 bg-neutral-100"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Title
            </label>
            <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-500"
                placeholder="Game Title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-500"
              placeholder="Optional game description"
              rows={3}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-neutral-900 text-white rounded-md hover:bg-neutral-800 transition-colors"
            >
              {game ? "Update" : "Add"} Game
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
