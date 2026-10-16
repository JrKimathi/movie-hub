import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import MovieCard from "../components/MovieCard";
import Message from "../components/Message"; 
import styles from "../styles/homestyles/home.module.css";
import { getRecommendations } from "../utils/recommendation";
import { API_KEY, BASE_URL } from "../config";

interface Movie {
  id: number;
  title?: string;
  original_title?: string;
  name?: string;
  poster_path: string | null;
  release_date?: string;
  vote_average?: number;
}

interface MovieWithCategories extends Movie {
  categories: ("all" | "top" | "latest" | "upcoming" | "recommended")[];
}


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
      if (!db.objectStoreNames.contains("users")) {
        db.createObjectStore("users", { keyPath: "email" });
      }
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
};

const saveFavouriteToDB = async (movie: MovieWithCategories) => {
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

const getAllFavouritesFromDB = async (): Promise<MovieWithCategories[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result as MovieWithCategories[]);
    req.onerror = () => reject(req.error);
  });
};

const Home: React.FC = () => {
  const [topMovies, setTopMovies] = useState<MovieWithCategories[]>([]);
  const [latestMovies, setLatestMovies] = useState<MovieWithCategories[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<MovieWithCategories[]>([]);
  const [allMovies, setAllMovies] = useState<MovieWithCategories[]>([]);
  const [favourites, setFavourites] = useState<MovieWithCategories[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<MovieWithCategories[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  // Pagination states
  const [allPage, setAllPage] = useState(1);
  const [topPage, setTopPage] = useState(1);
  const [latestPage, setLatestPage] = useState(1);
  const [upcomingPage, setUpcomingPage] = useState(1);

  const topMoviesRef = useRef<HTMLDivElement>(null);
  const latestMoviesRef = useRef<HTMLDivElement>(null);
  const upcomingMoviesRef = useRef<HTMLDivElement>(null);
  const allMoviesRef = useRef<HTMLDivElement>(null);
  const favouritesRef = useRef<HTMLDivElement>(null);
  const recommendedRef = useRef<HTMLDivElement>(null);

  const fetchMovies = async (
    endpoint: string,
    setState: React.Dispatch<React.SetStateAction<MovieWithCategories[]>>,
    category: "all" | "top" | "latest" | "upcoming",
    page: number = 1
  ) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/${endpoint}?api_key=${API_KEY}&language=en-US&page=${page}`
      );
      const results = res.data.results.map((movie: Movie) => ({
        ...movie,
        categories: [category],
      }));
      setState(results);
    } catch (error) {
      console.error(`Error fetching movies from ${endpoint}:`, error);
    }
  };

  const fetchUpcomingMoviesByYear = async (
    setState: React.Dispatch<React.SetStateAction<MovieWithCategories[]>>,
    year: number,
    page: number = 1
  ) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&primary_release_year=${year}&page=${page}`
      );
      const results = res.data.results.map((movie: Movie) => ({
        ...movie,
        categories: ["upcoming"],
      }));
      setState(results);
    } catch (error) {
      console.error("Error fetching upcoming movies by year:", error);
    }
  };

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    fetchMovies("movie/top_rated", setTopMovies, "top", topPage);
    fetchMovies("movie/now_playing", setLatestMovies, "latest", latestPage);
    fetchUpcomingMoviesByYear(setUpcomingMovies, currentYear, upcomingPage);
    fetchMovies("movie/popular", setAllMovies, "all", allPage);

    const loadRecommendations = async () => {
      try {
        const recs = await getRecommendations(favourites);
        setRecommendedMovies(recs.map((movie: Movie) => ({
          ...movie,
          categories: ["recommended"],
        })));
      } catch (err) {
        console.error("Failed to load recommendations:", err);
      }
    };
    
    const sessionUser = sessionStorage.getItem("sessionUser");
    if (sessionUser) {
      loadRecommendations();
    } else {
      setRecommendedMovies([]);
    }

  }, [allPage, topPage, latestPage, upcomingPage, favourites]); 

  const toggleFavourite = async (movie: MovieWithCategories) => {
    const sessionUser = sessionStorage.getItem("sessionUser");
    if (!sessionUser) {
      setMessage("You need to log in to add a movie to favourites.");
      return;
    }

    const isAlreadyFavourite = favourites.some((fav) => fav.id === movie.id);
    if (isAlreadyFavourite) {
      const updated = favourites.filter((fav) => fav.id !== movie.id);
      setFavourites(updated);
      await removeFavouriteFromDB(movie.id);
    } else {
      const updated = [...favourites, movie];
      setFavourites(updated);
      await saveFavouriteToDB(movie);
    }
  };

  const isFavourite = (movieId: number) => favourites.some((fav) => fav.id === movieId);

  const scrollHorizontally = (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: "left" | "right"
  ) => {
    if (ref.current) {
      const scrollAmount = ref.current.clientWidth;
      ref.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const renderPagination = (
    page: number,
    setPage: React.Dispatch<React.SetStateAction<number>>,
    totalPages: number = 500
  ) => {
    const items = [];
    items.push(
      <button
        key="prev"
        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
        disabled={page === 1}
        className={styles.paginationItem}
      >
        &lt;
      </button>
    );

    if (page > 2) items.push(<span key="ellipsis-start" className={styles.paginationEllipsis}>...</span>);

    for (let i = Math.max(1, page - 1); i <= Math.min(totalPages, page + 1); i++) {
      items.push(
        <button
          key={i}
          onClick={() => setPage(i)}
          className={`${styles.paginationItem} ${page === i ? styles.active : ""}`}
        >
          {i}
        </button>
      );
    }

    if (page < totalPages - 1) items.push(<span key="ellipsis-end" className={styles.paginationEllipsis}>...</span>);

    items.push(
      <button
        key="next"
        onClick={() => setPage((prev) => prev + 1)}
        className={styles.paginationItem}
      >
        &gt;
      </button>
    );

    return items;
  };

  const renderMovieRow = (
    title: string,
    movies: MovieWithCategories[],
    ref: React.RefObject<HTMLDivElement | null>,
    sectionId: string,
    page: number,
    setPage: React.Dispatch<React.SetStateAction<number>> | (() => void)
  ) => (
    <section className={styles.movieRowContainer} id={sectionId}>
      <h2 className={styles.rowTitle}>{title}</h2>
      <div className={styles.movieListWrapper}>
        <button
          className={`${styles.scrollButton} ${styles.scrollButtonLeft}`}
          onClick={() => scrollHorizontally(ref, "left")}
        >
          &lt;
        </button>
        <div className={styles.movieList} ref={ref}>
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onToggleFavourite={() => toggleFavourite(movie)}
              isFavourite={isFavourite(movie.id)}
            />
          ))}
        </div>
        <button
          className={`${styles.scrollButton} ${styles.scrollButtonRight}`}
          onClick={() => scrollHorizontally(ref, "right")}
        >
          &gt;
        </button>
      </div>
      {typeof setPage === "function" && (
        <div className={styles.pagination}>{renderPagination(page, setPage as any)}</div>
      )}
    </section>
  );

  useEffect(() => {
    const fetchFavourites = async () => {
      try {
        const dbFavs = await getAllFavouritesFromDB();
        setFavourites(dbFavs);
      } catch (err) {
        console.error("Failed to load favourites from IndexedDB:", err);
      }
    };
    fetchFavourites();
  }, []);

  return (
    <div className={styles.home}>
      <Navbar />
      <main>
        {recommendedMovies.length > 0 &&
          renderMovieRow("Recommended For You", recommendedMovies, recommendedRef, "recommended-section", 1, () => {})}
        {favourites.length > 0 &&
          renderMovieRow("My Favourites", favourites, favouritesRef, "favourites-section", 1, () => {})}
        {renderMovieRow("All Movies", allMovies, allMoviesRef, "all-movies-section", allPage, setAllPage)}
        {renderMovieRow("Top Movies", topMovies, topMoviesRef, "top-movies-section", topPage, setTopPage)}
        {renderMovieRow("Latest Movies", latestMovies, latestMoviesRef, "latest-movies-section", latestPage, setLatestPage)}
        {renderMovieRow("Coming This Year", upcomingMovies, upcomingMoviesRef, "upcoming-movies-section", upcomingPage, setUpcomingPage)}
      </main>
      {message && (
        <Message text={message} type="error" onClose={() => setMessage(null)} />
      )}
    </div>
  );
};

export default Home;