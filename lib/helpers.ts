import { Game } from "@/types";

export const getGameDisplayImage = (
  game: Game,
): { type: "thumbnail" | "avatar" | "default"; value: string } => {
  if (game.thumbnail) {
    return { type: "thumbnail", value: game.thumbnail };
  }
  if (game.avatar && game.avatar !== "🎲") {
    return { type: "avatar", value: game.avatar };
  }
  return { type: "avatar", value: "🎲" };
};
