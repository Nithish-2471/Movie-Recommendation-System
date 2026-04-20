import { getImage, getMovieDetails, getMoviesByCast } from "./api.js";
import { genreMap } from "./config.js";

const displayedMovieIds = new Set();

function createMovieCard(movie, onClick) {
  const card = document.createElement("div");
  card.className = "movie-frame";
  card.innerHTML = `
    <img src="${getImage(movie.poster_path)}" loading="lazy" alt="${movie.title}">
    <div class="frame-info">
      <h4>${movie.title}</h4>
      <p>${movie.vote_average?.toFixed(1) || "—"} • ${movie.release_date?.slice(0, 4) || ""}</p>
    </div>
  `;
  card.addEventListener("click", () => onClick(movie));
  return card;
}

// function createReelRow(title, movies, onClick, subtitle = "") {
//   if (!movies?.length) return null;
//   const row = document.createElement("div");
//   row.className = "film-reel-row";
//   row.innerHTML = `
//     <div class="reel-header">
//       <span class="reel-title">${title}</span>
//       ${subtitle ? `<span class="reel-subtitle">${subtitle}</span>` : ""}
//     </div>
//     <div class="reel-slider"></div>
//   `;
//   const slider = row.querySelector(".reel-slider");
//   movies.forEach((m) => {
//     if (m.poster_path && !displayedMovieIds.has(m.id)) {
//       displayedMovieIds.add(m.id);
//       slider.appendChild(createMovieCard(m, onClick));
//     }
//   });
//   return row;
// }

async function fetchMoviesForGenres(genreIds, sortBy) {
  const { getMoviesByGenres } = await import("./api.js");
  return await getMoviesByGenres(genreIds, sortBy);
}

export async function renderMoviesPage(selectedGenres) {
  displayedMovieIds.clear();
  const archiveContent = document.getElementById("archiveContent");
  archiveContent.innerHTML = "";

  const username = sessionStorage.getItem("username") || "Viewer";
  document.getElementById("usernameDisplay").textContent = username;

  const pillStrip = document.getElementById("genrePills");
  pillStrip.innerHTML = selectedGenres
    .map((g) => `<span class="genre-pill active">${g}</span>`)
    .join("");

  const genreIds = selectedGenres.map((g) => genreMap[g]).join(",");
  const onMovieClick = (movie) => showMovieDetailsModal(movie);

  // Fetch popular (hero source), top rated, recent
  const [popular, topRated, recent] = await Promise.all([
    fetchMoviesForGenres(genreIds, "popularity.desc"),
    fetchMoviesForGenres(genreIds, "vote_average.desc"),
    fetchMoviesForGenres(genreIds, "release_date.desc"),
  ]);

  // Hero: top 5 popular movies (already sorted by popularity)
  const heroMovies = popular.slice(0, 5);
  renderHero(heroMovies);

  // Create rows
  const rows = [
    createReelRow("Popular Now", popular, onMovieClick),
    createReelRow("Top Rated", topRated, onMovieClick),
    createReelRow("New Releases", recent, onMovieClick),
  ];

  rows.forEach((row) => {
    if (row) archiveContent.appendChild(row);
  });
}

