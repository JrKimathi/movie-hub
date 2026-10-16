import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import styles from '../styles/seriesstyles/Series.module.css';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { IconType } from 'react-icons';
import Message from "../components/Message";
import { Link } from 'react-router-dom';
import { getSeriesRecommendations } from "../utils/seriesRecommendation";
import { API_KEY, BASE_URL } from "../config";

interface Series {
  id: number;
  name?: string;
  original_name?: string;
  poster_path: string | null;
  first_air_date?: string;
  vote_average?: number;
  genre_ids?: number[];
}

interface SeriesWithCategories extends Series {
  categories: ('all' | 'top' | 'latest' | 'upcoming' | 'recommended')[];
}

// ---- IndexedDB setup ----
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

const saveFavouriteToDB = async (series: SeriesWithCategories) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(series);
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

const getAllFavouritesFromDB = async (): Promise<SeriesWithCategories[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result as SeriesWithCategories[]);
    req.onerror = () => reject(req.error);
  });
};

// ---- Icon Component ----
interface IconProps {
  icon: IconType;
  className?: string;
}

const Icon = ({ icon: IconComp, className }: IconProps) => {
  const Comp = IconComp as React.ComponentType<{ className?: string }>;
  return <Comp className={className} />;
};

// ---- SeriesCard Component ----
interface SeriesCardProps {
  series: SeriesWithCategories;
  onToggleFavourite: (series: SeriesWithCategories) => void;
  isFavourite: boolean;
}

const SeriesCard: React.FC<SeriesCardProps> = ({ series, onToggleFavourite, isFavourite }) => {
  const title = series.name || series.original_name || 'Untitled';
  const posterUrl = series.poster_path
    ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
    : 'https://via.placeholder.com/500x750?text=No+Image';
  const releaseYear = series.first_air_date?.split('-')[0] || 'N/A';

  return (
    <div className={styles.seriesCard}>
      <Link to={`/series/${series.id}`} className={styles.seriesLink}>
        <div className={styles.posterContainer}>
          <img src={posterUrl} alt={title} className={styles.poster} />
          <div className={styles.yearOverlay}>{releaseYear}</div>
          <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggleFavourite(series); }} className={styles.favouriteButton}>
            {isFavourite ? <Icon icon={FaHeart} className={styles.heartIcon} /> : <Icon icon={FaRegHeart} className={styles.heartIcon} />}
          </button>
        </div>
        <div className={styles.info}>
          <div className={styles.title}>{title}</div>
          <div className={styles.releaseYear}>Rating: {series.vote_average?.toFixed(1) || 'N/A'}</div>
        </div>
      </Link>
    </div>
  );
};



