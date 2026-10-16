import axios from "axios";
import { API_KEY, BASE_URL } from "../config";

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



export async function getSeriesRecommendations(favourites: Series[]): Promise<Series[]> {
  const recommendations = new Map<number, Series>();
  const favouriteIds = new Set(favourites.map((f) => f.id));

  if (favourites.length > 0) {
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