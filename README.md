 **MovieHub - React Movie Database Application**

A full-featured movie and TV show database web application built with React 18 and TypeScript. It integrates the TMDB API to deliver rich movie, series, and actor data, combined with user authentication, favorites, and personalized recommendations.The application focuses on performance, usability, and a responsive experience across all devices.

## Overview
MovieHub allows users to explore movies, TV shows, and actors in depth while maintaining personalized preferences such as favorites and recommendations. User sessions are handled locally, making the app fast, secure, and easy to use without a backend.


## Features
1. Authentication & User Management
The authentication system supports user registration and login with client-side validation. Sessions are persisted using sessionStorage, while user data and favorites are stored securely in IndexedDB.
Key capabilities include:
-Email and password validation

-Password confirmation and basic in-memory hashing (demo purpose)

-Session persistence across page refreshes

-Automatic redirection after successful login

-Protected access to user-specific features such as favorites

2. Movie & TV Show Browsing
Users can browse a wide range of movie and TV content sourced directly from TMDB. Each title has a dedicated details page with extensive metadata.

Features include:
-Popular, top-rated, and latest movies and TV shows

-Detailed pages with synopsis, cast, crew, and trailers

-Similar content recommendations

-Display of ratings and user reviews

3. Actor Profiles
Actor pages provide comprehensive information about cast members, allowing users to explore their careers across both movies and TV shows.

Highlights:
-Full actor biographies

-Combined movie and TV credits

-Paginated filmography browsing

-Ability to favorite individual actor works

4. Search Feature
MovieHub offers a unified, real-time search system across multiple categories.

Users can:
-Search movies, TV shows, and actors simultaneously

-View results in a responsive overlay interface

-Navigate directly to detail pages

-Add or remove items from favorites directly from results

5. Favorites 
Favorites are deeply integrated across the application and are available only to authenticated users.

The system supports:
-Favoriting movies, TV shows, and actor credits

-Persistent storage using IndexedDB

-Organization by category and genre

-Instant visual feedback using heart icons

6. Recommendations
MovieHub includes a hybrid recommendation engine that adapts as users interact with content.

Recommendation logic includes:
-Content-based filtering using genre preferences

-Collaborative filtering based on similar user behavior

-Automatic fallback to popular content when insufficient data exists

-Real-time updates as favorites change

7. Responsive Design
The UI is fully responsive and optimized for mobile, tablet and desktop screens.

Notable design features:
-Mobile-friendly hamburger navigation

-Genre dropdown with 19+ categories

-Responsive grid layouts

-Keyboard-friendly search overlay

8. Technology Stack

i.Frontend: React 18 + TypeScript

ii. Routing: React Router DOM

iii. State Management: React Hooks (useState, useEffect, useContext)

iv. API Communication: Axios

v. Local Database: IndexedDB

vi. Styling: CSS Modules

vii. Icons: React Icons

viii. Testing: Jest & React Testing Library

**Installation & Setup**
Prerequisites
*Node.js v16 or higher
*npm or yarn
*A free TMDB API key

## Setup Steps

Clone the repository:
git clone <repository-url>
cd moviehub

Install dependencies:
npm install
# or
yarn install


Create a .env file in the root directory and add your TMDB API key:
REACT_APP_TMDB_API_KEY=your_tmdb_api_key_here

Start the development server:
npm start
# or
yarn start

Open http://localhost:3000 to view the app in your browser.

## Testing
To run the test suite, use:
npm test

# or
yarn test
