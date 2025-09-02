import React from 'react';
import { useNavigate } from "react-router-dom";
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { IconType } from 'react-icons';
import styles from '../styles/moviecardstyles/MovieCard.module.css';
import { Movie } from '../types';

interface IconProps {
  icon: IconType;
  className?: string;
}

const Icon = ({ icon: IconComp, className }: IconProps) => {
  const Comp = IconComp as React.ComponentType<{ className?: string }>;
  return <Comp className={className} />;
};

interface MovieCardProps {
  movie: Movie;
  onToggleFavourite: (movie: Movie) => void;
  isFavourite: boolean;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onToggleFavourite, isFavourite }) => {
  const navigate = useNavigate();

  const title = movie.title || movie.original_title || movie.name || 'Untitled';
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://via.placeholder.com/500x750?text=No+Image';
  const releaseYear = movie.release_date?.split('-')[0] || 'N/A';
  const rating = movie.vote_average ?? 0;

  return (
    <div 
      className={styles.movieCard}
      onClick={() => navigate(`/movie/${movie.id}`)} 
    >
      <div className={styles.posterContainer}>
        <img src={posterUrl} alt={title} className={styles.poster} />
        <div className={styles.yearOverlay}>{releaseYear}</div>

        {/* Stop propagation so favourite button doesn't trigger navigation */}
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            onToggleFavourite(movie); 
          }} 
          className={styles.favouriteButton}
        >
          {isFavourite 
            ? <Icon icon={FaHeart} className={styles.heartIcon} /> 
            : <Icon icon={FaRegHeart} className={styles.heartIcon} />}
        </button>
      </div>
      <div className={styles.info}>
        <div className={styles.title}>{title}</div>
        <div className={styles.releaseYear}>{releaseYear}</div>
        <div className={styles.rating}>Rating: {rating.toFixed(1)}</div>
      </div>
    </div>
  );
};

export default MovieCard;
