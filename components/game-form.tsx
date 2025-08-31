"use client";

import { useState, useEffect, useCallback } from "react";
import { IconX, IconSearch, IconLoader, IconCheck, IconChevronDown } from "@tabler/icons-react";
import { Game } from "@/types";

interface GameFormProps {
  game?: Game;
  onSubmit: (game: Omit<Game, "id">) => void;
  onClose: () => void;
}

interface BGGSearchResult {
  id: string;
  name: string;
  thumbnail?: string;
  yearPublished?: string;
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
  "🧑‍🌾 ",
  "🧟 ",
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
    thumbnail: game?.thumbnail || "",
    description: game?.description || "",
  });

  const [activeTab, setActiveTab] = useState<'search' | 'emoji'>('search');
  const [searchQuery, setSearchQuery] = useState("");
  const [allSearchResults, setAllSearchResults] = useState<BGGSearchResult[]>([]);
  const [displayedResults, setDisplayedResults] = useState<BGGSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [resultsOffset, setResultsOffset] = useState(0);
  const [selectedGame, setSelectedGame] = useState<BGGSearchResult | null>(null);
  const [showResults, setShowResults] = useState(true);
  const [hasMoreResults, setHasMoreResults] = useState(false);

  const RESULTS_PER_PAGE = 10;

  // Debounced search function
  const debouncedSearch = useCallback(async (query: string) => {
    if (query.length < 3) {
      setAllSearchResults([]);
      setDisplayedResults([]);
      setSelectedGame(null);
      setShowResults(true);
      setResultsOffset(0);
      return;
    }

    setIsSearching(true);
    setShowResults(true);
    try {
      // Use CORS proxy to access BGG API
      const proxyUrl = 'https://api.allorigins.win/raw?url=';

      // Search BGG API
      const searchResponse = await fetch(
          `${proxyUrl}${encodeURIComponent(`https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`)}`
      );
      const searchXml = await searchResponse.text();

      // Parse XML (simple parser for this specific format)
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(searchXml, "text/xml");
      const items = Array.from(xmlDoc.querySelectorAll("item"));

      // Get more results to enable pagination - reduced to avoid URL length issues
      const gameIds = items.slice(0, 30).map(item => item.getAttribute("id")).filter(Boolean);

      if (gameIds.length === 0) {
        setAllSearchResults([]);
        setDisplayedResults([]);
        setHasMoreResults(false);
        setIsSearching(false);
        return;
      }

      // Split into smaller batches to avoid URL length limits
      const batchSize = 15;
      const batches = [];
      for (let i = 0; i < gameIds.length; i += batchSize) {
        batches.push(gameIds.slice(i, i + batchSize));
      }

      let allResults: BGGSearchResult[] = [];

      // Fetch each batch
      for (const batch of batches) {
        try {
          const thingResponse = await fetch(
              `${proxyUrl}${encodeURIComponent(`https://boardgamegeek.com/xmlapi2/thing?id=${batch.join(",")}&type=boardgame`)}`
          );
          const thingXml = await thingResponse.text();
          const thingDoc = parser.parseFromString(thingXml, "text/xml");
          const thingItems = Array.from(thingDoc.querySelectorAll("item"));

          const batchResults: BGGSearchResult[] = thingItems.map(item => {
            const id = item.getAttribute("id") || "";
            const nameElement = item.querySelector('name[type="primary"]');
            const name = nameElement?.getAttribute("value") || "";
            const thumbnailElement = item.querySelector("thumbnail");
            const thumbnail = thumbnailElement?.textContent || undefined;
            const yearElement = item.querySelector("yearpublished");
            const yearPublished = yearElement?.getAttribute("value") || undefined;

            return { id, name, thumbnail, yearPublished };
          }).filter(result => result.name);

          allResults = [...allResults, ...batchResults];
        } catch (batchError) {
          console.warn("BGG batch error:", batchError);
          // Continue with other batches even if one fails
        }
      }

      setAllSearchResults(allResults);
      setDisplayedResults(allResults.slice(0, RESULTS_PER_PAGE));
      setHasMoreResults(allResults.length > RESULTS_PER_PAGE);
      setResultsOffset(0);
    } catch (error) {
      console.error("BGG search error:", error);
      setAllSearchResults([]);
      setDisplayedResults([]);
      setHasMoreResults(false);
    }
    setIsSearching(false);
  }, []);

  // Handle search input with debouncing
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    setSelectedGame(null);
    setShowResults(true);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      debouncedSearch(value);
    }, 300);

    setSearchTimeout(timeout);
  };

  // Load more results
  const loadMoreResults = () => {
    const newOffset = resultsOffset + RESULTS_PER_PAGE;
    const newResults = allSearchResults.slice(0, newOffset + RESULTS_PER_PAGE);
    setDisplayedResults(newResults);
    setResultsOffset(newOffset);
    setHasMoreResults(allSearchResults.length > newOffset + RESULTS_PER_PAGE);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const selectBGGGame = (result: BGGSearchResult) => {
    setFormData({
      ...formData,
      title: result.name,
      thumbnail: result.thumbnail || "",
      description: result.yearPublished ? `Published: ${result.yearPublished}` : ""
    });
    setSelectedGame(result);
    setShowResults(false);
  };

  const validateForm = () => {
    return formData.title.trim().length > 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit({
        title: formData.title.trim(),
        avatar: formData.avatar,
        thumbnail: formData.thumbnail || undefined,
        description: formData.description.trim() || undefined,
      });
    }
  };

  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
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
            {/* Tab Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Game Selection
              </label>
              <div className="flex border-b border-neutral-200 mb-4">
                <button
                    type="button"
                    onClick={() => setActiveTab('search')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'search'
                            ? 'border-neutral-900 text-neutral-900'
                            : 'border-transparent text-neutral-500 hover:text-neutral-700'
                    }`}
                >
                  Search BGG
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('emoji')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'emoji'
                            ? 'border-neutral-900 text-neutral-900'
                            : 'border-transparent text-neutral-500 hover:text-neutral-700'
                    }`}
                >
                  Add Manually
                </button>
              </div>
            </div>

            {/* Search Tab */}
            {activeTab === 'search' && (
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {isSearching ? (
                          <IconLoader size={18} className="text-neutral-400 animate-spin" />
                      ) : (
                          <IconSearch size={18} className="text-neutral-400" />
                      )}
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearchInput(e.target.value)}
                        className="pl-10 w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-500"
                        placeholder="Search BoardGameGeek..."
                    />
                  </div>

                  {/* Selected Game Display */}
                  {selectedGame && (
                      <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            {selectedGame.thumbnail ? (
                                <img
                                    src={selectedGame.thumbnail}
                                    alt={selectedGame.name}
                                    className="w-12 h-12 object-cover rounded"
                                />
                            ) : (
                                <div className="w-12 h-12 bg-neutral-200 rounded flex items-center justify-center text-lg">
                                  🎲
                                </div>
                            )}
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <IconCheck size={12} className="text-white" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-green-900">{selectedGame.name}</div>
                            {selectedGame.yearPublished && (
                                <div className="text-sm text-green-700">Published: {selectedGame.yearPublished}</div>
                            )}
                          </div>
                        </div>
                      </div>
                  )}

                  {/* Show Results Toggle */}
                  {selectedGame && displayedResults.length > 0 && (
                      <button
                          type="button"
                          onClick={() => setShowResults(!showResults)}
                          className="w-full p-2 text-sm text-neutral-600 hover:text-neutral-800 border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors flex items-center justify-center space-x-2"
                      >
                        <span>{showResults ? 'Hide Results' : 'Show Results Again'}</span>
                        <IconChevronDown size={16} className={`transform transition-transform ${showResults ? 'rotate-180' : ''}`} />
                      </button>
                  )}

                  {/* Search Results */}
                  {showResults && displayedResults.length > 0 && (
                      <div className="space-y-2">
                        <div className="max-h-60 overflow-y-auto border border-neutral-200 rounded-md">
                          {displayedResults.map((result) => (
                              <button
                                  key={result.id}
                                  type="button"
                                  onClick={() => selectBGGGame(result)}
                                  className="w-full p-3 text-left hover:bg-neutral-50 border-b border-neutral-100 last:border-b-0 flex items-center space-x-3 transition-colors"
                              >
                                {result.thumbnail ? (
                                    <img
                                        src={result.thumbnail}
                                        alt={result.name}
                                        className="w-12 h-12 object-cover rounded"
                                    />
                                ) : (
                                    <div className="w-12 h-12 bg-neutral-200 rounded flex items-center justify-center text-lg">
                                      🎲
                                    </div>
                                )}
                                <div className="flex-1">
                                  <div className="font-medium text-neutral-900">{result.name}</div>
                                  {result.yearPublished && (
                                      <div className="text-sm text-neutral-500">Published: {result.yearPublished}</div>
                                  )}
                                </div>
                              </button>
                          ))}
                        </div>

                        {/* Load More Button */}
                        {hasMoreResults && (
                            <button
                                type="button"
                                onClick={loadMoreResults}
                                disabled={isSearching}
                                className="w-full p-2 text-sm text-neutral-600 hover:text-neutral-800 border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors disabled:opacity-50"
                            >
                              Load More Results
                            </button>
                        )}
                      </div>
                  )}
                </div>
            )}

            {/* Emoji Tab */}
            {activeTab === 'emoji' && (
                <div className="pr-3 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-[200px] overflow-y-auto">
                  {gameEmojis.map((emoji) => (
                      <button
                          key={emoji}
                          type="button"
                          onClick={() => setFormData({ ...formData, avatar: emoji })}
                          className={`p-2 grid place-content-center rounded-md border-2 text-2xl transition-all duration-300 ease-in-out ${
                              formData.avatar === emoji
                                  ? "border-neutral-900 bg-neutral-100"
                                  : "border-neutral-200 hover:border-neutral-300"
                          }`}
                      >
                        {emoji}
                      </button>
                  ))}
                </div>
            )}

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
                Description (Optional)
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