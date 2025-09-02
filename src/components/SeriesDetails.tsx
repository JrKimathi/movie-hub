import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";
import styles from "../styles/seriesstyles/seriesdetails.module.css";

interface SeriesDetails {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  first_air_date: string;
  number_of_seasons: number;
  number_of_episodes: number;
  vote_average: number;
  vote_count: number;
  popularity: number;
  status: string;
  original_language: string;
}

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface Review {
  id: string;
  author: string;
  content: string;
  created_at: string;
  author_details: {
    avatar_path: string | null;
  };
}

interface Video {
  key: string;
  type: string;
  site: string;
  name: string;
}

interface SimilarSeries {
  id: number;
  name: string;
  poster_path: string | null;
}

const API_KEY = "dfac1aa5cb807fcf17cb9a1914e1c132";
const BASE_URL = "https://api.themoviedb.org/3";

const SeriesDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [series, setSeries] = useState<SeriesDetails | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similarSeries, setSimilarSeries] = useState<SimilarSeries[]>([]);
  const [trailer, setTrailer] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSeriesData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [seriesRes, creditsRes, reviewsRes, videosRes, similarRes] = await Promise.all([
          axios.get(`${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=en-US`),
          axios.get(`${BASE_URL}/tv/${id}/credits?api_key=${API_KEY}&language=en-US`),
          axios.get(`${BASE_URL}/tv/${id}/reviews?api_key=${API_KEY}&language=en-US`),
          axios.get(`${BASE_URL}/tv/${id}/videos?api_key=${API_KEY}&language=en-US`),
          axios.get(`${BASE_URL}/tv/${id}/similar?api_key=${API_KEY}&language=en-US`),
        ]);

        setSeries(seriesRes.data);
        setCast(creditsRes.data.cast.slice(0, 30));
        setReviews(reviewsRes.data.results);
        setSimilarSeries(similarRes.data.results);

        const trailerVideo = videosRes.data.results.find(
          (video: Video) => video.type === "Trailer" && video.site === "YouTube"
        );
        setTrailer(trailerVideo || null);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching series data:", err);
        setError("Failed to load series details. Please check the ID and try again.");
        setLoading(false);
      }
    };

    if (id) fetchSeriesData();
  }, [id]);

  const getAvatar = (avatarPath: string | null, author: string) => {
    if (!avatarPath) {
      return `https://placehold.co/100x100/${Math.floor(Math.random() * 16777215).toString(16)}/ffffff?text=${author.charAt(0).toUpperCase()}`;
    }
    return avatarPath.startsWith("/https")
      ? avatarPath.substring(1)
      : `https://image.tmdb.org/t/p/w200${avatarPath}`;
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!series) return <div className={styles.noData}>No series details found.</div>;

  const posterUrl = series.poster_path
    ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Image";

  return (
    <div className={styles.movieDetailsPage}>
      <Navbar />
      <main className={styles.container}>
        <div className={styles.header}>
          <img src={posterUrl} alt={series.name} className={styles.poster} />
          <div className={styles.info}>
            <h1>{series.name}</h1>
            <p><strong>Original Name:</strong> {series.original_name}</p>
            <p><strong>First Air Date:</strong> {series.first_air_date}</p>
            <p><strong>Status:</strong> {series.status}</p>
            <p><strong>Seasons:</strong> {series.number_of_seasons}</p>
            <p><strong>Episodes:</strong> {series.number_of_episodes}</p>
            <p><strong>Language:</strong> {series.original_language.toUpperCase()}</p>
            <p><strong>Popularity:</strong> {series.popularity.toFixed(2)}</p>
            <p><strong>Rating:</strong> {series.vote_average.toFixed(1)} / 10 ({series.vote_count} votes)</p>
          </div>
        </div>

        {/* Overview */}
        <div className={styles.overview}>
          <h2>Overview</h2>
          <p>{series.overview || "No description available."}</p>
        </div>

        <div className={styles.cast}>
          <h2>Cast</h2>
          <div className={styles.castList}>
            {cast.slice(0, 10).map((actor) => (
              <Link key={actor.id} to={`/actors/${actor.id}`} className={styles.castMember}>
                <img
                  src={actor.profile_path ? `https://image.tmdb.org/t/p/w200${actor.profile_path}` : "https://via.placeholder.com/150x225?text=No+Image"}
                  alt={actor.name}
                />
                <p>{actor.name}</p>
                <p className={styles.character}>as {actor.character}</p>
              </Link>
            ))}
          </div>
        </div>
        
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Similar TV Shows to {series.name}</h2>
          <ul className={styles.similarMoviesList}>
            {similarSeries.slice(0, 9).map((similar, index) => (
              <li key={similar.id} className={styles.similarMovieItem}>
                <span className={styles.similarMovieIndex}>{index + 1}.</span>
                <Link to={`/series/${similar.id}`} className={styles.similarMovieTitle}>
                  {similar.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className={styles.reviews}>
          <h2>User Reviews</h2>
          {reviews.length > 0 ? (
            reviews.slice(0, 5).map((review) => (
              <div key={review.id} className={styles.reviewCard}>
                 <div className={styles.reviewHeader}>
                  <img
                    src={getAvatar(review.author_details.avatar_path, review.author)}
                    alt={`${review.author}'s avatar`}
                    className={styles.reviewAvatar}
                  />
                  <span className={styles.reviewAuthor}>{review.author}</span>
                </div>
                <p className={styles.reviewContent}>{review.content}</p>
              </div>
            ))
          ) : (
            <p className={styles.noReviewsMessage}>No reviews available.</p>
          )}
        </div>

        {trailer && (
          <div className={styles.trailer}>
            <h2>Trailer</h2>
            <iframe
              width="100%"
              height="500"
              src={`https://www.youtube.com/embed/${trailer.key}`}
              title={trailer.name}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        )}
      </main>
    </div>
  );
};

export default SeriesDetails;