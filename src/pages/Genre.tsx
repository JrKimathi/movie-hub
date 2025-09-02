import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import MovieCard from "../components/MovieCard";
import styles from "../styles/genrestyles/genrestyles.module.css";
import { Movie } from "../types";
import Message from "../components/Message";

const DB_NAME = "MovieAppDB";
const STORE_NAME = "favourites";
const DB_VERSION = 3;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
};

const saveFavouriteToDB = async (movie: Movie) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(movie);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const removeFavouriteFromDB = async (id: number) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const getAllFavouritesFromDB = async (): Promise<Movie[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result as Movie[]);
    req.onerror = () => reject(req.error);
  });
};

const genres = [
  { id: 28, name: "Action", tvId: 10759 },
  { id: 12, name: "Adventure", tvId: 10759 },
  { id: 16, name: "Animation", tvId: 16 },
  { id: 35, name: "Comedy", tvId: 35 },
  { id: 80, name: "Crime", tvId: 80 },
  { id: 99, name: "Documentary", tvId: 99 },
  { id: 18, name: "Drama", tvId: 18 },
  { id: 10751, name: "Family", tvId: 10751 },
  { id: 14, name: "Fantasy", tvId: 10765 },
  { id: 36, name: "History", tvId: 10768 },
  { id: 27, name: "Horror", tvId: 27 },
  { id: 10402, name: "Music", tvId: 10402 },
  { id: 9648, name: "Mystery", tvId: 9648 },
  { id: 10749, name: "Romance", tvId: 10749 },
  { id: 878, name: "Science Fiction", tvId: 10765 },
  { id: 10770, name: "TV Movie", tvId: null },
  { id: 53, name: "Thriller", tvId: 53 },
  { id: 10752, name: "War", tvId: 10768 },
  { id: 37, name: "Western", tvId: 37 },
];

interface PaginatedSection {
  items: Movie[];
  currentPage: number;
  totalPages: number;
  title?: string;
}

