import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import styles from '../styles/actordetails/actorDetails.module.css';
import Message from '../components/Message';


interface ActorDetails {
  id: number;
  name: string;
  profile_path: string | null;
  biography: string;
  birthday: string | null;
  place_of_birth: string | null;
  popularity: number;
  known_for_department: string;
  also_known_as: string[];
}

interface CombinedCredit {
  id: number;
  media_type: 'movie' | 'tv';
  title?: string;
  name?: string;
  poster_path: string | null;
  character?: string;
  job?: string;
  department?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
}

const API_KEY = "dfac1aa5cb807fcf17cb9a1914e1c132";
const BASE_URL = "https://api.themoviedb.org/3";

const DB_NAME = "AuthDB";
const STORE_NAME = "favouriteCredits";
const DB_VERSION = 3;

const openDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
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

const saveFavouriteToDB = async (credit: CombinedCredit) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(credit);
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

const getAllFavouritesFromDB = async (): Promise<CombinedCredit[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result as CombinedCredit[]);
    req.onerror = () => reject(req.error);
  });
};

const ActorDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [actor, setActor] = useState<ActorDetails | null>(null);
  const [credits, setCredits] = useState<CombinedCredit[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  // Pagination states
  const [moviePage, setMoviePage] = useState(1);
  const [seriesPage, setSeriesPage] = useState(1);
  const itemsPerPage = 20;

  // Load favourites
  const loadFavourites = async () => {
    const sessionUser = sessionStorage.getItem("sessionUser");
    if (!sessionUser) {
      setFavoriteIds(new Set());
      return;
    }

    const localFavs = localStorage.getItem("favouriteCredits");
    if (localFavs) {
      const parsed = JSON.parse(localFavs) as CombinedCredit[];
      setFavoriteIds(new Set(parsed.map(c => c.id)));
    } else {
      const dbFavs = await getAllFavouritesFromDB();
      setFavoriteIds(new Set(dbFavs.map(c => c.id)));
      localStorage.setItem("favouriteCredits", JSON.stringify(dbFavs));
    }
  };

  useEffect(() => {
    const fetchActorDetails = async () => {
      try {
        setLoading(true);

        const actorResponse = await axios.get(`${BASE_URL}/person/${id}?api_key=${API_KEY}&language=en-US`);
        setActor(actorResponse.data);

        const creditsResponse = await axios.get(`${BASE_URL}/person/${id}/combined_credits?api_key=${API_KEY}&language=en-US`);
        setCredits(creditsResponse.data.cast.concat(creditsResponse.data.crew));

        await loadFavourites();

        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch actor details:", err);
        setError("Could not load actor details. Please try again.");
        setLoading(false);
      }
    };

    if (id) fetchActorDetails();
  }, [id]);

  const toggleFavorite = async (credit: CombinedCredit) => {
    const sessionUser = sessionStorage.getItem("sessionUser");
    if (!sessionUser) {
      setMessage("You must be logged in to add to favourites.");
      return;
    }

    const isFav = favoriteIds.has(credit.id);
    let updatedFavourites: CombinedCredit[];

    if (isFav) {
      setFavoriteIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(credit.id);
        return newSet;
      });
      await removeFavouriteFromDB(credit.id);

      const stored = JSON.parse(localStorage.getItem("favouriteCredits") || "[]") as CombinedCredit[];
      updatedFavourites = stored.filter(c => c.id !== credit.id);
    } else {
      setFavoriteIds(prev => new Set(prev).add(credit.id));
      await saveFavouriteToDB(credit);

      const stored = JSON.parse(localStorage.getItem("favouriteCredits") || "[]") as CombinedCredit[];
      updatedFavourites = [...stored, credit];
    }

    localStorage.setItem("favouriteCredits", JSON.stringify(updatedFavourites));
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (error) {
    return <div className={styles.errorContainer}>{error}</div>;
  }

  if (!actor) {
    return <div className={styles.noData}>No actor data found.</div>;
  }

  const profileUrl = actor.profile_path
    ? `https://image.tmdb.org/t/p/w500${actor.profile_path}`
    : 'https://via.placeholder.com/500x500?text=No+Image';

  const latinAliases = actor.also_known_as.filter(alias =>
    /^[a-zA-Z0-9\s.,'’()-]+$/.test(alias)
  );

  const movies = credits.filter(c => c.media_type === 'movie' && c.poster_path);
  const series = credits.filter(c => c.media_type === 'tv' && c.poster_path);

  const paginatedMovies = movies.slice((moviePage - 1) * itemsPerPage, moviePage * itemsPerPage);
  const paginatedSeries = series.slice((seriesPage - 1) * itemsPerPage, seriesPage * itemsPerPage);

  const renderCreditCard = (credit: CombinedCredit) => {
    const isFavorite = favoriteIds.has(credit.id);
    const releaseYear = credit.media_type === 'movie'
      ? (credit.release_date ? new Date(credit.release_date).getFullYear() : 'N/A')
      : (credit.first_air_date ? new Date(credit.first_air_date).getFullYear() : 'N/A');

    return (
      <div
        key={credit.id}
        className={styles.creditCard}
        onClick={() => {
          if (credit.media_type === "movie") {
            navigate(`/movie/${credit.id}`);
          }
        }}
      >
        <img
          src={`https://image.tmdb.org/t/p/w200${credit.poster_path}`}
          alt={credit.title || credit.name}
          className={styles.creditPoster}
        />
        <div className={styles.creditInfo}>
          <p className={styles.creditTitle}>{credit.title || credit.name}</p>
          <div className={styles.detailsRow}>
            <span className={styles.year}>{releaseYear}</span>
            <span className={styles.rating}>
              ⭐ {credit.vote_average?.toFixed(1) || 'N/A'}
            </span>
          </div>
          <p className={styles.creditRole}>
            {credit.character ? `as "${credit.character}"` : credit.job}
          </p>
          <div className={styles.favoriteWrapper}>
            <button
              className={styles.favoriteIcon}
              onClick={(e) => {
                e.stopPropagation(); 
                toggleFavorite(credit);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className={`${isFavorite ? styles.iconFilled : ''}`}
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 
                7.78l1.06 1.06L12 21.23l7.78-7.78 
                1.06-1.06a5.5 5.5 0 0 0 
                0-7.78z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

 
  const renderPagination = (page: number, setPage: React.Dispatch<React.SetStateAction<number>>, totalItems: number) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

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
        onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
        disabled={page === totalPages}
        className={styles.paginationItem}
      >
        &gt;
      </button>
    );

    return items;
  };

  return (
    <div className={styles.actorDetailsPage}>
      <Navbar />
      <main className={styles.detailsContainer}>
        <div className={styles.headerSection}>
          <img src={profileUrl} alt={actor.name} className={styles.profileImage} />
          <div className={styles.actorInfo}>
            <h1 className={styles.actorName}>{actor.name}</h1>
            <p className={styles.department}>Known For: {actor.known_for_department}</p>
            <p className={styles.infoText}>Born: {actor.birthday || 'N/A'} in {actor.place_of_birth || 'N/A'}</p>
            <p className={styles.infoText}>Popularity: {actor.popularity?.toFixed(2)}</p>
            {latinAliases.length > 0 && (
              <p className={styles.infoText}>Aliases: {latinAliases.join(', ')}</p>
            )}
          </div>
        </div>

        <div className={styles.bioSection}>
          <h2 className={styles.sectionTitle}>Biography</h2>
          <p className={styles.biography}>{actor.biography || 'No biography available.'}</p>
        </div>

        {/* Movies */}
        <div className={styles.creditsSection}>
          <h2 className={styles.sectionTitle}>Filmography (Movies)</h2>
          <div className={styles.creditsGrid}>
            {movies.length > 0 ? paginatedMovies.map(renderCreditCard) : <p>No movies available.</p>}
          </div>
          <div className={styles.pagination}>
            {renderPagination(moviePage, setMoviePage, movies.length)}
          </div>
        </div>

        {/* Series */}
        <div className={styles.creditsSection}>
          <h2 className={styles.sectionTitle}>Filmography (Series)</h2>
          <div className={styles.creditsGrid}>
            {series.length > 0 ? paginatedSeries.map(renderCreditCard) : <p>No series available.</p>}
          </div>
          <div className={styles.pagination}>
            {renderPagination(seriesPage, setSeriesPage, series.length)}
          </div>
        </div>
      </main>

      {message && <Message text={message} type="error" onClose={() => setMessage(null)} />}
    </div>
  );
};

export default ActorDetails;