"use client";

import { useEffect, useState } from "react";
import {
  ContentItem,
  WatchProvider,
  WatchProviders,
} from "./catalogue";

const timeOptions = [
  "60 min",
  "90 min",
  "120 min",
  "180 min",
];

const moods = [
  "😂 Fun",
  "😌 Chill",
  "🧠 Interesting",
  "😱 Thrilling",
  "❤️ Feel-good",
  "😈 Horror",
];

const languages = [
  "Hindi",
  "English",
  "Any",
];

const eraOptions = [
  { value: "recent", label: "Recent (2020+)" },
  { value: "2000s-2010s", label: "2000s–2010s" },
  { value: "before-2000", label: "Before 2000" },
  { value: "any", label: "Any year" },
];

function matchesEra(releaseDate: string, era: string) {
  // Unknown release dates are excluded unless the user selects Any year.
  if (era === "any") return true;

  const year = Number.parseInt(releaseDate?.slice(0, 4) ?? "", 10);
  if (!Number.isFinite(year) || year < 1800) return false;

  if (era === "recent") return year >= 2020;
  if (era === "2000s-2010s") return year >= 2000 && year <= 2019;
  if (era === "before-2000") return year < 2000;

  return true;
}

function getMinutes(time: string) {
  return Number.parseInt(time, 10);
}

function getMoodName(mood: string) {
  return mood.replace(/^[^\w]+ /, "").trim();
}

function mapLanguage(languageCode: string) {
  if (languageCode === "hi") return "Hindi";
  if (languageCode === "en") return "English";

  return "Any";
}

function getRuntimeBracket(time: string) {
  const minutes = getMinutes(time);

  if (minutes === 60) {
    return {
      min: 0,
      max: 60,
    };
  }

  if (minutes === 90) {
    return {
      min: 61,
      max: 90,
    };
  }

  if (minutes === 120) {
    return {
      min: 91,
      max: 120,
    };
  }

  return {
    min: 121,
    max: 180,
  };
}

function inferMoods(genreIds: number[]) {
  const result: string[] = [];

  if (
    genreIds.includes(35) ||
    genreIds.includes(10751)
  ) {
    result.push("Fun");
  }

  if (
    genreIds.includes(18) ||
    genreIds.includes(36)
  ) {
    result.push("Interesting");
  }

  if (
    genreIds.includes(28) ||
    genreIds.includes(53)
  ) {
    result.push("Thrilling");
  }

  if (genreIds.includes(27)) {
    result.push("Horror");
  }

  if (
    genreIds.includes(10749) ||
    genreIds.includes(10751) ||
    genreIds.includes(35)
  ) {
    result.push("Feel-good");
  }

  if (
    genreIds.includes(99) ||
    genreIds.includes(10402) ||
    genreIds.includes(16)
  ) {
    result.push("Chill");
  }

  return result;
}

function getRecommendations(
  items: ContentItem[],
  time: string,
  mood: string,
  language: string
): ContentItem[] {
  const bracket = getRuntimeBracket(time);
  const selectedMood = getMoodName(mood);

  const scored = items
    .filter(
      (item) =>
        item.runtime >= bracket.min &&
        item.runtime <= bracket.max
    )
    .map((item) => {
      let score = 0;

      if (item.moods.includes(selectedMood)) {
        score += 25;
      }

      if (
        language === "Any" ||
        item.language === language
      ) {
        score += 10;
      }

      score += item.rating;

      return {
        item,
        score,
      };
    });

  scored.sort(
    (a, b) => b.score - a.score
  );

  return scored.map(
    (result) => result.item
  );
}

/*
 * Build a YouTube search rather than claiming a specific
 * video is the official/full movie.
 */
