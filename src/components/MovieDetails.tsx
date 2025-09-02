import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom"; 
import axios from "axios";
import styles from "../styles/moviedetailstyles/moviedetails.module.css";
import Navbar from "./Navbar";

interface MovieDetails {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  runtime: number;
  popularity: number;
  vote_average: number;
  vote_count: number;
  original_language: string;
  status: string;
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

interface SimilarMovie {
  id: number;
  title: string;
  poster_path: string | null;
}

interface Video {
  key: string;
  type: string;
  site: string;
  name: string;
}

const API_KEY = "dfac1aa5cb807fcf17cb9a1914e1c132";
const BASE_URL = "https://api.themoviedb.org/3";

const MovieDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similarMovies, setSimilarMovies] = useState<SimilarMovie[]>([]);
  const [trailer, setTrailer] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllDetails = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [movieRes, castRes, reviewsRes, similarRes, videosRes] = await Promise.all([
          axios.get(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=en-US`),
          axios.get(`${BASE_URL}/movie/${id}/credits?api_key=${API_KEY}&language=en-US`),
          axios.get(`${BASE_URL}/movie/${id}/reviews?api_key=${API_KEY}&language=en-US`),
          axios.get(`${BASE_URL}/movie/${id}/similar?api_key=${API_KEY}&language=en-US`),
          axios.get(`${BASE_URL}/movie/${id}/videos?api_key=${API_KEY}&language=en-US`),
        ]);

        setMovie(movieRes.data);
        setCast(castRes.data.cast.slice(0, 30));
        setReviews(reviewsRes.data.results);
        setSimilarMovies(similarRes.data.results);
        
        const trailerVideo = videosRes.data.results.find(
          (video: Video) => video.type === "Trailer" && video.site === "YouTube"
        );
        setTrailer(trailerVideo || null);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching movie details:", err);
        setError("Failed to load movie details.");
        setLoading(false);
      }
    };

    fetchAllDetails();
  }, [id]);

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!movie) return <div className={styles.noData}>No movie details found.</div>;

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Image";

  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A";

  const formatReviewDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    return new Date(date).toLocaleDateString();
  };

  const getAvatar = (avatarPath: string | null, author: string) => {
    if (!avatarPath) {
      return `https://placehold.co/100x100/${Math.floor(Math.random() * 16777215).toString(
        16
      )}/ffffff?text=${author.charAt(0).toUpperCase()}`;
    }
    return avatarPath.startsWith("/https")
      ? avatarPath.substring(1)
      : `https://image.tmdb.org/t/p/w200${avatarPath}`;
  };

  return (
    <div className={styles.movieDetailsPage}>
      <Navbar />
      <main className={styles.container}>
        <div className={styles.header}>
          <img src={posterUrl} alt={movie.title} className={styles.poster} />
          <div className={styles.info}>
            <h1>{movie.title}</h1>
            <p className={styles.originalTitle}>Original Title: {movie.original_title}</p>
            <p><strong>Release Year:</strong> {releaseYear}</p>
            <p><strong>Status:</strong> {movie.status}</p>
            <p><strong>Release Date:</strong> {movie.release_date}</p>
            <p><strong>Duration:</strong> {movie.runtime ? `${movie.runtime} min` : "N/A"}</p>
            <p><strong>Language:</strong> {movie.original_language.toUpperCase()}</p>
            <p><strong>Popularity:</strong> {movie.popularity.toFixed(2)}</p>
            <p className={styles.rating}>
              <strong>Rating:</strong> {movie.vote_average.toFixed(1)} / 10 ({movie.vote_count} votes)
            </p>
          </div>
        </div>

        <div className={styles.overview}>
          <h2>Overview</h2>
          <p>{movie.overview || "No description available."}</p>
        </div>

        {/* Cast & Crew Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Cast & Crew</h2>
          <div className={styles.castContainer}>
            {cast.map((member) => (
              <Link
                key={member.id}
                to={`/actors/${member.id}`} 
                className={styles.castCard}
              >
                <img
                  src={
                    member.profile_path
                      ? `https://image.tmdb.org/t/p/w200${member.profile_path}`
                      : `https://placehold.co/200x300?text=No+Image`
                  }
                  alt={member.name}
                  className={styles.castImage}
                />
                <h3 className={styles.castName}>{member.name}</h3>
                <p className={styles.castCharacter}>{member.character}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Similar Movies Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Similar Movies to {movie.title}</h2>
          <ul className={styles.similarMoviesList}>
            {similarMovies.slice(0, 9).map((similar, index) => (
              <li key={similar.id} className={styles.similarMovieItem}>
                <span className={styles.similarMovieIndex}>{index + 1}.</span>
                <Link to={`/movie/${similar.id}`} className={styles.similarMovieTitle}>
                  {similar.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Reviews Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Reviews</h2>
          <div className={styles.reviewsContainer}>
            {reviews.length > 0 ? (
              reviews
                .filter((review) => review.content.split(" ").length < 250)
                .map((review) => (
                  <div key={review.id} className={styles.reviewCard}>
                    <div className={styles.reviewHeader}>
                      <img
                        src={getAvatar(review.author_details.avatar_path, review.author)}
                        alt={`${review.author}'s avatar`}
                        className={styles.reviewAvatar}
                      />
                      <div className={styles.reviewAuthorInfo}>
                        <span className={styles.reviewAuthor}>{review.author}</span>
                        <span className={styles.reviewDate}>
                          {formatReviewDate(review.created_at)}
                        </span>
                      </div>
                    </div>
                    <p className={styles.reviewContent}>{review.content}</p>
                  </div>
                ))
            ) : (
              <p className={styles.noReviewsMessage}>No reviews yet.</p>
            )}
          </div>
        </section>

        {/* Trailer Section */}
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

export default MovieDetails;