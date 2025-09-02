import React from 'react';
import { useNavigate } from "react-router-dom";
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { IconType } from 'react-icons';
import styles from './SeriesCard.module.css';

interface Series {
  id: number;
  name?: string;
  original_name?: string;
  poster_path: string | null;
  first_air_date?: string;
  vote_average?: number;
}

interface IconProps {
  icon: IconType;
  className?: string;
}

const Icon = ({ icon: IconComp, className }: IconProps) => {
  const Comp = IconComp as React.ComponentType<{ className?: string }>;
  return <Comp className={className} />;
};

interface SeriesCardProps {
  series: Series;
  onToggleFavourite: (series: Series) => void;
  isFavourite: boolean;
}

const SeriesCard: React.FC<SeriesCardProps> = ({ series, onToggleFavourite, isFavourite }) => {
  const navigate = useNavigate();

  const title = series.name || series.original_name || 'Untitled';
  const posterUrl = series.poster_path
    ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
    : 'https://via.placeholder.com/500x750?text=No+Image';
  const releaseYear = series.first_air_date?.split('-')[0] || 'N/A';

  return (
    <div 
      className={styles.seriesCard}
      onClick={() => navigate(`/series/${series.id}`)}
    >
      <div className={styles.posterContainer}>
        <img src={posterUrl} alt={title} className={styles.poster} />
        <div className={styles.yearOverlay}>{releaseYear}</div>

        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            onToggleFavourite(series); 
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
        <div className={styles.releaseYear}>Rating: {series.vote_average?.toFixed(1) || 'N/A'}</div>
      </div>
    </div>
    
  );
};

export default SeriesCard;
