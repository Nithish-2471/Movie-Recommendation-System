import { renderMoviesPage, renderProfile, performSearch } from "./render.js";

document.addEventListener("DOMContentLoaded", () => {
  const formSection = document.querySelector(".form");
  const genreSection = document.querySelector(".genre");
  const movieSection = document.querySelector(".movies");
  const progressSteps = document.querySelectorAll(".step");
  const continueBtn = document.querySelector(".continue-btn");
  const cards = document.querySelectorAll(".card");

  let selectedGenres = JSON.parse(sessionStorage.getItem("genres")) || [];
  const savedStep = sessionStorage.getItem("step");
  const username = sessionStorage.getItem("username");

  function updateCardSelection() {
    cards.forEach((card) => {
      const genre = card.dataset.genre;
      card.classList.toggle("selected", selectedGenres.includes(genre));
    });
    continueBtn.disabled = selectedGenres.length === 0;
  }
  updateCardSelection();

  function goToStep(index) {
    progressSteps.forEach((step, i) =>
      step.classList.toggle("active", i <= index),
    );
  }

  // Restore state
  if (savedStep === "genre" || (savedStep === "movies" && !username)) {
    formSection.style.display = "none";
    genreSection.classList.add("show");
    goToStep(1);
  } else if (savedStep === "movies" && username) {
    formSection.style.display = "none";
    genreSection.style.display = "none";
    movieSection.style.display = "block";
    document.querySelector(".side-progress").style.display = "none";
    renderMoviesPage(selectedGenres);
  }

  // Login
  document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    if (!name) return;
    sessionStorage.setItem("username", name);
    sessionStorage.setItem("step", "genre");
    formSection.classList.add("hide");
    setTimeout(() => {
      formSection.style.display = "none";
      genreSection.classList.add("show");
      goToStep(1);
    }, 300);
  });

  // Genre selection
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const genre = card.dataset.genre;
      if (selectedGenres.includes(genre)) {
        selectedGenres = selectedGenres.filter((g) => g !== genre);
      } else {
        selectedGenres.push(genre);
      }
      sessionStorage.setItem("genres", JSON.stringify(selectedGenres));
      updateCardSelection();
    });
  });

  // Continue to movies
  continueBtn.addEventListener("click", async () => {
    if (selectedGenres.length === 0) return;
    sessionStorage.setItem("step", "movies");
    document.querySelector(".side-progress").style.display = "none";
    genreSection.classList.remove("show");
    genreSection.style.display = "none";
    movieSection.style.display = "block";
    await renderMoviesPage(selectedGenres);
  });

  // Profile / Logout
  document.getElementById("profileBtn").addEventListener("click", () => {
    renderProfile(username || "Guest", selectedGenres, 42);
  });
  document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.clear();
    location.reload();
  });

  async function handleSearch() {
    const query = searchBar.value.trim();
    if (!query) return;
    await performSearch(query);
  }

  // Search functionality – use the search icon and input field
  const searchBar = document.getElementById("searchBar");
  const searchIcon = document.querySelector(".search-icon");

  if (searchBar) {
    async function handleSearch() {
      const query = searchBar.value.trim();
      if (!query) return;
      await performSearch(query);
    }

    // Trigger search on Enter key
    searchBar.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSearch();
    });

    // Trigger search on icon click
    if (searchIcon) {
      searchIcon.addEventListener("click", handleSearch);
    }
  }
  // Close modals on outside click
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) e.target.style.display = "none";
  });
});
