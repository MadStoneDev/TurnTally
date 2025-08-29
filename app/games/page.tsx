'use client';

import { useState, useEffect } from 'react';
import {
    IconPlus,
    IconEdit,
    IconTrash,
    IconDeviceGamepad2
} from '@tabler/icons-react';
import { Game } from '@/types';
import { getGames, addGame, updateGame, deleteGame } from '@/utils/storage';
import { v4 as uuidv4 } from 'uuid';
import GameForm from '@/components/game-form';
import ConfirmDialog from '@/components/confirm-dialog';
import {getGameDisplayImage} from "@/lib/helpers";

export default function GamesPage() {
    const [games, setGames] = useState<Game[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingGame, setEditingGame] = useState<Game | null>(null);
    const [deletingGame, setDeletingGame] = useState<Game | null>(null);

    useEffect(() => {
        setGames(getGames());
    }, []);

    const handleAddGame = (gameData: Omit<Game, 'id'>) => {
        const newGame: Game = {
            ...gameData,
            id: uuidv4()
        };
        addGame(newGame);
        setGames(getGames());
        setIsFormOpen(false);
    };

    const handleEditGame = (gameData: Omit<Game, 'id'>) => {
        if (editingGame) {
            updateGame(editingGame.id, gameData);
            setGames(getGames());
            setEditingGame(null);
        }
    };

    const handleDeleteGame = (game: Game) => {
        deleteGame(game.id);
        setGames(getGames());
        setDeletingGame(null);
    };

    return (
        <div className="py-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900">Games</h1>
                    <p className="text-neutral-600 mt-2">
                        Manage your board game collection
                    </p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="bg-neutral-900 text-white px-4 py-2 rounded-md hover:bg-neutral-800 transition-colors flex items-center space-x-2"
                >
                    <IconPlus size={18} />
                    <span>Add Game</span>
                </button>
            </div>

            {games.length === 0 ? (
                <div className="text-center py-12">
                    <div className="bg-neutral-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <IconDeviceGamepad2 size={32} className="text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                        No games yet
                    </h3>
                    <p className="text-neutral-600 mb-6">
                        Add your first board game to get started
                    </p>
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="bg-neutral-900 text-white px-6 py-3 rounded-md hover:bg-neutral-800 transition-colors"
                    >
                        Add Your First Game
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {games.map((game) => (
                        <div
                            key={game.id}
                            className="bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    {(() => {
                                        const displayImage = getGameDisplayImage(game);
                                        return displayImage.type === 'thumbnail' ? (
                                            <img src={displayImage.value} alt={game.title} className="w-10 h-10 object-cover rounded" />
                                        ) : (
                                            <div className="text-2xl">{displayImage.value}</div>
                                        );
                                    })()}
                                    <div>
                                        <h3 className="font-semibold text-neutral-900">
                                            {game.title}
                                        </h3>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setEditingGame(game)}
                                        className="text-neutral-400 hover:text-neutral-600 transition-colors"
                                    >
                                        <IconEdit size={20} />
                                    </button>
                                    <button
                                        onClick={() => setDeletingGame(game)}
                                        className="text-neutral-400 hover:text-red-600 transition-colors"
                                    >
                                        <IconTrash size={20} />
                                    </button>
                                </div>
                            </div>

                            {game.description && (
                                <p className="text-neutral-600 text-sm">
                                    {game.description}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add Game Form Modal */}
            {isFormOpen && (
                <GameForm
                    onSubmit={handleAddGame}
                    onClose={() => setIsFormOpen(false)}
                />
            )}

            {/* Edit Game Form Modal */}
            {editingGame && (
                <GameForm
                    game={editingGame}
                    onSubmit={handleEditGame}
                    onClose={() => setEditingGame(null)}
                />
            )}

            {/* Delete Confirmation */}
            {deletingGame && (
                <ConfirmDialog
                    title="Delete Game"
                    message={`Are you sure you want to delete "${deletingGame.title}"? This action cannot be undone.`}
                    confirmText="Delete"
                    confirmVariant="danger"
                    onConfirm={() => handleDeleteGame(deletingGame)}
                    onClose={() => setDeletingGame(null)}
                />
            )}
        </div>
    );
}