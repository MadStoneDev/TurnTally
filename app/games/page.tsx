'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    IconPlus,
    IconEdit,
    IconTrash,
    IconDeviceGamepad2,
    IconArrowsSort,
    IconSortAscending,
    IconSortDescending,
    IconGripVertical
} from '@tabler/icons-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    TouchSensor,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Game } from '@/types';
import { getGames, addGame, updateGame, deleteGame, saveGames } from '@/utils/storage';
import { v4 as uuidv4 } from 'uuid';
import GameForm from '@/components/game-form';
import ConfirmDialog from '@/components/confirm-dialog';
import { getGameDisplayImage } from "@/lib/helpers";

type SortOption = 'order' | 'alphabetical' | 'free';

interface SortableGameCardProps {
    game: Game;
    onEdit: (game: Game) => void;
    onDelete: (game: Game) => void;
    isDragDisabled: boolean;
}

function SortableGameCard({ game, onEdit, onDelete, isDragDisabled }: SortableGameCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: game.id,
        disabled: isDragDisabled
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-md transition-all ${
                isDragging ? 'shadow-lg z-10' : ''
            }`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                    {/* Drag Handle - only show in free sort mode */}
                    {!isDragDisabled && (
                        <button
                            className="text-neutral-400 hover:text-neutral-600 cursor-grab active:cursor-grabbing p-1 -ml-1"
                            {...attributes}
                            {...listeners}
                        >
                            <IconGripVertical size={18} />
                        </button>
                    )}

                    {(() => {
                        const displayImage = getGameDisplayImage(game);
                        return displayImage.type === 'thumbnail' ? (
                            <img
                                src={displayImage.value}
                                alt={game.title}
                                className="w-10 sm:w-12 h-10 sm:h-12 object-cover rounded transition-all duration-300 ease-in-out"
                            />
                        ) : (
                            <div className="text-2xl sm:text-3xl">{displayImage.value}</div>
                        );
                    })()}

                    <div className="flex-1">
                        <h3 className="font-semibold text-neutral-900">
                            {game.title}
                        </h3>
                        {game.description && (
                            <p className="text-neutral-600 text-sm transition-all duration-300 ease-in-out">
                                {game.description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex space-x-2">
                    <button
                        onClick={() => onEdit(game)}
                        className="text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                        <IconEdit size={20} />
                    </button>
                    <button
                        onClick={() => onDelete(game)}
                        className="text-neutral-400 hover:text-red-600 transition-colors"
                    >
                        <IconTrash size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function GamesPage() {
    const [games, setGames] = useState<Game[]>([]);
    const [sortOption, setSortOption] = useState<SortOption>('order');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingGame, setEditingGame] = useState<Game | null>(null);
    const [deletingGame, setDeletingGame] = useState<Game | null>(null);

    // Enhanced sensors with better mobile support
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement before drag starts
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200, // 200ms delay before drag starts on touch
                tolerance: 5, // Allow 5px movement during delay
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        setGames(getGames());
    }, []);

    // Sort games based on current sort option
    const sortedGames = useMemo(() => {
        const gamesCopy = [...games];

        switch (sortOption) {
            case 'alphabetical':
                return gamesCopy.sort((a, b) => a.title.localeCompare(b.title));
            case 'order':
                // Assuming games have a created date or maintain insertion order
                // If you don't have timestamps, this will maintain the current array order
                return gamesCopy;
            case 'free':
                // Return games in their current custom order
                return gamesCopy;
            default:
                return gamesCopy;
        }
    }, [games, sortOption]);

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

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = games.findIndex((game) => game.id === active.id);
            const newIndex = games.findIndex((game) => game.id === over?.id);

            const newGames = arrayMove(games, oldIndex, newIndex);
            setGames(newGames);
            // Save the new order to storage
            saveGames(newGames);
        }
    };

    const getSortIcon = () => {
        switch (sortOption) {
            case 'alphabetical':
                return <IconSortAscending size={18} />;
            case 'order':
                return <IconSortDescending size={18} />;
            case 'free':
                return <IconArrowsSort size={18} />;
            default:
                return <IconArrowsSort size={18} />;
        }
    };

    const getSortLabel = () => {
        switch (sortOption) {
            case 'alphabetical':
                return 'Alphabetical';
            case 'order':
                return 'Order Added';
            case 'free':
                return 'Custom Order';
            default:
                return 'Sort';
        }
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
                <div className="flex items-center space-x-3">
                    {/* Sort Options */}
                    {games.length > 0 && (
                        <div className="relative">
                            <select
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value as SortOption)}
                                className="appearance-none bg-white border border-neutral-300 rounded-md px-4 py-2 pr-8 text-sm hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
                            >
                                <option value="order">Order Added</option>
                                <option value="alphabetical">Alphabetical</option>
                                <option value="free">Custom Order</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-neutral-400">
                                {getSortIcon()}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="bg-neutral-900 text-white px-4 py-2 rounded-md hover:bg-neutral-800 transition-colors flex items-center space-x-2"
                    >
                        <IconPlus size={18} />
                        <span>Add Game</span>
                    </button>
                </div>
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
                <>
                    {sortOption === 'free' && games.length > 1 && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <IconGripVertical size={16} className="inline mr-1" />
                                Drag the grip handles to reorder your games
                            </p>
                        </div>
                    )}

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={sortedGames.map(game => game.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {sortedGames.map((game) => (
                                    <SortableGameCard
                                        key={game.id}
                                        game={game}
                                        onEdit={setEditingGame}
                                        onDelete={setDeletingGame}
                                        isDragDisabled={sortOption !== 'free'}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </>
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