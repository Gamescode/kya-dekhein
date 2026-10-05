export type WatchProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority?: number;
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
  type: "movie";
  runtime: number;
  language: "Hindi" | "English" | "Any";
  moods: string[];
  rating: number;
  isFree: boolean;
  url: string;
  description: string;
  releaseDate: string;
  genreIds: number[];
  posterPath: string | null;
  watchProviders: WatchProviders | null;
};