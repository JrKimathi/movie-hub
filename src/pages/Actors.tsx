import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import styles from '../styles/actorsstyles/actors.module.css';

interface Actor {
  id: number;
  name: string;
  profile_path: string | null;
  popularity: number;
}

const API_KEY = "dfac1aa5cb807fcf17cb9a1914e1c132";
const BASE_URL = "https://api.themoviedb.org/3";

const ActorCard: React.FC<{ actor: Actor }> = ({ actor }) => {
  const navigate = useNavigate();
  const profileUrl = actor.profile_path
    ? `https://image.tmdb.org/t/p/w500${actor.profile_path}`
    : 'https://via.placeholder.com/500x500?text=No+Image';

  const roundedPopularity = Math.round(actor.popularity);

  return (
    <div className={styles.actorCard} onClick={() => navigate(`/actors/${actor.id}`)}>
      <img src={profileUrl} alt={actor.name} className={styles.actorImage} />
      <div className={styles.actorInfo}>
        <div className={styles.popularity}>{roundedPopularity}</div>
        <div className={styles.actorName}>{actor.name}</div>
      </div>
    </div>
  );
};

const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  const maxPagesToShow = 3;

  const getPageNumbers = () => {
    let pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= maxPagesToShow) {
        pages = [1, 2, 3, "...", totalPages];
      } else if (currentPage >= totalPages - 2) {
        pages = [1, "...", totalPages - 2, totalPages - 1, totalPages];
      } else {
        pages = [1, "...", currentPage, "...", totalPages];
      }
    }
    return pages;
  };

  return (
    <div className={styles.pagination}>
      <button
        className={styles.paginationButton}
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        &lt;
      </button>

      {getPageNumbers().map((page, index) =>
        typeof page === "string" ? (
          <span key={index} className={styles.ellipsis}>{page}</span>
        ) : (
          <button
            key={page}
            className={`${styles.paginationButton} ${currentPage === page ? styles.active : ""}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        )
      )}

      {/* Next button */}
      <button
        className={styles.paginationButton}
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        &gt;
      </button>
    </div>
  );
};

const Actors: React.FC = () => {
  const [actors, setActors] = useState<Actor[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchActors = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/person/popular?api_key=${API_KEY}&language=en-US&page=${currentPage}`
        );
        setActors(res.data.results);
        setTotalPages(res.data.total_pages);
      } catch (err) {
        console.error("Error fetching actors:", err);
      }
    };
    fetchActors();
  }, [currentPage]);

  return (
    <div className={styles.actorsPage}>
      <Navbar />
      <main>
        <section className={styles.actorsContainer}>
          <h2 className={styles.rowTitle}>Popular Actors</h2>
          <div className={styles.actorsGrid}>
            {actors.map(actor => <ActorCard key={actor.id} actor={actor} />)}
          </div>

          {/* Custom Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </section>
      </main>
    </div>
  );
};

export default Actors;