const Series: React.FC = () => {
  const [topSeries, setTopSeries] = useState<SeriesWithCategories[]>([]);
  const [latestSeries, setLatestSeries] = useState<SeriesWithCategories[]>([]);
  const [upcomingSeries, setUpcomingSeries] = useState<SeriesWithCategories[]>([]);
  const [allSeries, setAllSeries] = useState<SeriesWithCategories[]>([]);
  const [favourites, setFavourites] = useState<SeriesWithCategories[]>([]);
  const [recommendedSeries, setRecommendedSeries] = useState<SeriesWithCategories[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const [topPage, setTopPage] = useState(1);
  const [latestPage, setLatestPage] = useState(1);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [allPage, setAllPage] = useState(1);

  const topSeriesRef = useRef<HTMLDivElement>(null);
  const latestSeriesRef = useRef<HTMLDivElement>(null);
  const upcomingSeriesRef = useRef<HTMLDivElement>(null);
  const allSeriesRef = useRef<HTMLDivElement>(null);
  const favouritesRef = useRef<HTMLDivElement>(null);
  const recommendedRef = useRef<HTMLDivElement>(null);

  const fetchSeries = async (
    endpoint: string,
    setState: React.Dispatch<React.SetStateAction<SeriesWithCategories[]>>,
    category: 'all' | 'top' | 'latest' | 'upcoming',
    page: number = 1
  ) => {
    try {
      const res = await axios.get(`${BASE_URL}/${endpoint}?api_key=${API_KEY}&language=en-US&page=${page}`);
      const results = res.data.results.map((series: Series) => ({ ...series, categories: [category] }));
      setState(results);
    } catch (error) {
      console.error(`Error fetching series from ${endpoint}:`, error);
    }
  };

  // ---- Load data and favourites ----
  useEffect(() => {
    fetchSeries('tv/top_rated', setTopSeries, 'top', topPage);
    fetchSeries('tv/on_the_air', setLatestSeries, 'latest', latestPage);
    fetchSeries('tv/airing_today', setUpcomingSeries, 'upcoming', upcomingPage);
    fetchSeries('tv/popular', setAllSeries, 'all', allPage);

    (async () => {
      try {
        const localFavourites = localStorage.getItem("favouritesSeries");
        let favs: SeriesWithCategories[];
        if (localFavourites) {
          favs = JSON.parse(localFavourites);
          setFavourites(favs);
        } else {
          favs = await getAllFavouritesFromDB();
          setFavourites(favs);
          localStorage.setItem("favouritesSeries", JSON.stringify(favs));
        }

        const sessionUser = sessionStorage.getItem("sessionUser");
        if (sessionUser) {
          const recs = await getSeriesRecommendations(favs);
          setRecommendedSeries(recs.map((series) => ({
            ...series,
            categories: ["recommended"],
          })));
        } else {
          setRecommendedSeries([]);
        }
      } catch (err) {
        console.error("Failed to load favourites or recommendations:", err);
      }
    })();
  }, [topPage, latestPage, upcomingPage, allPage, favourites.length]);

  const toggleFavourite = async (series: SeriesWithCategories) => {
    const sessionUser = sessionStorage.getItem("sessionUser");
    if (!sessionUser) {
      setMessage("You need to log in to add a series to favourites.");
      return;
    }

    const isAlreadyFavourite = favourites.some(fav => fav.id === series.id);

    if (isAlreadyFavourite) {
      const updated = favourites.filter(fav => fav.id !== series.id);
      setFavourites(updated);
      localStorage.setItem("favouritesSeries", JSON.stringify(updated));
      await removeFavouriteFromDB(series.id);
    } else {
      const updated = [...favourites, series];
      setFavourites(updated);
      localStorage.setItem("favouritesSeries", JSON.stringify(updated));
      await saveFavouriteToDB(series);
    }
  };

  const isFavourite = (seriesId: number) => favourites.some(fav => fav.id === seriesId);

  const scrollHorizontally = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = ref.current.clientWidth;
      ref.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const renderSeriesRow = (
    title: string,
    series: SeriesWithCategories[],
    ref: React.RefObject<HTMLDivElement | null>,
    sectionId: string,
    page: number,
    setPage: React.Dispatch<React.SetStateAction<number>>
  ) => {
    const totalPages = 500;

    const renderPaginationItems = () => {
      const items = [];

      items.push(
        <button key="prev" onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1} className={styles.paginationItem}>
          &lt;
        </button>
      );

      items.push(
        <button key={1} onClick={() => setPage(1)} className={`${styles.paginationItem} ${page === 1 ? styles.active : ''}`}>
          1
        </button>
      );

      if (page > 3) {
        items.push(<span key="ellipsis-start" className={styles.paginationEllipsis}>...</span>);
      }

      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        items.push(
          <button key={i} onClick={() => setPage(i)} className={`${styles.paginationItem} ${page === i ? styles.active : ''}`}>
            {i}
          </button>
        );
      }

      if (page < totalPages - 2) {
        items.push(<span key="ellipsis-end" className={styles.paginationEllipsis}>...</span>);
      }

      if (totalPages > 1 && page !== totalPages) {
        items.push(
          <button key={totalPages} onClick={() => setPage(totalPages)} className={`${styles.paginationItem} ${page === totalPages ? styles.active : ''}`}>
            {totalPages}
          </button>
        );
      }

      items.push(
        <button key="next" onClick={() => setPage(prev => prev + 1)} className={styles.paginationItem}>
          &gt;
        </button>
      );

      return items;
    };

    return (
      <section className={styles.seriesRowContainer} id={sectionId}>
        <h2 className={styles.rowTitle}>{title}</h2>
        <div className={styles.seriesListWrapper}>
          <button className={`${styles.scrollButton} ${styles.scrollButtonLeft}`} onClick={() => scrollHorizontally(ref, 'left')}>&lt;</button>
          <div className={styles.seriesList} ref={ref}>
            {series.map(s => (
              <SeriesCard
                key={s.id}
                series={s}
                onToggleFavourite={() => toggleFavourite(s)}
                isFavourite={isFavourite(s.id)}
              />
            ))}
          </div>
          <button className={`${styles.scrollButton} ${styles.scrollButtonRight}`} onClick={() => scrollHorizontally(ref, 'right')}>&gt;</button>
        </div>
        {title !== "My Favourites" && title !== "Recommended For You" && (
          <div className={styles.pagination}>{renderPaginationItems()}</div>
        )}
      </section>
    );
  };

  return (
    <div className={styles.series}>
      <Navbar />
      <main>
        {recommendedSeries.length > 0 &&
          renderSeriesRow("Recommended For You", recommendedSeries, recommendedRef, "recommended-series-section", 1, () => {})}
        {favourites.length > 0 &&
          renderSeriesRow("My Favourites", favourites, favouritesRef, "favourites-section", 1, () => {})}
        {renderSeriesRow("All TV Shows", allSeries, allSeriesRef, "all-series-section", allPage, setAllPage)}
        {renderSeriesRow("Top Series", topSeries, topSeriesRef, "top-series-section", topPage, setTopPage)}
        {renderSeriesRow("Latest TV Shows", latestSeries, latestSeriesRef, "latest-series-section", latestPage, setLatestPage)}
        {renderSeriesRow("Coming This Year", upcomingSeries, upcomingSeriesRef, "upcoming-series-section", upcomingPage, setUpcomingPage)}
      </main>

      {message && (
        <Message text={message} type="error" onClose={() => setMessage(null)} />
      )}
    </div>
  );
};

export default Series;