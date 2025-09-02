import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '../pages/Home';
import axios from 'axios'; 
import * as recommendation from '../utils/recommendation';
import * as idb from 'idb';
import { BrowserRouter } from 'react-router-dom';

// --- Mocking Dependencies ---

// Use a type assertion to correctly type the mock
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the recommendation utility
jest.mock('../utils/recommendation');
const mockedGetRecommendations = recommendation.getRecommendations as jest.Mock;

// Mock the IndexedDB utility functions
const mockOpenDB = jest.fn();
const mockSaveFav = jest.fn();
const mockRemoveFav = jest.fn();
const mockGetAllFavs = jest.fn();

jest.mock('idb', () => ({
  openDB: jest.fn(() => ({
    objectStoreNames: { contains: jest.fn(() => true) },
  })),
}));

// Mock `localStorage` and `sessionStorage`
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key],
    setItem: (key: string, value: string) => (store[key] = value),
    clear: () => (store = {}),
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key],
    setItem: (key: string, value: string) => (store[key] = value),
    clear: () => (store = {}),
  };
})();
Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock });

// Mock data
const mockMovies = [
  { id: 1, title: 'Movie 1', poster_path: '/poster1.jpg' },
  { id: 2, title: 'Movie 2', poster_path: '/poster2.jpg' },
];
const mockFavourites = [{ id: 3, title: 'Fav Movie', poster_path: '/fav.jpg' }];

describe('Home Component', () => {
  // Reset mocks before each test
  beforeEach(() => {
    mockedAxios.get.mockReset();
    mockedGetRecommendations.mockReset();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders without crashing and fetches movie categories', async () => {
    // Set up mock responses for all API calls
    mockedAxios.get.mockResolvedValue({ data: { results: mockMovies } });
    mockedGetRecommendations.mockResolvedValue([]);
    (idb.openDB as jest.Mock).mockResolvedValue({
      transaction: () => ({
        objectStore: () => ({
          getAll: jest.fn(() => ({
            onsuccess: (cb: any) => cb({ target: { result: [] } }),
          })),
        }),
      }),
    });

    
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('All Movies')).toBeInTheDocument();
      expect(screen.getByText('Top Movies')).toBeInTheDocument();
      expect(screen.getByText('Latest Movies')).toBeInTheDocument();
      expect(screen.getByText('Coming This Year')).toBeInTheDocument();
    });

    // Check if the movie cards are rendered
    expect(screen.getAllByText('Movie 1')).toHaveLength(4); // One for each category fetch
  });

  it('displays a login message when trying to favourite without being logged in', async () => {
    mockedAxios.get.mockResolvedValue({ data: { results: mockMovies } });
    mockedGetRecommendations.mockResolvedValue([]);
    (idb.openDB as jest.Mock).mockResolvedValue({
      transaction: () => ({
        objectStore: () => ({
          getAll: jest.fn(() => ({
            onsuccess: (cb: any) => cb({ target: { result: [] } }),
          })),
        }),
      }),
    });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getAllByText('Movie 1')).toHaveLength(4));

    // Simulate a click on the heart icon of the first movie card
    const heartIcon = screen.getAllByRole('button', { name: /favourite/i })[0];
    fireEvent.click(heartIcon);

    // Expect the message to be displayed
    await waitFor(() => {
      expect(screen.getByText('You need to log in to add a movie to favourites.')).toBeInTheDocument();
    });
  });

  it('allows a logged-in user to add a movie to favourites', async () => {
    sessionStorage.setItem('sessionUser', 'testuser');
    mockedAxios.get.mockResolvedValue({ data: { results: mockMovies } });
    mockedGetRecommendations.mockResolvedValue([]);
    const mockPut = jest.fn();
    (idb.openDB as jest.Mock).mockResolvedValue({
      transaction: () => ({
        objectStore: () => ({
          put: mockPut,
          getAll: jest.fn(() => ({
            onsuccess: (cb: any) => cb({ target: { result: [] } }),
          })),
        }),
      }),
    });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getAllByText('Movie 1')).toHaveLength(4));

    // Check initial state: no favorites section
    expect(screen.queryByText('My Favourites')).toBeNull();

    // Click the heart icon on the first movie card
    const heartIcon = screen.getAllByRole('button', { name: /favourite/i })[0];
    fireEvent.click(heartIcon);

    // Wait for the favourites section to appear
    await waitFor(() => {
      expect(screen.getByText('My Favourites')).toBeInTheDocument();
      expect(screen.getByText('Movie 1')).toBeInTheDocument();
    });

    // Check if the IndexedDB `put` function was called
    expect(mockPut).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });
});