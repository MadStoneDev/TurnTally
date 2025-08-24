"use client";

import { useState } from "react";
import { IconX } from "@tabler/icons-react";
import { Player } from "@/types";

interface PlayerFormProps {
  player?: Player;
  onSubmit: (player: Omit<Player, "id" | "games">) => void;
  onClose: () => void;
}

const playerAvatars = [
  "👤",
  "👨",
  "👩",
  "🧔🏻‍♂️",
  "‍👱🏻‍♀️️",
  "🧑",
  "👨‍💼",
  "👩‍💼",
  "👨‍🎓",
  "👩‍🎓",
  "👨‍💻",
  "👩‍💻",
  "👨‍🎨",
  "👩‍🎨",
  "🧙‍♂️",
  "🧙‍♀️",
    "🫅🏼",
    "🫅🏻",
  "👸🏼",
  "🤴🏼",
  "🤴🏻",
  "👸🏻",
  "🤖",
];

export default function PlayerForm({
  player,
  onSubmit,
  onClose,
}: PlayerFormProps) {
  const [formData, setFormData] = useState({
    name: player?.name || "",
    avatar: player?.avatar || "👤",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Player name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit({
        name: formData.name.trim(),
        avatar: formData.avatar,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-neutral-900">
            {player ? "Edit Player" : "Add New Player"}
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
              Player Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-500 ${
                errors.name ? "border-red-300" : "border-neutral-300"
              }`}
              placeholder="Enter player name"
            />
            {errors.name && (
              <p className="text-red-600 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Avatar
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-[200px] overflow-y-auto">
              {playerAvatars.map((emoji) => (
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
              {player ? "Update" : "Add"} Player
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
