"use client";

import { useState } from "react";
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

type TmdbListMovie = {
  id: number;
  title: string;
  description: string;
  rating: number;
  language: string;
  releaseDate: string;
  genreIds: number[];
  posterPath: string | null;
};

function getMinutes(time: string) {
  return Number.parseInt(time, 10);
}

function getMoodName(mood: string) {
  return mood.slice(mood.indexOf(" ") + 1);
}

function mapLanguage(language: string): ContentItem["language"] {
  if (language === "hi") return "Hindi";
  if (language === "en") return "English";
  return "Any";
}

function inferMoods(genreIds: number[]): string[] {
  const inferredMoods: string[] = [];

  // TMDB genre IDs
  const isHorror = genreIds.includes(27);
  const isThrilling = [28, 12, 53, 9648].some((id) =>
    genreIds.includes(id)
  );

  if (isHorror) {
    inferredMoods.push("Horror");
  }

  if (isThrilling) {
    inferredMoods.push("Thrilling");
  }

  if ([35, 16].some((id) => genreIds.includes(id))) {
    inferredMoods.push("Fun");
  }

  if ([99, 36, 878].some((id) => genreIds.includes(id))) {
    inferredMoods.push("Interesting");
  }

  if ([10751, 10749].some((id) => genreIds.includes(id))) {
    inferredMoods.push("Feel-good");
  }

  if (inferredMoods.length === 0) {
    inferredMoods.push("Chill");
  }

  return inferredMoods;
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

      // MOOD
      if (item.moods.includes(selectedMood)) {
        score += 25;
      }

      // LANGUAGE
      if (language === "Any" || item.language === language) {
        score += 10;
      }

      // QUALITY
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
  const [freeFirst, setFreeFirst] = useState(true);

  const [recommendations, setRecommendations] = useState<ContentItem[]>([]);
  const [currentRecommendation, setCurrentRecommendation] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const recommendation = recommendations[currentRecommendation];

  
async function handleRecommend() {
  setLoading(true);
  setError("");
  setRecommendations([]);
  setCurrentRecommendation(0);

  try {
    const selectedMood = getMoodName(mood);

    // Build the movie-list request using the selected language and mood.
    const params = new URLSearchParams();

    if (language === "Hindi") {
      params.set("language", "hi");
    } else if (language === "English") {
      params.set("language", "en");
    }

    if (selectedMood === "Horror") {
      params.set("genre", "27");
    }

    const query = params.toString();
    const listUrl = query ? `/api/tmdb?${query}` : "/api/tmdb";

    const listResponse = await fetch(listUrl);

    if (!listResponse.ok) {
      throw new Error("We couldn't load movies right now. Please try again.");
    }

    const listData: { movies: TmdbListMovie[] } =
      await listResponse.json();

    if (!listData.movies?.length) {
      throw new Error("TMDB did not return any movies for these choices.");
    }

    const detailedMovies: ContentItem[] = [];

    // Fetch movie details sequentially.
    for (const listedMovie of listData.movies) {
      const detailsResponse = await fetch(
        `/api/tmdb?id=${listedMovie.id}`
      );

      if (!detailsResponse.ok) {
        continue;
      }

      const details = await detailsResponse.json();

      if (!details.runtime || details.runtime <= 0) {
        continue;
      }

      const genreIds = (details.genres ?? []).map(
        (genre: { id: number }) => genre.id
      );

      detailedMovies.push({
        id: details.id,
        title: details.title,
        type: "movie",
        runtime: details.runtime,
        language: mapLanguage(details.language),
        moods: inferMoods(genreIds),
        rating: details.rating ?? 0,
        isFree: false,
        url: `https://www.themoviedb.org/movie/${details.id}`,
        description: details.description,
        releaseDate: details.releaseDate,
        genreIds,
        posterPath: details.posterPath ?? listedMovie.posterPath ?? null,
        watchProviders:
          (details.watchProviders as WatchProviders | null) ?? null,
      });
    }

    // Strictly filter by the selected language before ranking.
    const languageFilteredMovies =
      language === "Hindi"
        ? detailedMovies.filter((movie) => movie.language === "Hindi")
        : language === "English"
          ? detailedMovies.filter((movie) => movie.language === "English")
          : detailedMovies;

    if (languageFilteredMovies.length === 0) {
      throw new Error(
        `No ${language} movies found for these choices. Try another mood or time.`
      );
    }

    // Free-first ranking is not applied yet.
    const results = getRecommendations(
      languageFilteredMovies,
      time,
      mood,
      language
    );

    setRecommendations(results);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Something went wrong while loading recommendations."
    );
  } finally {
    setLoading(false);
  }
}

  function handleAnother() {
    if (recommendations.length === 0) return;

    setCurrentRecommendation((current) => {
      return (current + 1) % recommendations.length;
    });
  }

  const canRecommend = Boolean(time && mood && language);

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-gray-900">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Kya Dekhein?</h1>
          <p className="mt-3 text-lg text-gray-600">
            Don&apos;t browse. Just watch.
          </p>
        </div>

        {/* Time */}
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">
            How much time do you have?
          </h2>

          <div className="flex flex-wrap gap-3">
            {timeOptions.map((option) => (
              <button
                key={option}
                onClick={() => setTime(option)}
                className={`rounded-xl border px-5 py-3 font-medium transition ${
                  time === option
                    ? "border-black bg-black text-white"
                    : "border-gray-300 bg-white hover:border-black"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </section>

        {/* Mood */}
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">
            What are you in the mood for?
          </h2>

          <div className="flex flex-wrap gap-3">
            {moods.map((option) => (
              <button
                key={option}
                onClick={() => setMood(option)}
                className={`rounded-xl border px-5 py-3 font-medium transition ${
                  mood === option
                    ? "border-black bg-black text-white"
                    : "border-gray-300 bg-white hover:border-black"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </section>

        {/* Language */}
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Language?</h2>

          <div className="flex flex-wrap gap-3">
            {languages.map((option) => (
              <button
                key={option}
                onClick={() => setLanguage(option)}
                className={`rounded-xl border px-5 py-3 font-medium transition ${
                  language === option
                    ? "border-black bg-black text-white"
                    : "border-gray-300 bg-white hover:border-black"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </section>

        {/* Free first */}
        <section className="mb-8">
          <button
            onClick={() => setFreeFirst(!freeFirst)}
            className="flex items-center gap-3 text-lg font-medium"
            aria-pressed={freeFirst}
          >
            <span
              className={`flex h-6 w-11 items-center rounded-full p-1 transition ${
                freeFirst ? "bg-black" : "bg-gray-300"
              }`}
            >
              <span
                className={`h-4 w-4 rounded-full bg-white transition ${
                  freeFirst ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </span>
            Free first
          </button>

          <p className="mt-2 text-sm text-gray-500">
            Provider availability is now fetched for India, but free-first
            ranking is not applied yet.
          </p>
        </section>

        {/* Recommend */}
        <button
          onClick={handleRecommend}
          disabled={!canRecommend || loading}
          className={`w-full rounded-2xl px-6 py-4 text-lg font-bold transition ${
            canRecommend && !loading
              ? "bg-black text-white hover:bg-gray-800"
              : "cursor-not-allowed bg-gray-200 text-gray-400"
          }`}
        >
          {loading ? "Finding a recommendation..." : "🎲 Kya Dekhein?"}
        </button>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}

        {/* Recommendation */}
        {recommendation && (
          <div className="mt-10 rounded-3xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              We think you should watch
            </p>

            {/* Details and poster: side-by-side on wider screens */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_160px]">
              <div className="min-w-0">
                <h2 className="text-3xl font-bold">
                  {recommendation.title}
                </h2>

                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-white px-3 py-1">
                    {recommendation.runtime} min
                  </span>

                  <span className="rounded-full bg-white px-3 py-1">
                    {recommendation.language}
                  </span>

                  <span className="rounded-full bg-white px-3 py-1">
                    ⭐ {recommendation.rating.toFixed(1)}
                  </span>
                </div>

                {recommendation.description && (
                  <p className="mt-4 text-gray-600">
                    {recommendation.description}
                  </p>
                )}

                <div className="mt-6 rounded-2xl bg-white p-4">
                  <p className="font-semibold">Why this one?</p>

                  <p className="mt-2 text-gray-600">
                    It matches your{" "}
                    <strong>{getMoodName(mood).toLowerCase()}</strong> mood and
                    fits your <strong>{time}</strong> time window.
                    {language !== "Any" && (
                      <>
                        {" "}
                        Its original language is{" "}
                        <strong>{recommendation.language}</strong>.
                      </>
                    )}
                  </p>
                </div>

                <a
                  href={recommendation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 block w-full rounded-2xl bg-black px-6 py-4 text-center font-bold text-white hover:bg-gray-800"
                >
                  ▶ View on TMDB
                </a>

                <button
                  onClick={handleAnother}
                  className="mt-3 w-full rounded-2xl border border-gray-300 bg-white px-6 py-4 font-bold text-gray-900 hover:border-black"
                >
                  🎲 Another one
                </button>
              </div>

              {/* Poster */}
              {recommendation.posterPath ? (
                <img
                  src={`https://image.tmdb.org/t/p/w500${recommendation.posterPath}`}
                  alt={`Poster for ${recommendation.title}`}
                  className="mx-auto h-auto w-full max-w-[160px] self-start rounded-xl object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex min-h-56 items-center justify-center rounded-xl bg-white text-sm text-gray-400">
                  Poster unavailable
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}