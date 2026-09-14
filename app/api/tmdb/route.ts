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

    // Otherwise, return popular movies or movies from a selected genre.
    const endpoint = genre
      ? `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-IN&region=IN&with_genres=${encodeURIComponent(
          genre
        )}&sort_by=popularity.desc&page=1`
      : `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-IN&region=IN&page=1`;

    const response = await fetch(endpoint);

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
            ? `${error.message}${error.cause ? ` — ${String(error.cause)}` : ""}`
            : String(error),
      },
      { status: 500 }
    );
  }
}