function getYouTubeSearchUrl(title: string) {
  const query = `${title} full movie`;

  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    query
  )}`;
}

/*
 * Combine all free/ad-supported providers without duplicates.
 */
function getFreeProviders(
  watchProviders: WatchProviders | null
): WatchProvider[] {
  if (!watchProviders) {
    return [];
  }

  const providers = [
    ...(watchProviders.free ?? []),
    ...(watchProviders.ads ?? []),
  ];

  const unique = new Map<number, WatchProvider>();

  for (const provider of providers) {
    unique.set(
      provider.provider_id,
      provider
    );
  }

  return Array.from(unique.values());
}

function getAllProviders(
  watchProviders: WatchProviders | null
): WatchProvider[] {
  if (!watchProviders) {
    return [];
  }

  const providers = [
    ...(watchProviders.flatrate ?? []),
    ...(watchProviders.free ?? []),
    ...(watchProviders.ads ?? []),
    ...(watchProviders.rent ?? []),
    ...(watchProviders.buy ?? []),
  ];

  const unique = new Map<number, WatchProvider>();

  for (const provider of providers) {
    unique.set(
      provider.provider_id,
      provider
    );
  }

  return Array.from(unique.values());
}

export default function Home() {
  const [time, setTime] = useState("");
  const [mood, setMood] = useState("");
  const [language, setLanguage] =
    useState("");
  const [era, setEra] = useState("recent");
  const [eraOpen, setEraOpen] = useState(false);

  const [freeOnly, setFreeOnly] =
    useState(false);

  const [recommendations, setRecommendations] =
    useState<ContentItem[]>([]);

  const [currentRecommendation, setCurrentRecommendation] =
    useState(0);

  const [loading, setLoading] =
    useState(false);

  const [loadingMessage, setLoadingMessage] =
    useState(
      "Finding something good..."
    );

  const [error, setError] =
    useState("");

  const [hasRecommended, setHasRecommended] =
    useState(false);

  /*
   * Automatically scroll to the recommendation.
   */
  useEffect(() => {
    if (recommendations.length > 0) {
      document
        .getElementById("recommendation")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }
  }, [recommendations]);

  /*
   * Loading messages.
   */
  useEffect(() => {
    if (!loading) {
      setLoadingMessage(
        "Finding something good..."
      );

      return;
    }

    const messages = [
      "Finding something good...",
      "Looking through the movies...",
      "Matching your mood...",
      "Checking the runtime...",
      "Almost there...",
    ];

    let index = 0;

    const interval = setInterval(() => {
      index =
        (index + 1) %
        messages.length;

      setLoadingMessage(
        messages[index]
      );
    }, 1800);

    return () =>
      clearInterval(interval);
  }, [loading]);

  const canRecommend = Boolean(
    time &&
    mood &&
    language
  );

  async function handleRecommend() {
    setLoading(true);
    setError("");
    setRecommendations([]);
    setCurrentRecommendation(0);
    setHasRecommended(true);

    try {
      const bracket =
        getRuntimeBracket(time);

      const params =
        new URLSearchParams();

      /*
       * Language filter.
       */
      if (language === "Hindi") {
        params.set(
          "language",
          "hi"
        );
      } else if (
        language === "English"
      ) {
        params.set(
          "language",
          "en"
        );
      }

      /*
       * Movie era filter. The API applies this directly
       * to TMDB Discover, and we verify it client-side too.
       */
      params.set("era", era);

      /*
       * Horror uses TMDB's Horror genre.
       */
      if (
        getMoodName(mood) ===
        "Horror"
      ) {
        params.set(
          "genre",
          "27"
        );
      }

      /*
       * Strict runtime filtering happens
       * at the TMDB Discover level as well.
       */
      params.set(
        "minRuntime",
        String(bracket.min)
      );

      params.set(
        "maxRuntime",
        String(bracket.max)
      );

      /*
       * Free mode asks TMDB only for movies
       * with free/ad-supported availability
       * in India.
       */
      if (freeOnly) {
        params.set(
          "freeOnly",
          "true"
        );
      }

      const response =
        await fetch(
          `/api/tmdb?${params.toString()}`
        );

      if (!response.ok) {
        throw new Error(
          "Failed to load movies"
        );
      }

      const data =
        await response.json();

      const movies =
        Array.isArray(data)
          ? data
          : data.movies;

      if (!Array.isArray(movies)) {
        throw new Error(
          "Invalid movie data"
        );
      }

      const detailedItems: ContentItem[] =
        [];

      /*
       * Keep the existing batching optimization.
       */
      const BATCH_SIZE = 10;

      for (
        let i = 0;
        i < movies.length;
        i += BATCH_SIZE
      ) {
        const batch =
          movies.slice(
            i,
            i + BATCH_SIZE
          );

        const batchResults =
          await Promise.all(
            batch.map(
              async (movie) => {
                try {
                  const detailsResponse =
                    await fetch(
                      `/api/tmdb?id=${movie.id}`
                    );

                  if (
                    !detailsResponse.ok
                  ) {
                    return null;
                  }

                  const details =
                    await detailsResponse.json();

                  if (
                    !details.runtime
                  ) {
                    return null;
                  }

                  const releaseDate =
                    details.releaseDate ||
                    details.release_date ||
                    movie.release_date ||
                    "";

                  if (!matchesEra(releaseDate, era)) {
                    return null;
                  }

                  const genreIds =
                    details.genreIds ||
                    details.genre_ids ||
                    movie.genre_ids ||
                    [];

                  const itemLanguage =
                    mapLanguage(
                      details.language ||
                      details.original_language ||
                      movie.original_language
                    );

                  /*
                   * Keep language filtering strict.
                   */
                  if (
                    language !== "Any" &&
                    itemLanguage !==
                    language
                  ) {
                    return null;
                  }

                  /*
                   * Keep runtime filtering strict
                   * even though Discover already
                   * filtered it.
                   */
                  if (
                    details.runtime <
                    bracket.min ||
                    details.runtime >
                    bracket.max
                  ) {
                    return null;
                  }

                  const watchProviders: WatchProviders | null =
                    details.watchProviders ??
                    null;

                  /*
                   * In free mode, do one additional
                   * client-side safety check.
                   *
                   * This protects us if provider data
                   * changes between Discover and details.
                   */
                  if (freeOnly) {
                    const freeProviders =
                      getFreeProviders(
                        watchProviders
                      );

                    if (
                      freeProviders.length ===
                      0
                    ) {
                      return null;
                    }
                  }

                  return {
                    id:
                      details.id ||
                      movie.id,

                    title:
                      details.title ||
                      movie.title,

                    type: "movie",

                    runtime:
                      details.runtime,

                    language:
                      itemLanguage,

                    moods:
                      inferMoods(
                        genreIds
                      ),

                    rating:
                      details.rating ??
                      details.vote_average ??
                      movie.vote_average ??
                      0,

                    url:
                      `https://www.themoviedb.org/movie/` +
                      `${details.id ||
                      movie.id
                      }`,

                    description:
                      details.description ||
                      details.overview ||
                      movie.overview ||
                      "No description available.",

                    releaseDate,

                    genreIds,

                    posterPath:
                      details.posterPath ||
                      details.poster_path ||
                      movie.poster_path ||
                      null,

                    watchProviders,

                    isFree:
                      getFreeProviders(
                        watchProviders
                      ).length > 0,
                  } as ContentItem;
                } catch {
                  return null;
                }
              }
            )
          );

        for (
          const item of batchResults
        ) {
          if (item) {
            detailedItems.push(
              item
            );
          }
        }
      }

      const results =
        getRecommendations(
          detailedItems,
          time,
          mood,
          language
        );

      setRecommendations(
        results
      );
    } catch {
      setError(
        "We couldn't load movies right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const currentMovie =
    recommendations[
    currentRecommendation
    ];

  function handleAnother() {
    if (
      recommendations.length <= 1
    ) {
      return;
    }

    setCurrentRecommendation(
      (current) =>
        current + 1 >=
          recommendations.length
          ? 0
          : current + 1
    );
  }

  /*
   * Providers for the current movie.
   */
  const freeProviders =
    currentMovie
      ? getFreeProviders(
        currentMovie.watchProviders
      )
      : [];

  const allProviders =
    currentMovie
      ? getAllProviders(
        currentMovie.watchProviders
      )
      : [];

  /*
   * Is YouTube actually listed by TMDB
   * as one of the providers?
   */
  const youtubeProvider =
    freeProviders.find(
      (provider) =>
        provider.provider_name
          .toLowerCase()
          .includes("youtube")
    );

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-4xl px-6 py-12">

        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Kya Dekhein?
          </h1>

          <p className="mt-4 text-lg text-gray-600">
            Don&apos;t browse. Just watch.
          </p>
        </header>

        {/* Time */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">
            How much time do you have?
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {timeOptions.map(
              (option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setTime(option)
                  }
                  className={`rounded-2xl border px-4 py-4 text-sm font-medium transition ${time === option
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white hover:border-gray-400"
                    }`}
                >
                  {option}
                </button>
              )
            )}
          </div>
        </section>

        {/* Mood */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">
            What are you in the mood for?
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {moods.map(
              (option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setMood(option)
                  }
                  className={`rounded-2xl border px-4 py-4 text-sm font-medium transition ${mood === option
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white hover:border-gray-400"
                    }`}
                >
                  {option}
                </button>
              )
            )}
          </div>
        </section>

        {/* Language */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">
            Which language?
          </h2>

          <div className="grid grid-cols-3 gap-3">
            {languages.map(
              (option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setLanguage(
                      option
                    )
                  }
                  className={`rounded-2xl border px-4 py-4 text-sm font-medium transition ${language === option
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white hover:border-gray-400"
                    }`}
                >
                  {option}
                </button>
              )
            )}
          </div>
        </section>

        {/* Movie era: custom selector styled to match the rest of the app */}
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Movie era</h2>
          <div className="relative">
            <button
              id="movie-era"
              type="button"
              aria-haspopup="listbox"
              aria-expanded={eraOpen}
              aria-controls="movie-era-options"
              onClick={() => setEraOpen((open) => !open)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setEraOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left text-sm font-medium text-gray-900 transition hover:border-gray-400 focus:border-black focus:outline-none"
            >
              <span>{eraOptions.find((option) => option.value === era)?.label ?? "Recent (2020+)"}</span>
              <svg
                aria-hidden="true"
                className={`ml-3 h-5 w-5 shrink-0 transition-transform ${eraOpen ? "rotate-180" : ""}`}
                viewBox="0 0 20 20"
                fill="none"
              >
                <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {eraOpen && (
              <div
                id="movie-era-options"
                role="listbox"
                aria-label="Choose movie era"
                className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-xl"
              >
                {eraOptions.map((option) => {
                  const selected = era === option.value;
                  const descriptions: Record<string, string> = {
                    recent: "Newer releases",
                    "2000s-2010s": "Movies from 2000–2019",
                    "before-2000": "Classic movies",
                    any: "No release-year restriction",
                  };

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setEra(option.value);
                        setEraOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition ${selected ? "bg-black text-white" : "text-gray-900 hover:bg-gray-100"}`}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{option.label}</span>
                        <span className={`mt-0.5 block text-xs ${selected ? "text-gray-300" : "text-gray-500"}`}>
                          {descriptions[option.value]}
                        </span>
                      </span>
                      {selected && (
                        <svg aria-hidden="true" className="ml-3 h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="none">
                          <path d="m4.5 10 3.5 3.5 7.5-7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Free to watch */}
        <section className="mb-8">
          <button
            type="button"
            onClick={() =>
              setFreeOnly(
                (current) =>
                  !current
              )
            }
            className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-gray-400"
            aria-pressed={freeOnly}
          >
            <div>
              <p className="font-semibold text-gray-900">
                🆓 Free to watch
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Only show movies listed as free or ad-supported in India.
              </p>
            </div>

            <span
              className={`ml-4 flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${freeOnly
                ? "bg-black"
                : "bg-gray-300"
                }`}
            >
              <span
                className={`h-5 w-5 rounded-full bg-white transition ${freeOnly
                  ? "translate-x-5"
                  : "translate-x-0"
                  }`}
              />
            </span>
          </button>
        </section>

        {/* Recommend */}
        <button
          type="button"
          disabled={
            !canRecommend ||
            loading
          }
          onClick={
            handleRecommend
          }
          className={`w-full rounded-2xl px-6 py-4 text-lg font-semibold transition ${canRecommend &&
            !loading
            ? "bg-black text-white hover:bg-gray-800"
            : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <span className="inline-block animate-bounce text-2xl">
                🎬
              </span>

              <span>
                {loadingMessage}
              </span>
            </span>
          ) : (
            "🎲 Kya Dekhein?"
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
            {error}
          </div>
        )}

        {/* No results */}
        {hasRecommended &&
          recommendations.length ===
          0 &&
          !loading &&
          !error && (
            <div className="mt-10 rounded-3xl border border-gray-200 bg-gray-50 p-6 text-center shadow-sm">
              <p className="text-lg font-medium text-gray-900">
                {freeOnly
                  ? "No free matches found."
                  : "No good matches found."}
              </p>

              <p className="mt-2 text-sm text-gray-600">
                {freeOnly
                  ? 'Try turning off "Free to watch" or change your time, mood, or language.'
                  : "Try changing your time, mood, or language."}
              </p>
            </div>
          )}

        {/* Recommendation */}
        {currentMovie && (
          <div
            id="recommendation"
            className="mt-10 scroll-mt-6 rounded-3xl border border-gray-200 bg-gray-50 p-6 shadow-sm"
          >
            <p className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-500">
              We think you should watch
            </p>

            <div className="grid gap-6 sm:grid-cols-[180px_1fr]">

              {/* Poster */}
              {currentMovie.posterPath ? (
                <img
                  src={`https://image.tmdb.org/t/p/w500${currentMovie.posterPath}`}
                  alt={
                    currentMovie.title
                  }
                  className="mx-auto w-full max-w-[180px] rounded-2xl object-cover shadow-sm"
                />
              ) : (
                <div className="flex aspect-[2/3] w-full max-w-[180px] items-center justify-center rounded-2xl bg-gray-200 text-center text-sm text-gray-500">
                  No poster
                </div>
              )}

              <div>
                <h2 className="text-3xl font-bold">
                  {currentMovie.title}
                </h2>

                <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-600">
                  <span>
                    {currentMovie.runtime} min
                  </span>

                  <span>•</span>

                  <span>
                    {currentMovie.language}
                  </span>

                  {currentMovie.releaseDate && (
                    <>
                      <span>•</span>

                      <span>
                        {currentMovie.releaseDate.slice(
                          0,
                          4
                        )}
                      </span>
                    </>
                  )}

                  <span>•</span>

                  <span>
                    ⭐{" "}
                    {currentMovie.rating.toFixed(
                      1
                    )}
                  </span>
                </div>

                {currentMovie.description && (
                  <p className="mt-5 leading-7 text-gray-700">
                    {
                      currentMovie.description
                    }
                  </p>
                )}

                {/* Watch options */}
                {(freeProviders.length > 0 ||
                  allProviders.length > 0 ||
                  currentMovie.watchProviders?.link) && (
                    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4">
                      <p className="font-semibold text-gray-900">
                        Where can I watch?
                      </p>

                      {freeProviders.length > 0 ? (
                        <>
                          <p className="mt-1 text-sm text-gray-500">
                            Free or ad-supported options in India
                          </p>

                          <div className="mt-4 flex flex-col gap-2">
                            {freeProviders.map((provider) => {
                              const isYouTube =
                                provider.provider_name
                                  .toLowerCase()
                                  .includes("youtube");

                              const href = isYouTube
                                ? getYouTubeSearchUrl(
                                  currentMovie.title
                                )
                                : currentMovie.watchProviders?.link;

                              if (!href) {
                                return null;
                              }

                              return (
                                <a
                                  key={provider.provider_id}
                                  href={href}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-gray-400 hover:bg-gray-50"
                                >
                                  {isYouTube
                                    ? `▶ Find ${currentMovie.title} on YouTube`
                                    : `▶ Watch on ${provider.provider_name}`}
                                </a>
                              );
                            })}
                          </div>
                        </>
                      ) : allProviders.length > 0 ? (
                        <>
                          <p className="mt-1 text-sm text-gray-500">
                            Available streaming and rental options in India
                          </p>

                          <div className="mt-4 flex flex-col gap-2">
                            {allProviders.slice(0, 4).map((provider) => {
                              const isYouTube =
                                provider.provider_name
                                  .toLowerCase()
                                  .includes("youtube");

                              const href = isYouTube
                                ? getYouTubeSearchUrl(
                                  currentMovie.title
                                )
                                : currentMovie.watchProviders?.link;

                              if (!href) {
                                return null;
                              }

                              return (
                                <a
                                  key={provider.provider_id}
                                  href={href}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-gray-400 hover:bg-gray-50"
                                >
                                  {isYouTube
                                    ? `▶ Find ${currentMovie.title} on YouTube`
                                    : `▶ Watch on ${provider.provider_name}`}
                                </a>
                              );
                            })}
                          </div>
                        </>
                      ) : null}

                      {currentMovie.watchProviders?.link && (
                        <a
                          href={currentMovie.watchProviders.link}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 block text-center text-sm font-medium text-gray-600 underline underline-offset-2 hover:text-gray-900"
                        >
                          View all watch options
                        </a>
                      )}
                    </div>
                  )}

                {/* TMDB */}
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={
                      currentMovie.url
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border border-gray-300 bg-white px-5 py-3 text-center text-sm font-semibold text-gray-900 transition hover:border-gray-500"
                  >
                    View on TMDB
                  </a>

                  {recommendations.length >
                    1 && (
                      <button
                        type="button"
                        onClick={
                          handleAnother
                        }
                        className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                      >
                        Another
                      </button>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attribution */}
        <footer className="mt-12 border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
          <p>
            Movie information and images provided by TMDB.
          </p>

          <p className="mt-1">
            Watch-provider availability is powered by JustWatch data.
          </p>

          <nav
            aria-label="Footer navigation"
            className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm text-gray-500"
          >
            <a href="/about" className="hover:text-gray-900">About</a>
            <a href="/contact" className="hover:text-gray-900">Contact</a>
            <a href="/privacy" className="hover:text-gray-900">Privacy Policy</a>
            <a href="/terms" className="hover:text-gray-900">Terms of Use</a>
          </nav>
        </footer>
      </div>
    </main>
  );
}