const Genres: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const genreId = Number(id);
  const genre = genres.find((g) => g.id === genreId);
  const genreName = genre?.name || "Unknown";
  const tvGenreId = genre?.tvId;

  const [favourites, setFavourites] = useState<Movie[]>([]);
  const [sections, setSections] = useState<Record<string, PaginatedSection>>({});
  const [message, setMessage] = useState<string | null>(null);

  const API_KEY = "dfac1aa5cb807fcf17cb9a1914e1c132";
  const BASE_URL = "https://api.themoviedb.org/3";

  const handleToggleFavourite = async (movie: Movie) => {
    const sessionUser = sessionStorage.getItem("sessionUser");
    if (!sessionUser) {
      setMessage("You need to log in to add a movie or a TV a Show to favourites.");
      return;
    }

    const isFav = isMovieFavourite(movie.id);
    let newFavourites: Movie[];

    if (isFav) {
      newFavourites = favourites.filter((fav) => fav.id !== movie.id);
      await removeFavouriteFromDB(movie.id);
    } else {
      newFavourites = [...favourites, movie];
      await saveFavouriteToDB(movie);
    }

    setFavourites(newFavourites);
    localStorage.setItem("favouritesGenres", JSON.stringify(newFavourites));
  };

  const isMovieFavourite = (movieId: number) =>
    favourites.some((fav) => fav.id === movieId);

  const fetchSection = async (key: string, url: string, page = 1) => {
    try {
      const res = await axios.get(`${url}&page=${page}`);
      setSections((prev) => ({
        ...prev,
        [key]: {
          items: res.data.results,
          currentPage: page,
          totalPages: res.data.total_pages > 500 ? 500 : res.data.total_pages,
        },
      }));
    } catch (err) {
      console.error(`Error fetching ${key}:`, err);
    }
  };

  const fetchRecommendedMovies = async () => {
    try {
      const resMovies = await axios.get(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&sort_by=popularity.desc`);
      
      let resShows = { data: { results: [] } };
      if (tvGenreId !== null) {
        resShows = await axios.get(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=${tvGenreId}&sort_by=popularity.desc`);
      }

      const combinedResults = [...resMovies.data.results, ...resShows.data.results];
      combinedResults.sort((a, b) => b.popularity - a.popularity);

      setSections((prev) => ({
        ...prev,
        recommended: {
          items: combinedResults,
          currentPage: 1,
          totalPages: 1,
          title: `Recommended for you in ${genreName}`
        }
      }));
    } catch (err) {
      console.error("Error fetching recommended movies and shows:", err);
    }
  };

  useEffect(() => {
    if (!id) return;

    (async () => {
      const dbFavs = await getAllFavouritesFromDB();
      const filteredFavs = dbFavs.filter((m) => m.genre_ids?.includes(genreId) || (tvGenreId !== null && m.genre_ids?.includes(tvGenreId)));
      setFavourites(filteredFavs);
    })();
    
    fetchRecommendedMovies();
    fetchSection("movies", `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}`);
    fetchSection("topMovies", `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&sort_by=vote_average.desc&vote_count.gte=200`);

    if (tvGenreId !== null) {
      fetchSection("shows", `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=${tvGenreId}`);
      fetchSection("topShows", `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=${tvGenreId}&sort_by=vote_average.desc&vote_count.gte=200`);
    } else {
      setSections((prev) => ({
        ...prev,
        shows: { items: [], currentPage: 1, totalPages: 1 },
        topShows: { items: [], currentPage: 1, totalPages: 1 },
      }));
    }
  }, [id, genreId, tvGenreId]);

  const renderPagination = (sectionKey: string, baseUrl: string) => {
    const section = sections[sectionKey];
    if (!section || section.items.length === 0) return null;

    const { currentPage, totalPages } = section;
    const items = [];

    items.push(
      <button
        key="prev"
        onClick={() => fetchSection(sectionKey, baseUrl, Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className={styles.paginationItem}
      >
        &lt;
      </button>
    );

    if (currentPage > 2)
      items.push(<span key="ellipsis-start" className={styles.paginationEllipsis}>...</span>);

    for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
      items.push(
        <button
          key={i}
          onClick={() => fetchSection(sectionKey, baseUrl, i)}
          className={`${styles.paginationItem} ${currentPage === i ? styles.active : ""}`}
        >
          {i}
        </button>
      );
    }

    if (currentPage < totalPages - 1)
      items.push(<span key="ellipsis-end" className={styles.paginationEllipsis}>...</span>);

    items.push(
      <button
        key="next"
        onClick={() => fetchSection(sectionKey, baseUrl, currentPage + 1)}
        disabled={currentPage === totalPages}
        className={styles.paginationItem}
      >
        &gt;
      </button>
    );

    return <div className={styles.pagination}>{items}</div>;
  };
  
  const renderSection = (title: string, key: string, baseUrl: string) => {
    const section = sections[key];
    if (!section) return null;

    return (
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <div className={styles.gridContainer}>
          {section.items.length > 0 ? (
            section.items.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onToggleFavourite={handleToggleFavourite}
                isFavourite={isMovieFavourite(movie.id)}
              />
            ))
          ) : (
            <p>No results found.</p>
          )}
        </div>
        {renderPagination(key, baseUrl)}
      </section>
    );
  };

  return (
    <div className={styles.genresPage}>
      <Navbar />
      <div className={styles.mainContent}>
        <h1 className={styles.pageTitle}>{genreName} Genre</h1>

        {favourites.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Favourites in {genreName}</h2>
            <div className={styles.gridContainer}>
              {favourites.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onToggleFavourite={handleToggleFavourite}
                  isFavourite={isMovieFavourite(movie.id)}
                />
              ))}
            </div>
          </section>
        )}
        
        {sections.recommended && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{sections.recommended.title}</h2>
            <div className={styles.gridContainer}>
              {sections.recommended.items.length > 0 ? (
                sections.recommended.items.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onToggleFavourite={handleToggleFavourite}
                    isFavourite={isMovieFavourite(movie.id)}
                  />
                ))
              ) : (
                <p>No results found.</p>
              )}
            </div>
          </section>
        )}

        {renderSection(`All Movies in ${genreName}`, "movies", `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}`)}
        {renderSection(`Top Movies in ${genreName}`, "topMovies", `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&sort_by=vote_average.desc&vote_count.gte=200`)}
        {renderSection(`All TV Shows in ${genreName}`, "shows", `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=${tvGenreId}`)}
        {renderSection(`Top TV Shows in ${genreName}`, "topShows", `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=${tvGenreId}&sort_by=vote_average.desc&vote_count.gte=200`)}
      </div>

      {message && (
        <Message text={message} type="error" onClose={() => setMessage(null)} />
      )}
    </div>
  );
};

export default Genres;