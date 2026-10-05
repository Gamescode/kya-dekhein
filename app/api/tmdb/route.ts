import { NextResponse } from "next/server";

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(
  url: string,
  retries = 2,
  delay = 500
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
      });

      return response;
    } catch (error) {
      lastError = error;

      console.warn(
        `TMDB request failed (attempt ${attempt + 1
        }/${retries + 1}):`,
        error
      );

      if (attempt < retries) {
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

export async function GET(request: Request) {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "TMDB_API_KEY is missing" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);

  const movieId = searchParams.get("id");
  const genre = searchParams.get("genre");
  const language = searchParams.get("language");
  const minRuntime = searchParams.get("minRuntime");
  const maxRuntime = searchParams.get("maxRuntime");
  const freeOnly =
    searchParams.get("freeOnly") === "true";

  try {
    /*
     * ---------------------------------------------------------
     * MOVIE DETAILS
     * ---------------------------------------------------------
     *
     * Fetch movie details + India watch providers in one request.
     */
    if (movieId) {
      const movieEndpoint =
        `https://api.themoviedb.org/3/movie/` +
        `${encodeURIComponent(movieId)}` +
        `?api_key=${apiKey}` +
        `&language=en-IN` +
        `&append_to_response=watch/providers`;

      const response = await fetchWithRetry(movieEndpoint);

      if (!response.ok) {
        return NextResponse.json(
          {
            error: "TMDB movie details request failed",
          },
          { status: response.status }
        );
      }

      const movie = await response.json();

      const indiaProviders =
        movie["watch/providers"]?.results?.IN ?? null;

      return NextResponse.json({
        id: movie.id,
        title: movie.title,
        description: movie.overview,
        runtime: movie.runtime,
        rating: movie.vote_average,
        language: movie.original_language,
        releaseDate: movie.release_date,
        genres: movie.genres,
        genreIds: (movie.genres ?? []).map(
          (genre: { id: number }) => genre.id
        ),
        posterPath: movie.poster_path,

        /*
         * This contains:
         * - link
         * - flatrate
         * - free
         * - ads
         * - rent
         * - buy
         *
         * for India.
         */
        watchProviders: indiaProviders,
      });
    }

    /*
     * ---------------------------------------------------------
     * MOVIE LIST
     * ---------------------------------------------------------
     */

    const params = new URLSearchParams({
      api_key: apiKey,
      language: "en-IN",
      region: "IN",
      sort_by: "popularity.desc",
      page: "1",
    });

    if (language) {
      params.set("with_original_language", language);
    }

    if (genre) {
      params.set("with_genres", genre);
    }

    if (minRuntime) {
      params.set("with_runtime.gte", minRuntime);
    }

    if (maxRuntime) {
      params.set("with_runtime.lte", maxRuntime);
    }

    /*
     * When Free to watch is enabled:
     *
     * - restrict to India
     * - only movies marked free OR ad-supported by TMDB
     */
    if (freeOnly) {
      params.set("watch_region", "IN");
      params.set(
        "with_watch_monetization_types",
        "free|ads"
      );
    }

    const hasDiscoverFilters =
      Boolean(language) ||
      Boolean(genre) ||
      Boolean(minRuntime) ||
      Boolean(maxRuntime) ||
      freeOnly;

    /*
     * Fetch three pages in parallel.
     *
     * This keeps the existing performance improvement.
     */
    const pages = [1, 2, 3];

    const pageRequests = pages.map(async (page) => {
      const pageParams = new URLSearchParams(params);

      pageParams.set("page", String(page));

      const pageEndpoint = hasDiscoverFilters
        ? `https://api.themoviedb.org/3/discover/movie?${pageParams.toString()}`
        : `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-IN&region=IN&page=${page}`;

      console.log(
        `TMDB page ${page}:`,
        pageEndpoint.replace(apiKey, "HIDDEN")
      );

      try {
        const response =
          await fetchWithRetry(pageEndpoint);

        if (!response.ok) {
          console.warn(
            `TMDB page ${page} request failed`
          );

          return [];
        }

        const data = await response.json();

        if (Array.isArray(data.results)) {
          return data.results;
        }

        return [];
      } catch (error) {
        console.warn(
          `TMDB page ${page} failed:`,
          error
        );

        return [];
      }
    });

    const pageResults =
      await Promise.all(pageRequests);

    const allResults = pageResults.flat();

    const movies = allResults.map((movie) => ({
      id: movie.id,
      title: movie.title,
      description: movie.overview,
      rating: movie.vote_average,
      language: movie.original_language,
      releaseDate: movie.release_date,
      genreIds: movie.genre_ids,
      posterPath: movie.poster_path,
    }));

    return NextResponse.json({
      count: movies.length,
      movies,
    });
  } catch (error) {
    console.error(
      "TMDB API route error:",
      error
    );

    return NextResponse.json(
      {
        error: "TMDB request failed",
        details:
          error instanceof Error
            ? `${error.message}${error.cause
              ? ` — ${String(error.cause)}`
              : ""
            }`
            : String(error),
      },
      { status: 500 }
    );
  }
}