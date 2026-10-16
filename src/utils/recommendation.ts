import { openDB } from "idb";
import axios from "axios";
import { API_KEY, BASE_URL } from "../config";


interface Movie {
  id: number;
  title?: string;
  name?: string;
  genres?: { id: number; name: string }[];
  genre_ids?: number[];
  poster_path?: string | null;
}

// Interface for Series
interface Series {
  id: number;
  name?: string;
  original_name?: string;
  poster_path: string | null;
  first_air_date?: string;
  vote_average?: number;
  genres?: { id: number; name: string }[];
  genre_ids?: number[];
}

const DB_NAME = "MovieAppDB";
const SEARCH_STORE = "searchHistory";
const FAV_STORE = "favourites";

// Helper function to get the IndexedDB database instance
async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(SEARCH_STORE)) {
        db.createObjectStore(SEARCH_STORE, { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(FAV_STORE)) {
        db.createObjectStore(FAV_STORE, { keyPath: "id" });
      }
    },
  });
}

// Helper function to get all items from an object store
async function getAll(storeName: string) {
  const db = await getDB();
  return db.getAll(storeName);
}

// Main function to get movie recommendations
export async function getRecommendations(favourites: Movie[]): Promise<Movie[]> {
  const recommendations = new Map<number, Movie>();
  const favouriteIds = new Set(favourites.map(f => f.id));

  // If there are no favourites, fetch popular movies as a fallback
  if (favourites.length === 0) {
    try {
      const popularRes = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}`);
      const popularData = await popularRes.json();
      if (popularData.results) {
        popularData.results.forEach((item: Movie) => {
          if (!recommendations.has(item.id)) {
            recommendations.set(item.id, item);
          }
        });
      }
    } catch (err) {
      console.error("Fallback fetch error:", err);
    }
  } else {
    // --- CONTENT-BASED: Search by genre from favourites ---
    const allGenreIds = new Map<number, number>();
    favourites.forEach((fav: any) => {
      if (fav.genre_ids) {
        fav.genre_ids.forEach((id: number) => {
          allGenreIds.set(id, (allGenreIds.get(id) || 0) + 1);
        });
      }
    });

    const sortedGenres = [...allGenreIds.entries()]
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 3)
      .map(([id]) => id);

    for (const genreId of sortedGenres) {
      if (recommendations.size >= 50) break;
      try {
        const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&sort_by=vote_average.desc&vote_count.gte=1000`);
        const data = await res.json();
        if (data.results) {
          data.results.forEach((item: Movie) => {
            if (!favouriteIds.has(item.id) && !recommendations.has(item.id)) {
              recommendations.set(item.id, item);
            }
          });
        }
      } catch (err) {
        console.error("Genre fetch error:", err);
      }
    }

    // --- COLLABORATIVE: Fetch similar movies based on favourites ---
    for (const fav of favourites) {
      if (recommendations.size >= 100) break;
      try {
        const res = await fetch(`${BASE_URL}/movie/${fav.id}/similar?api_key=${API_KEY}`);
        const data = await res.json();
        if (data.results) {
          data.results.forEach((item: Movie) => {
            if (!favouriteIds.has(item.id) && !recommendations.has(item.id)) {
              recommendations.set(item.id, item);
            }
          });
        }
      } catch (err) {
        console.error("Collaborative fetch error:", err);
      }
    }

    // Fallback if recommendations are still low
    if (recommendations.size < 50) {
      try {
        const popularRes = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}`);
        const popularData = await popularRes.json();
        if (popularData.results) {
          popularData.results.forEach((item: Movie) => {
            if (!recommendations.has(item.id) && !favouriteIds.has(item.id)) {
              recommendations.set(item.id, item);
            }
          });
        }
      } catch (err) {
        console.error("Fallback fetch error:", err);
      }
    }
  }

  return Array.from(recommendations.values()).slice(0, 100);
}

// Main function to get series recommendations
export async function getSeriesRecommendations(favourites: Series[]): Promise<Series[]> {
  const recommendations = new Map<number, Series>();
  const favouriteIds = new Set(favourites.map((f) => f.id));

  if (favourites.length > 0) {
    // --- CONTENT-BASED: Search by genre from favourites ---
    const allGenreIds = new Map<number, number>();
    favourites.forEach((fav: any) => {
      if (fav.genre_ids) {
        fav.genre_ids.forEach((id: number) => {
          allGenreIds.set(id, (allGenreIds.get(id) || 0) + 1);
        });
      }
    });

    const sortedGenres = [...allGenreIds.entries()]
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 3)
      .map(([id]) => id);

    for (const gid of sortedGenres) {
      if (recommendations.size >= 50) break;
      try {
        const res = await axios.get(
          `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=${gid}&sort_by=popularity.desc`
        );
        if (res.data.results) {
          res.data.results.forEach((item: Series) => {
            if (!favouriteIds.has(item.id) && !recommendations.has(item.id)) {
              recommendations.set(item.id, item);
            }
          });
        }
      } catch (err) {
        console.error("Genre-based fetch error:", err);
      }
    }

    // --- COLLABORATIVE: Fetch similar series based on favourites ---
    for (const fav of favourites) {
      if (recommendations.size >= 50) break;
      try {
        const res = await axios.get(
          `${BASE_URL}/tv/${fav.id}/similar?api_key=${API_KEY}`
        );
        if (res.data.results) {
          res.data.results.forEach((item: Series) => {
            if (!favouriteIds.has(item.id) && !recommendations.has(item.id)) {
              recommendations.set(item.id, item);
            }
          });
        }
      } catch (err) {
        console.error("Collaborative fetch error:", err);
      }
    }
  }

  // Fallback: If no favorites, fetch popular series.
  if (favourites.length === 0 || recommendations.size < 10) {
    try {
      const res = await axios.get(`${BASE_URL}/tv/popular?api_key=${API_KEY}`);
      if (res.data.results) {
        res.data.results.forEach((item: Series) => {
          if (!recommendations.has(item.id)) {
            recommendations.set(item.id, item);
          }
        });
      }
    } catch (err) {
      console.error("Fallback fetch error:", err);
    }
  }

  return Array.from(recommendations.values()).slice(0, 100);
}
