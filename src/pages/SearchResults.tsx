import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import styles from '../styles/searchstyles/search.module.css';
import Navbar from '../components/Navbar';

const API_KEY = 'dfac1aa5cb807fcf17cb9a1914e1c132';
const API_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

interface SearchResult {
    id: number;
    title?: string;
    name?: string;
    poster_path?: string;
    profile_path?: string;
    media_type: 'movie' | 'tv' | 'person';
    release_date?: string;
    first_air_date?: string;
    vote_average?: number;
}

const SearchResults: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const params = new URLSearchParams(location.search);
    const query = params.get('query') || '';

    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [favorites, setFavorites] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSearchResults = useCallback(async (searchQuery: string) => {
        if (!searchQuery) {
            setSearchResults([]);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `${API_BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}`
            );
            if (!response.ok) throw new Error('Failed to fetch data from TMDb.');
            const data = await response.json();
            setSearchResults(
                data.results.filter(
                    (item: SearchResult) =>
                        item.media_type === 'movie' ||
                        item.media_type === 'tv' ||
                        item.media_type === 'person'
                )
            );
        } catch (err) {
            setError('An error occurred while fetching search results.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (query) {
            fetchSearchResults(query);
        }
    }, [query, fetchSearchResults]);

    const toggleFavorite = (id: number) => {
        setFavorites((prev) => {
            const updated = new Set(prev);
            if (updated.has(id)) updated.delete(id);
            else updated.add(id);
            return updated;
        });
    };

    const handleActorClick = (actorId: number) => {
        navigate(`/actors/${actorId}`);
    };

    const handleFavoriteClick = (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(id);
    };

    const renderMovieShowResults = () => {
        const moviesAndShows = searchResults.filter(
            (item) => item.media_type === 'movie' || item.media_type === 'tv'
        );
        if (moviesAndShows.length === 0) return null;

        return (
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Movies & TV Shows</h2>
                <div className={styles.moviesShowsGrid}>
                    {moviesAndShows.map((item) => (
                        <Link
                            key={item.id}
                            to={item.media_type === 'movie' ? `/movie/${item.id}` : `/series/${item.id}`}
                            className={styles.movieShowCard}
                        >
                            <div className={styles.posterContainer}>
                                {item.poster_path ? (
                                    <img
                                        src={`${IMAGE_BASE_URL}w300${item.poster_path}`}
                                        alt={item.title || item.name}
                                        className={styles.posterImage}
                                    />
                                ) : (
                                    <div className={styles.posterPlaceholder}>No Poster</div>
                                )}
                                <div className={styles.cardOverlay}>
                                    <span className={styles.cardYear}>
                                        {item.media_type === 'movie'
                                            ? item.release_date?.substring(0, 4) || 'N/A'
                                            : item.first_air_date?.substring(0, 4) || 'N/A'}
                                    </span>
                                    <svg
    onClick={(e) => handleFavoriteClick(e, item.id)}
    className={styles.heartIcon}
    width="25"
    height="25"
    viewBox="0 0 24 24"
    style={{ 
        cursor: 'pointer',
        fill: favorites.has(item.id) ? 'red' : 'transparent', 
        stroke: favorites.has(item.id) ? 'red' : 'red', 
        strokeWidth: '2' 
    }}
>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 
        2 8.5C2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 
        4.5 2.09C13.09 3.81 14.76 3 16.5 3C19.58 3 
        22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 
        11.54L12 21.35z" />
</svg>
                                </div>
                            </div>
                            <div className={styles.cardInfo}>
                                <h3 className={styles.cardTitle}>{item.title || item.name}</h3>
                                <p className={styles.cardRating}>
                                    Rating: {item.vote_average?.toFixed(1) || 'N/A'}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        );
    };

    const renderActorResults = () => {
        const actors = searchResults.filter((item) => item.media_type === 'person');
        if (actors.length === 0) return null;

        return (
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Actors</h2>
                <div className={styles.actorsGrid}>
                    {actors.map((actor) => (
                        <div
                            key={actor.id}
                            className={styles.actorCard}
                            onClick={() => handleActorClick(actor.id)}
                        >
                            <div className={styles.actorImageContainer}>
                                {actor.profile_path ? (
                                    <img
                                        src={`${IMAGE_BASE_URL}w200${actor.profile_path}`}
                                        alt={actor.name}
                                        className={styles.actorImage}
                                    />
                                ) : (
                                    <div className={styles.actorPlaceholder}>?</div>
                                )}
                            </div>
                            <p className={styles.actorName}>{actor.name}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (isLoading) return <div className={styles.statusMessage}>Loading...</div>;
    if (error) return <div className={styles.statusMessage}>{error}</div>;
    if (query && searchResults.length === 0 && !isLoading) {
        return <div className={styles.statusMessage}>No results found for "{query}".</div>;
    }

    return (
        <div className={styles.container}>
            <Navbar />
            <h1 className={styles.pageTitle}>Search Results for: "{query}"</h1>
            {renderMovieShowResults()}
            {renderActorResults()}
        </div>
    );
};

export default SearchResults;