export type WatchProvider = {
  provider_id: number;
  provider_name: string;
};

export type WatchProviders = {
  link?: string;
  flatrate?: WatchProvider[];
  free?: WatchProvider[];
  ads?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
};

export type ContentItem = {
  id: number;
  title: string;
  type: "movie" | "episode" | "youtube" | "documentary" | "standup";
  runtime: number;
  language: "Hindi" | "English" | "Any";
  moods: string[];
  rating: number;
  isFree: boolean;
  url: string;
  description?: string;
  releaseDate?: string;
  genreIds?: number[];
  posterPath?: string | null;
  watchProviders?: WatchProviders | null;
};

export const catalogue: ContentItem[] = [];