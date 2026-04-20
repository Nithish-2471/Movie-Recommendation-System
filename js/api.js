import { API_KEY, BASE_URL } from "./config.js";

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export async function getMoviesByGenres(genreIds, sortBy = "popularity.desc") {
  const today = getTodayDate();
  const url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreIds}&sort_by=${sortBy}&primary_release_date.lte=${today}&include_adult=false`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

export async function getNowPlayingMovies() {
  const url = `${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=en-US&page=1`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.results || []).sort(
    (a, b) => new Date(b.release_date) - new Date(a.release_date),
  );
}

export async function getPopularMovies() {
  const url = `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

export async function getTopRatedMovies() {
  const url = `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=en-US&page=1`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

export async function getMovieDetails(movieId) {
  const url = `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits,videos,recommendations`;
  const res = await fetch(url);
  return res.json();
}

// export async function searchMovies(query) {
//   const url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;
//   const res = await fetch(url);
//   const data = await res.json();
//   return data.results || [];
// }

// export async function searchPeople(query) {
//   const url = `${BASE_URL}/search/person?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;
//   const res = await fetch(url);
//   const data = await res.json();
//   return data.results || [];
// }

export async function getMoviesByCast(castId) {
  const url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_cast=${castId}&sort_by=popularity.desc`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

export function getImage(path, size = "w500") {
  if (!path)
    return "https://via.placeholder.com/500x750/1a1a1a/ffffff?text=No+Image";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

// Add these functions to api.js

export async function searchMovies(query) {
  const url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

export async function searchPeople(query) {
  const url = `${BASE_URL}/search/person?api_key=${API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

// Discover movies by original language (e.g., "fr", "es")
export async function getMoviesByLanguage(languageCode) {
  const today = getTodayDate();
  const url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=${languageCode}&sort_by=popularity.desc&primary_release_date.lte=${today}&include_adult=false`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}
