
import { NextResponse } from "next/server";

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
    // If an ID is provided, return details for one movie.
    if (movieId) {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${encodeURIComponent(
          movieId
        )}?api_key=${apiKey}&language=en-IN`
      );

      if (!response.ok) {
        return NextResponse.json(
          { error: "TMDB movie details request failed" },
          { status: response.status }
        );
      }

      const movie = await response.json();

      // Get watch-provider information for India.
      const providersResponse = await fetch(
        `https://api.themoviedb.org/3/movie/${encodeURIComponent(
          movieId
        )}/watch/providers?api_key=${apiKey}`
      );

      let indiaProviders = null;

      if (providersResponse.ok) {
        const providersData = await providersResponse.json();
        indiaProviders = providersData.results?.IN ?? null;
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

    // Build a discover request when a language or genre is selected.
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

    // Keep the existing popular-movies endpoint for the unfiltered "Any" case.
    const endpoint =
      language || genre
        ? `https://api.themoviedb.org/3/discover/movie?${params.toString()}`
        : `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-IN&region=IN&page=1`;

    let response: Response;

try {
  response = await fetch(endpoint);
} catch (firstError) {
  console.warn("TMDB request failed. Retrying once...", firstError);

  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    response = await fetch(endpoint);
  } catch (secondError) {
    console.error("TMDB request failed after retry:", secondError);

    return NextResponse.json(
      {
        error: "TMDB is temporarily unavailable. Please try again.",
      },
      { status: 503 }
    );
  }
}

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