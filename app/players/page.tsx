"use client";

import { useState, useEffect } from "react";
import { IconPlus, IconEdit, IconTrash, IconUsers } from "@tabler/icons-react";
import { Player } from "@/types";
import {
  getPlayers,
  addPlayer,
  updatePlayer,
  deletePlayer,
} from "@/utils/storage";
import { v4 as uuidv4 } from "uuid";
import PlayerForm from "@/components/player-form";
import ConfirmDialog from "@/components/confirm-dialog";

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);

  useEffect(() => {
    setPlayers(getPlayers());
  }, []);

  const handleAddPlayer = (playerData: Omit<Player, "id" | "games">) => {
    const newPlayer: Player = {
      ...playerData,
      id: uuidv4(),
      games: [],
    };
    addPlayer(newPlayer);
    setPlayers(getPlayers());
    setIsFormOpen(false);
  };

  const handleEditPlayer = (playerData: Omit<Player, "id" | "games">) => {
    if (editingPlayer) {
      updatePlayer(editingPlayer.id, playerData);
      setPlayers(getPlayers());
      setEditingPlayer(null);
    }
  };

  const handleDeletePlayer = (player: Player) => {
    deletePlayer(player.id);
    setPlayers(getPlayers());
    setDeletingPlayer(null);
  };

  const getPlayerStats = (player: Player) => {
    const totalSessions = player.games.reduce(
      (total, game) => total + game.sessions.length,
      0,
    );
    return { totalSessions };
  };

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Players</h1>
          <p className="text-neutral-600 mt-2">Manage your player profiles</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-neutral-900 text-white px-4 py-2 rounded-md hover:bg-neutral-800 transition-colors flex items-center space-x-2"
        >
          <IconPlus size={18} />
          <span>Add Player</span>
        </button>
      </div>

      {players.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-neutral-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <IconUsers size={32} className="text-neutral-400" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            No players yet
          </h3>
          <p className="text-neutral-600 mb-6">
            Add your first player to get started
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-neutral-900 text-white px-6 py-3 rounded-md hover:bg-neutral-800 transition-colors"
          >
            Add Your First Player
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => {
            const stats = getPlayerStats(player);
            return (
              <div
                key={player.id}
                className="bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{player.avatar || "👤"}</div>
                    <div>
                      <h3 className="font-semibold text-neutral-900">
                        {player.name}
                      </h3>
                      <p className="text-sm text-neutral-500">
                        {stats.totalSessions} sessions played
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingPlayer(player)}
                      className="text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                      <IconEdit size={18} />
                    </button>
                    <button
                      onClick={() => setDeletingPlayer(player)}
                      className="text-neutral-400 hover:text-red-600 transition-colors"
                    >
                      <IconTrash size={18} />
                    </button>
                  </div>
                </div>

                <div className="text-center pt-4 border-t border-neutral-100">
                  <div className="text-sm text-neutral-600">
                    Games played: {player.games.length}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Player Form Modal */}
      {isFormOpen && (
        <PlayerForm
          onSubmit={handleAddPlayer}
          onClose={() => setIsFormOpen(false)}
        />
      )}

      {/* Edit Player Form Modal */}
      {editingPlayer && (
        <PlayerForm
          player={editingPlayer}
          onSubmit={handleEditPlayer}
          onClose={() => setEditingPlayer(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deletingPlayer && (
        <ConfirmDialog
          title="Delete Player"
          message={`Are you sure you want to delete "${deletingPlayer.name}"? This will also remove all their game history. This action cannot be undone.`}
          confirmText="Delete"
          confirmVariant="danger"
          onConfirm={() => handleDeletePlayer(deletingPlayer)}
          onClose={() => setDeletingPlayer(null)}
        />
      )}
    </div>
  );
}