function renderHero(movies) {
  const heroDiv = document.getElementById("hero");
  if (!movies.length) return;

  heroDiv.innerHTML = `
    <div class="hero-slider" id="heroSlider">
      ${movies
        .map(
          (m, i) => `
        <div class="hero-slide ${i === 0 ? "active" : ""}" data-index="${i}">
          <img src="${getImage(m.backdrop_path || m.poster_path, "original")}" alt="${m.title}">
          <div class="hero-slide-content">
            <h2>${m.title}</h2>
            <p>${m.overview?.slice(0, 150)}...</p>
            <button class="hero-trailer-btn" data-id="${m.id}">Watch Trailer</button>
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
    <div class="hero-controls">
      <button class="hero-prev"><i class="fas fa-chevron-left"></i></button>
      <div class="hero-dots">${movies.map((_, i) => `<span class="hero-dot ${i === 0 ? "active" : ""}" data-index="${i}"></span>`).join("")}</div>
      <button class="hero-next"><i class="fas fa-chevron-right"></i></button>
    </div>
  `;

  // Slider logic
  const slides = heroDiv.querySelectorAll(".hero-slide");
  const dots = heroDiv.querySelectorAll(".hero-dot");
  let current = 0;
  function showSlide(i) {
    slides.forEach((s, idx) => s.classList.toggle("active", idx === i));
    dots.forEach((d, idx) => d.classList.toggle("active", idx === i));
    current = i;
  }
  heroDiv
    .querySelector(".hero-prev")
    .addEventListener("click", () =>
      showSlide((current - 1 + slides.length) % slides.length),
    );
  heroDiv
    .querySelector(".hero-next")
    .addEventListener("click", () => showSlide((current + 1) % slides.length));
  dots.forEach((d, i) => d.addEventListener("click", () => showSlide(i)));

  heroDiv.querySelectorAll(".hero-trailer-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const movie = movies.find((m) => m.id == btn.dataset.id);
      if (movie) showMovieDetailsModal(movie);
    });
  });
}

// Details modal (unchanged from previous, trailer beside poster)
export async function showMovieDetailsModal(movie) {
  const modal = document.getElementById("movieModal");
  const content = document.getElementById("modalContent");
  modal.style.display = "block";

  const details = await getMovieDetails(movie.id);
  const videos = details.videos?.results || [];
  const trailer =
    videos.find((v) => v.type === "Trailer" && v.site === "YouTube") ||
    videos[0];
  const cast = details.credits?.cast?.slice(0, 12) || [];
  const recommendations = details.recommendations?.results?.slice(0, 12) || [];

  const backdrop = details.backdrop_path || movie.backdrop_path;
  const poster = details.poster_path || movie.poster_path;
  const rating = movie.vote_average?.toFixed(1) || "—";
  const year = movie.release_date?.slice(0, 4) || "—";
  const runtime = details.runtime ? `${details.runtime} min` : "—";

  content.innerHTML = `
    <div class="movie-detail-hero" style="background-image: url('${getImage(backdrop, "original")}')">
      <div class="hero-gradient"></div>
      <div class="hero-content-wrapper">
        <h1 class="detail-title">${movie.title}</h1>
        <div class="detail-badges">
          <span class="badge">${year}</span>
          <span class="badge">${runtime}</span>
          <span class="badge rating"><i class="fas fa-star"></i> ${rating}/10</span>
        </div>
      </div>
    </div>

    <div class="detail-content">
      <div class="detail-main-row">
        <div class="detail-poster-wrapper">
          <img class="detail-poster-large" src="${getImage(poster)}" alt="${movie.title}">
        </div>
        <div class="detail-description">
          <p class="overview-text">${movie.overview || details.overview || "No overview available."}</p>
          ${
            trailer
              ? `
          <div class="trailer-inline">
            <div class="trailer-container">
              <iframe src="https://www.youtube.com/embed/${trailer.key}" allowfullscreen></iframe>
            </div>
          </div>
          `
              : ""
          }
        </div>
      </div>

      <div class="cast-section-full">
        <h3 class="section-title">Cast</h3>
        <div class="cast-grid">
          ${cast
            .map(
              (c) => `
            <div class="cast-card" data-cast-id="${c.id}" data-cast-name="${c.name}">
              <img src="${getImage(c.profile_path, "w185")}" alt="${c.name}" class="cast-photo">
              <div class="cast-info">
                <span class="cast-name">${c.name}</span>
                <span class="cast-character">${c.character || ""}</span>
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
        <div id="castMoviesContainer" class="cast-movies-inline"></div>
      </div>

      ${
        recommendations.length
          ? `
      <div class="recommendations-section-full">
        <h3 class="section-title">More Like This</h3>
        <div class="recommendations-grid">
          ${recommendations
            .map(
              (rec) => `
            <div class="recommendation-card" data-id="${rec.id}">
              <img src="${getImage(rec.poster_path)}" alt="${rec.title}">
              <p>${rec.title}</p>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
      `
          : ""
      }
    </div>
  `;

  // Cast click
  const castContainer = content.querySelector("#castMoviesContainer");
  content.querySelectorAll(".cast-card").forEach((card) => {
    card.addEventListener("click", async () => {
      const castId = card.dataset.castId;
      const castName = card.dataset.castName;
      const movies = await getMoviesByCast(castId);
      const row = createReelRow(`Films with ${castName}`, movies, (m) =>
        showMovieDetailsModal(m),
      );
      castContainer.innerHTML = "";
      if (row) castContainer.appendChild(row);
    });
  });

  // Rec clicks
  content.querySelectorAll(".recommendation-card").forEach((card) => {
    card.addEventListener("click", async () => {
      const rec = recommendations.find((m) => m.id == card.dataset.id);
      if (rec) await showMovieDetailsModal(rec);
    });
  });

  document.querySelector(".close-modal").onclick = () =>
    (modal.style.display = "none");
  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
}

// Profile modal with genre editing
export function renderProfile(username, currentGenres, count) {
  const modal = document.getElementById("profileModal");
  const content = document.getElementById("profileContent");
  modal.style.display = "block";

  const allGenres = Object.keys(genreMap);
  content.innerHTML = `
    <div class="profile-container">
      <div class="profile-header">
        <i class="fas fa-user-circle"></i>
        <h2>${username}</h2>
        <p>${count}+ titles explored</p>
      </div>
      <div class="profile-genres">
        <h3>Your Genres</h3>
        <div class="genre-grid">
          ${allGenres
            .map(
              (g) => `
            <div class="genre-toggle ${currentGenres.includes(g) ? "active" : ""}" data-genre="${g}">
              ${g}
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
      <div class="profile-actions">
        <button class="save-genres-btn">Update Preferences</button>
        <button class="cancel-profile-btn">Cancel</button>
      </div>
    </div>
  `;

  content.querySelectorAll(".genre-toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => toggle.classList.toggle("active"));
  });

  content
    .querySelector(".save-genres-btn")
    .addEventListener("click", async () => {
      const selected = [];
      content
        .querySelectorAll(".genre-toggle.active")
        .forEach((t) => selected.push(t.dataset.genre));
      sessionStorage.setItem("genres", JSON.stringify(selected));
      modal.style.display = "none";
      await renderMoviesPage(selected);
    });

  content.querySelector(".cancel-profile-btn").addEventListener("click", () => {
    modal.style.display = "none";
  });

  document.querySelector(".close-profile").onclick = () =>
    (modal.style.display = "none");
}

// Add this new function to render.js

export async function performSearch(query) {
  if (!query.trim()) return;

  const archiveContent = document.getElementById("archiveContent");
  const heroDiv = document.getElementById("hero");

  // Hide hero during search
  if (heroDiv) heroDiv.style.display = "none";

  // Show loading state
  archiveContent.innerHTML = `<div class="search-loading">Searching for "${query}"...</div>`;

  const { searchMovies, searchPeople, getMoviesByCast, getMoviesByLanguage } =
    await import("./api.js");

  // 1. Search movies directly
  const movieResults = await searchMovies(query);

  // 2. Search people and get their movies
  const peopleResults = await searchPeople(query);
  let castMovies = [];
  if (peopleResults.length > 0) {
    const person = peopleResults[0];
    castMovies = await getMoviesByCast(person.id);
  }

  // 3. Try language filter (if query matches a language name or code)
  let languageMovies = [];
  const langMap = {
    french: "fr",
    spanish: "es",
    japanese: "ja",
    korean: "ko",
    italian: "it",
    german: "de",
    hindi: "hi",
    english: "en",
  };
  const lowerQuery = query.toLowerCase();
  if (langMap[lowerQuery] || Object.values(langMap).includes(lowerQuery)) {
    const code = langMap[lowerQuery] || lowerQuery;
    languageMovies = await getMoviesByLanguage(code);
  }

  // Combine and deduplicate
  const allMovies = [...movieResults, ...castMovies, ...languageMovies];
  const uniqueMovies = Array.from(
    new Map(allMovies.map((m) => [m.id, m])).values(),
  );

  // Render results
  archiveContent.innerHTML = "";

  // Add back button
  const backRow = document.createElement("div");
  backRow.className = "search-back-row";
  backRow.innerHTML = `
    <button class="back-to-recs-btn"><i class="fas fa-arrow-left"></i> Back to Recommendations</button>
    <span class="search-result-count">${uniqueMovies.length} results for "${query}"</span>
  `;
  archiveContent.appendChild(backRow);

  if (uniqueMovies.length > 0) {
    const onMovieClick = (movie) => showMovieDetailsModal(movie);
    const row = createReelRow("Search Results", uniqueMovies, onMovieClick);
    if (row) archiveContent.appendChild(row);
  } else {
    archiveContent.innerHTML += `<div class="no-results">No movies found. Try another search.</div>`;
  }

  // Back button handler
  document
    .querySelector(".back-to-recs-btn")
    .addEventListener("click", async () => {
      if (heroDiv) heroDiv.style.display = "block";
      const selectedGenres = JSON.parse(sessionStorage.getItem("genres")) || [];
      await renderMoviesPage(selectedGenres);
    });
}

// Helper function to create reel row (exported for search use)
export function createReelRow(title, movies, onClick, subtitle = "") {
  if (!movies?.length) return null;
  const row = document.createElement("div");
  row.className = "film-reel-row";
  row.innerHTML = `
    <div class="reel-header">
      <span class="reel-title">${title}</span>
      ${subtitle ? `<span class="reel-subtitle">${subtitle}</span>` : ""}
    </div>
    <div class="reel-slider"></div>
  `;
  const slider = row.querySelector(".reel-slider");
  movies.forEach((m) => {
    if (m.poster_path) {
      const card = createMovieCard(m, onClick);
      slider.appendChild(card);
    }
  });
  return row;
}
