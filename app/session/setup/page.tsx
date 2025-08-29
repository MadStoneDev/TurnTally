// /session/setup
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  IconPlayerPlay,
  IconGripVertical,
  IconDeviceGamepad2,
  IconUsers,
  IconCheck,
  IconPlus, IconTrash,
} from "@tabler/icons-react";
import { Game, Player, Session } from "@/types";
import { getGames, getPlayers, setCurrentSession } from "@/utils/storage";
import { v4 as uuidv4 } from "uuid";
import { getGameDisplayImage } from "@/lib/helpers";

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
      className={`flex items-center space-x-3 p-4 border rounded-lg bg-white ${
        isSelected ? "border-neutral-900 bg-neutral-50" : "border-neutral-200"
      }`}
    >
      <div {...listeners} className="cursor-grab active:cursor-grabbing">
        <IconGripVertical size={20} className="text-neutral-400" />
      </div>
      <div className="text-2xl">{player.avatar || "👤"}</div>
      <div className="flex-1">
        <div className="font-medium text-neutral-900">{player.name}</div>
      </div>
      {isSelected && (
        <div className="text-green-600">
          <IconCheck size={20} />
        </div>
      )}
    </div>
  );
}

export default function SessionSetupPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    const gamesList = getGames();
    const playersList = getPlayers();
    setGames(gamesList);
    setPlayers(playersList);
    setAvailablePlayers(playersList);
  }, []);

  const handlePlayerToggle = (player: Player) => {
    if (selectedPlayers.find((p) => p.id === player.id)) {
      // Remove player
      const newSelected = selectedPlayers.filter((p) => p.id !== player.id);
      setSelectedPlayers(newSelected);
      setAvailablePlayers(
        [...availablePlayers, player].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
    } else {
      // Add player
      setSelectedPlayers([...selectedPlayers, player]);
      setAvailablePlayers(availablePlayers.filter((p) => p.id !== player.id));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      const oldIndex = selectedPlayers.findIndex((p) => p.id === active.id);
      const newIndex = selectedPlayers.findIndex((p) => p.id === over.id);
      setSelectedPlayers(arrayMove(selectedPlayers, oldIndex, newIndex));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedGame) {
      newErrors.game = "Please select a game";
    }

    if (selectedPlayers.length < 2) {
      newErrors.players = "Please select at least 2 players";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStartSession = () => {
    if (validateForm()) {
      const session: Session = {
        id: uuidv4(),
        gameId: selectedGame!.id,
        playerIds: selectedPlayers.map((p) => p.id),
        startTime: Date.now(),
        currentPlayerIndex: 0,
        isActive: false,
        isPaused: false,
      };

      setCurrentSession(session);
      router.push("/session/active");
    }
  };

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">
          Setup New Game Session
        </h1>
        <p className="text-neutral-600 mt-2">
          Choose a game and select players to start timing
        </p>
      </div>

      <div className="space-y-8">
        {/* Game Selection */}
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center">
            <IconDeviceGamepad2 size={24} className="mr-2" />
            Select Game
          </h2>

          {games.length === 0 ? (
            <div className="bg-neutral-100 border border-neutral-200 rounded-lg p-6 text-center">
              <p className="text-neutral-600 mb-4">No games available</p>
              <button
                onClick={() => router.push("/games")}
                className="bg-neutral-900 text-white px-4 py-2 rounded-md hover:bg-neutral-800 transition-colors"
              >
                Add Games
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => setSelectedGame(game)}
                  className={`p-4 relative border rounded-lg text-left transition-all ${
                    selectedGame?.id === game.id
                      ? "border-neutral-900 bg-neutral-100"
                      : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {(() => {
                      const displayImage = getGameDisplayImage(game);
                      return displayImage.type === "thumbnail" ? (
                        <img
                          src={displayImage.value}
                          alt={game.title}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="text-2xl">{displayImage.value}</div>
                      );
                    })()}
                    <div>
                      <div className="font-medium text-neutral-900">
                        {game.title}
                      </div>
                      {game.description && (
                        <div className="text-sm text-neutral-600">
                          {game.description}
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedGame?.id === game.id && (
                    <div className="absolute top-1/2 -translate-y-1/2 right-4 text-green-600 flex justify-end">
                      <IconCheck size={20} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {errors.game && (
            <p className="text-red-600 text-sm mt-2">{errors.game}</p>
          )}
        </div>

        {/* Player Selection */}
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center">
            <IconUsers size={24} className="mr-2" />
            Select Players ({selectedPlayers.length} selected)
          </h2>

          {players.length === 0 ? (
            <div className="bg-neutral-100 border border-neutral-200 rounded-lg p-6 text-center">
              <p className="text-neutral-600 mb-4">No players available</p>
              <button
                onClick={() => router.push("/players")}
                className="bg-neutral-900 text-white px-4 py-2 rounded-md hover:bg-neutral-800 transition-colors"
              >
                Add Players
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Available Players */}
              <div>
                <h3 className="text-lg font-medium text-neutral-900 mb-3">
                  Available Players
                </h3>
                <div className="space-y-2">
                  {availablePlayers.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => handlePlayerToggle(player)}
                      className="group relative w-full flex items-center space-x-3 p-3 border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 transition-colors"
                    >
                      <div className="text-2xl">{player.avatar || "👤"}</div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-neutral-900">
                          {player.name}
                        </div>
                      </div>
                      <div className="group-hover:rotate-180 text-neutral-400 group-hover:text-green-600 transition-all duration-300 ease-in-out">
                        <IconPlus size={20} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Players (Draggable) */}
              <div>
                <h3 className="text-lg font-medium text-neutral-900 mb-3">
                  Selected Players (drag to reorder)
                </h3>
                {selectedPlayers.length === 0 ? (
                  <div className="border-2 border-dashed border-neutral-200 rounded-lg p-6 text-center text-neutral-500">
                    No players selected
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={selectedPlayers}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {selectedPlayers.map((player, index) => (
                          <div key={player.id} className="group ml-8 relative">
                            <div className="absolute -left-8 top-1/2 -translate-y-1/2 bg-neutral-900 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {index + 1}
                            </div>
                            <SortablePlayer player={player} isSelected={true} />
                            <button
                              onClick={() => handlePlayerToggle(player)}
                              className="absolute top-1/2 -translate-y-1/2 right-4 group-hover:right-10 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-600 transition-all duration-300 ease-in-out"
                            >
                              <IconTrash size={20} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>
          )}

          {errors.players && (
            <p className="text-red-600 text-sm mt-2">{errors.players}</p>
          )}
        </div>

        {/* Start Session Button */}
        <div className="flex justify-center pt-6">
          <button
            onClick={handleStartSession}
            disabled={!selectedGame || selectedPlayers.length < 2}
            className={`px-8 py-4 rounded-lg font-semibold text-lg flex items-center space-x-3 transition-colors ${
              selectedGame && selectedPlayers.length >= 2
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
            }`}
          >
            <IconPlayerPlay size={24} />
            <span>Start Game Session</span>
          </button>
        </div>
      </div>
    </div>
  );
}
