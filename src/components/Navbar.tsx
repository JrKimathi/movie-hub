import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../styles/navStyles/navbar.module.css';
import SearchOverlay from '../components/SearchOverlay';

const genres = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 10770, name: 'TV Movie' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
];

const Navbar: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isGenresOpen, setIsGenresOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const sessionUser = sessionStorage.getItem('sessionUser');
    if (sessionUser) {
      setIsLoggedIn(true);
    }
    const handleClickOutside = (event: MouseEvent) => {
      // Logic for closing genres dropdown when clicking outside
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsGenresOpen(false);
      }
      // New logic to close mobile menu when clicking outside
      const mobileMenu = document.querySelector(`.${styles.navLinks}`);
      const hamburger = document.querySelector(`.${styles.hamburgerMenu}`);
      if (mobileMenu && !mobileMenu.contains(event.target as Node) && hamburger && !hamburger.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // New useEffect hook to toggle body scroll
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to ensure scrolling is re-enabled on component unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMenus = () => {
    setIsMobileMenuOpen(false);
    setIsGenresOpen(false);
  };

  const handleGenreClick = (genreId: number) => {
    closeMenus();
    navigate(`/genres/${genreId}`);
  };

  const handleLoginClick = () => {
    closeMenus();
    navigate('/auth?tab=login');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('sessionUser');
    setIsLoggedIn(false);
    closeMenus();
    navigate('/auth');
  };

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.navbarContainer}>
          <div className={styles.logo}>
            <Link to="/" onClick={closeMenus}>
              <svg
                className={styles.logoIcon}
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M7 6V18L18 12L7 6Z" fill="currentColor" />
              </svg>
              Movies
            </Link>
          </div>
          <ul className={`${styles.navLinks} ${isMobileMenuOpen ? styles.open : ''}`}>
            <li><Link to="/home" onClick={closeMenus}>Movies</Link></li>
            <li><Link to="/series" onClick={closeMenus}>Series</Link></li>
            <li><Link to="/actors" onClick={closeMenus}>Actors</Link></li>
            <li
              className={styles.dropdown}
              onMouseEnter={() => window.innerWidth > 768 && setIsGenresOpen(true)}
              onMouseLeave={() => window.innerWidth > 768 && setIsGenresOpen(false)}
              onClick={() => setIsGenresOpen(!isGenresOpen)}
              ref={dropdownRef}
            >
              <a href="#!">
                Genres
                <svg
                  className={`${styles.dropdownIcon} ${isGenresOpen ? styles.open : ''}`}
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M8 12L4 8H12L8 12Z" fill="currentColor" />
                </svg>
              </a>
              {isGenresOpen && (
                <ul className={styles.dropdownMenu}>
                  {genres.map((genre) => (
                    <li key={genre.id}>
                      <Link
                        to={`/genres/${genre.id}`}
                        onClick={() => handleGenreClick(genre.id)}
                      >
                        {genre.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          </ul>
          <div className={styles.rightSection}>
            <div className={styles.searchIcon} onClick={toggleSearch}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15.5 14L19.5 18M18 9C18 13.9706 13.9706 18 9 18C4.02944 18 0 13.9706 0 9C0 4.02944 4.02944 0 9 0C13.9706 0 18 4.02944 18 9Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {isLoggedIn ? (
              <button className={styles.loginBtn} onClick={handleLogout}>
                Log out
              </button>
            ) : (
              <button className={styles.loginBtn} onClick={handleLoginClick}>
                Log in
              </button>
            )}
            <div className={styles.hamburgerMenu} onClick={toggleMobileMenu}>
              {isMobileMenuOpen ? (
                // Close Icon (X)
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                // Hamburger Icon
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>
        </div>
      </nav>
      {isSearchOpen && <SearchOverlay onClose={toggleSearch} />}
    </>
  );
};

export default Navbar;