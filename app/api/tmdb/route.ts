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
        `TMDB request failed (attempt ${attempt + 1}/${retries + 1}):`,
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

  try {
    // ------------------------------------------------------------
    // MOVIE DETAILS
    // ------------------------------------------------------------
    if (movieId) {
      const movieEndpoint = `https://api.themoviedb.org/3/movie/${encodeURIComponent(
        movieId
      )}?api_key=${apiKey}&language=en-IN`;

      const response = await fetchWithRetry(movieEndpoint);

      if (!response.ok) {
        return NextResponse.json(
          { error: "TMDB movie details request failed" },
          { status: response.status }
        );
      }

      const movie = await response.json();

      // Get watch-provider information for India.
      const providersEndpoint = `https://api.themoviedb.org/3/movie/${encodeURIComponent(
        movieId
      )}/watch/providers?api_key=${apiKey}`;

      let indiaProviders = null;

      try {
        const providersResponse = await fetchWithRetry(providersEndpoint);

        if (providersResponse.ok) {
          const providersData = await providersResponse.json();
          indiaProviders = providersData.results?.IN ?? null;
        }
      } catch (error) {
        // Watch-provider information is optional.
        // Don't fail the whole movie request if this call fails.
        console.warn(
          `TMDB watch providers request failed for movie ${movieId}:`,
          error
        );
      }

      return NextResponse.json({
        id: movie.id,
        title: movie.title,
        description: movie.overview,
        runtime: movie.runtime,
        rating: movie.vote_average,
        language: movie.original_language,
        releaseDate: movie.release_date,
        genres: movie.genres,
        watchProviders: indiaProviders,
      });
    }

    // ------------------------------------------------------------
    // MOVIE LIST
    // ------------------------------------------------------------

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

    // Use discover when filtering by language or genre.
    // Use popular for the unfiltered "Any" case.
    const endpoint =
      language || genre
        ? `https://api.themoviedb.org/3/discover/movie?${params.toString()}`
        : `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-IN&region=IN&page=1`;

    console.log(
      "TMDB endpoint:",
      endpoint.replace(apiKey, "HIDDEN")
    );

    const response = await fetchWithRetry(endpoint);

    if (!response.ok) {
      return NextResponse.json(
        { error: "TMDB movie list request failed" },
        { status: response.status }
      );
    }

    const data = await response.json();

    const movies = data.results.map(
      (movie: {
        id: number;
        title: string;
        overview: string;
        vote_average: number;
        original_language: string;
        release_date: string;
        genre_ids: number[];
        poster_path: string | null;
      }) => ({
        id: movie.id,
        title: movie.title,
        description: movie.overview,
        rating: movie.vote_average,
        language: movie.original_language,
        releaseDate: movie.release_date,
        genreIds: movie.genre_ids,
        posterPath: movie.poster_path,
      })
    );

    return NextResponse.json({
      count: movies.length,
      movies,
    });
  } catch (error) {
    console.error("TMDB API route error:", error);

    return NextResponse.json(
      {
        error: "TMDB request failed",
        details:
          error instanceof Error
            ? `${error.message}${
                error.cause ? ` — ${String(error.cause)}` : ""
              }`
            : String(error),
      },
      { status: 500 }
    );
  }
}