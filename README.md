# MovieHub

MovieHub is a responsive movie and TV show discovery web application built with React 18, TypeScript, and the TMDB API. It supports authentication, favourites, search, actor profiles, detailed movie and TV pages, and personalized recommendations.

## Live Demo

The application is deployed on Vercel:

https://your-vercel-url.vercel.app

Replace the URL above with your actual Vercel deployment link.

## Features

- User authentication with client-side validation
- Session persistence using sessionStorage
- Favourites stored in IndexedDB
- Browse popular, top-rated, latest, and upcoming movies
- Browse popular, top-rated, latest, and upcoming TV shows
- Detailed movie and TV show pages with cast, reviews, trailers, and similar titles
- Actor profiles with biographies and paginated filmography
- Unified search across movies, TV shows, and actors
- Personalized recommendations based on favourites
- Responsive layout for mobile, tablet, and desktop
- Genre browsing with more than 19 categories

## Tech Stack

- React 18
- TypeScript
- React Router DOM
- Axios
- IndexedDB
- CSS Modules
- React Icons
- Jest and React Testing Library
- TMDB API

## Getting Started

### Prerequisites

- Node.js v16 or higher
- npm or yarn
- A TMDB API key

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd moviehub