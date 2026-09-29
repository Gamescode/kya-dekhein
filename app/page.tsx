"use client";

import { useEffect, useState } from "react";
import { ContentItem, WatchProviders } from "./catalogue";

const timeOptions = ["60 min", "90 min", "120 min", "180 min"];

const moods = [
  "😂 Fun",
  "😌 Chill",
  "🧠 Interesting",
  "😱 Thrilling",
  "❤️ Feel-good",
  "😈 Horror",
];

const languages = ["Hindi", "English", "Any"];

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

function inferMoods(genreIds: number[]) {
  const result: string[] = [];

  if (genreIds.includes(35) || genreIds.includes(10751)) {
    result.push("Fun");
  }

  if (genreIds.includes(18) || genreIds.includes(36)) {
    result.push("Interesting");
  }

  if (genreIds.includes(28) || genreIds.includes(53)) {
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
  const minimumMinutes = getMinutes(time);
  const selectedMood = getMoodName(mood);

  const maximumMinutes =
    minimumMinutes === 60
      ? 90
      : minimumMinutes === 90
        ? 120
        : minimumMinutes === 120
          ? 180
          : Infinity;

  const scored = items
    .filter(
      (item) =>
        item.runtime >= minimumMinutes &&
        item.runtime < maximumMinutes
    )
    .map((item) => {
      let score = 0;

      if (item.moods.includes(selectedMood)) {
        score += 25;
      }

      if (language === "Any" || item.language === language) {
        score += 10;
      }

      score += item.rating;

      return { item, score };
    });

  scored.sort((a, b) => b.score - a.score);

  return scored.map((result) => result.item);
}

export default function Home() {
  const [time, setTime] = useState("");
  const [mood, setMood] = useState("");
  const [language, setLanguage] = useState("");

  // Free First is currently disabled because it has not been implemented yet.
  // const [freeFirst, setFreeFirst] = useState(true);

  const [recommendations, setRecommendations] = useState<ContentItem[]>([]);
  const [currentRecommendation, setCurrentRecommendation] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasRecommended, setHasRecommended] = useState(false);

  useEffect(() => {
    if (recommendations.length > 0) {
      document.getElementById("recommendation")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [recommendations]);

  const canRecommend = Boolean(time && mood && language);

  async function handleRecommend() {
    setLoading(true);
    setError("");
    setRecommendations([]);
    setCurrentRecommendation(0);
    setHasRecommended(true);

    try {
      const params = new URLSearchParams();

      if (language === "Hindi") {
        params.set("language", "hi");
      } else if (language === "English") {
        params.set("language", "en");
      }

      if (getMoodName(mood) === "Horror") {
        params.set("genre", "27");
      }

      const response = await fetch(`/api/tmdb?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to load movies");
      }

      const data = await response.json();

      // /api/tmdb returns { count, movies }
      const movies = data.movies;

      if (!Array.isArray(movies)) {
        throw new Error("Invalid movie data");
      }

      const detailedItems: ContentItem[] = [];

      for (const movie of movies) {
        try {
          const detailsResponse = await fetch(
            `/api/tmdb?id=${movie.id}`
          );

          if (!detailsResponse.ok) {
            continue;
          }

          const details = await detailsResponse.json();

          if (!details.runtime) {
            continue;
          }

          // The list API returns genreIds.
          // The details API returns genres: [{ id, name }, ...].
          const genreIds =
            movie.genreIds ||
            details.genres?.map(
              (genre: { id: number }) => genre.id
            ) ||
            [];

          // The details API returns "language".
          const itemLanguage = mapLanguage(
            details.language || movie.language
          );

          // Keep language filtering strict when a specific
          // language is selected.
          if (
            language !== "Any" &&
            itemLanguage !== language
          ) {
            continue;
          }

          const watchProviders: WatchProviders =
            details.watchProviders || {
              flatrate: [],
              free: [],
              ads: [],
              rent: [],
              buy: [],
            };

          detailedItems.push({
            id: details.id || movie.id,
            title: details.title || movie.title,
            type: "movie",
            runtime: details.runtime,
            language: itemLanguage,
            moods: inferMoods(genreIds),
            rating: details.rating ?? movie.rating ?? 0,
            url: `https://www.themoviedb.org/movie/${
              details.id || movie.id
            }`,
            description:
              details.description ||
              movie.description ||
              "No description available.",
            releaseDate:
              details.releaseDate ||
              movie.releaseDate ||
              "",
            genreIds,
            posterPath:
              details.posterPath ||
              movie.posterPath ||
              null,
            watchProviders,
            isFree: false,
          });
        } catch {
          // Skip individual movies if their details fail to load.
        }
      }

      const results = getRecommendations(
        detailedItems,
        time,
        mood,
        language
      );

      setRecommendations(results);
    } catch {
      setError(
        "We couldn't load movies right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const currentMovie =
    recommendations[currentRecommendation];

  function handleAnother() {
    if (recommendations.length <= 1) {
      return;
    }

    setCurrentRecommendation((current) =>
      current + 1 >= recommendations.length ? 0 : current + 1
    );
  }

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
            {timeOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTime(option)}
                className={`rounded-2xl border px-4 py-4 text-sm font-medium transition ${
                  time === option
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white hover:border-gray-400"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </section>

        {/* Mood */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">
            What are you in the mood for?
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {moods.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMood(option)}
                className={`rounded-2xl border px-4 py-4 text-sm font-medium transition ${
                  mood === option
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white hover:border-gray-400"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </section>

        {/* Language */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">
            Which language?
          </h2>

          <div className="grid grid-cols-3 gap-3">
            {languages.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setLanguage(option)}
                className={`rounded-2xl border px-4 py-4 text-sm font-medium transition ${
                  language === option
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white hover:border-gray-400"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </section>

        {/* Free First */}
        {/*
        <section className="mb-8">
          <button
            type="button"
            onClick={() => setFreeFirst(!freeFirst)}
          >
            Free first
          </button>
        </section>
        */}

        {/* Recommend */}
        <button
          type="button"
          disabled={!canRecommend || loading}
          onClick={handleRecommend}
          className={`w-full rounded-2xl px-6 py-4 text-lg font-semibold transition ${
            canRecommend && !loading
              ? "bg-black text-white hover:bg-gray-800"
              : "cursor-not-allowed bg-gray-200 text-gray-400"
          }`}
        >
          {loading
            ? "Finding something..."
            : "What should I watch?"}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
            {error}
          </div>
        )}

        {/* No results */}
        {hasRecommended &&
          recommendations.length === 0 &&
          !loading &&
          !error && (
            <div className="mt-10 rounded-3xl border border-gray-200 bg-gray-50 p-6 text-center shadow-sm">
              <p className="text-lg font-medium text-gray-900">
                No good matches found.
              </p>

              <p className="mt-2 text-sm text-gray-600">
                Try changing your time, mood, or language.
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
              {currentMovie.posterPath ? (
                <img
                  src={`https://image.tmdb.org/t/p/w500${currentMovie.posterPath}`}
                  alt={currentMovie.title}
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
                  <span>{currentMovie.runtime} min</span>
                  <span>•</span>
                  <span>{currentMovie.language}</span>

                  {currentMovie.releaseDate && (
                    <>
                      <span>•</span>
                      <span>
                        {currentMovie.releaseDate.slice(0, 4)}
                      </span>
                    </>
                  )}

                  <span>•</span>

                  <span>
                    ⭐ {currentMovie.rating.toFixed(1)}
                  </span>
                </div>

                {currentMovie.description && (
                  <p className="mt-5 leading-7 text-gray-700">
                    {currentMovie.description}
                  </p>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={currentMovie.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl bg-black px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-gray-800"
                  >
                    View on TMDB
                  </a>

                  {recommendations.length > 1 && (
                    <button
                      type="button"
                      onClick={handleAnother}
                      className="rounded-2xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:border-gray-500"
                    >
                      Another
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}