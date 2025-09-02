import { getRecommendations } from '../utils/recommendation';
import * as idb from 'idb';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// --- Mocking Dependencies ---

// Mock IndexedDB
const mockHistory = [
  { id: 1, title: 'Terminator', genre_ids: [878] },
  { id: 2, title: 'The Matrix', genre_ids: [878] },
];

const mockFavourites = [
  { id: 3, title: 'Inception', genre_ids: [878, 28] },
  { id: 4, name: 'Friends', genre_ids: [35] },
];

jest.mock('idb', () => ({
  openDB: jest.fn(() => ({
    objectStoreNames: { contains: jest.fn(() => true) },
    getAll: jest.fn((storeName: string) => {
      if (storeName === 'searchHistory') return Promise.resolve(mockHistory);
      if (storeName === 'favourites') return Promise.resolve(mockFavourites);
      return Promise.resolve([]);
    }),
  })),
}));

// Mock API responses using MSW (Mock Service Worker)
const handlers = [
  // Mock content-based search
  http.get('https://api.themoviedb.org/3/search/multi', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query');
    let results = [];
    if (query === 'inception') {
      results = [{ id: 10, title: 'Inception 2' }];
    } else if (query === 'the matrix') {
      results = [{ id: 11, title: 'The Matrix Resurrections' }];
    } else if (query === 'friends') {
      results = [{ id: 12, name: 'Friends: The Reunion' }];
    }
    return HttpResponse.json({ results });
  }),

  // Mock collaborative (similar) movies
  http.get('https://api.themoviedb.org/3/movie/3/similar', () => {
    return HttpResponse.json({ results: [{ id: 13, title: 'Tenet' }] });
  }),
  http.get('https://api.themoviedb.org/3/tv/4/similar', () => {
    return HttpResponse.json({ results: [{ id: 14, name: 'Seinfeld' }] });
  }),

  // Mock genre-based discovery
  http.get('https://api.themoviedb.org/3/discover/movie', ({ request }) => {
    const url = new URL(request.url);
    const genreId = url.searchParams.get('with_genres');
    let results = [];
    if (genreId === '878') {
      results = [{ id: 15, title: 'Dune' }];
    } else if (genreId === '28') {
      results = [{ id: 16, title: 'John Wick' }];
    } else if (genreId === '35') {
      results = [{ id: 17, title: 'Deadpool' }];
    }
    return HttpResponse.json({ results });
  }),
];

const server = setupServer(...handlers);

// Establish API mocking before all tests.
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
// Clean up after the tests are finished.
afterAll(() => server.close());

// --- Test Suite ---

describe('getRecommendations', () => {
  it('should generate recommendations based on a combination of history and favourites', async () => {
    const recommendations = await getRecommendations();

    // Check if the recommendations array is populated.
    expect(recommendations.length).toBeGreaterThan(0);

    // Check for specific movie IDs returned from different recommendation methods.
    // Content-based recommendation: from 'inception' keyword
    expect(recommendations).toContainEqual(expect.objectContaining({ id: 10 }));
    // Content-based recommendation: from 'friends' keyword
    expect(recommendations).toContainEqual(expect.objectContaining({ id: 12 }));
    // Collaborative recommendation: similar to Inception
    expect(recommendations).toContainEqual(expect.objectContaining({ id: 13 }));
    // Collaborative recommendation: similar to Friends
    expect(recommendations).toContainEqual(expect.objectContaining({ id: 14 }));
    // Genre-based recommendation: from genre ID 878
    expect(recommendations).toContainEqual(expect.objectContaining({ id: 15 }));
    // Genre-based recommendation: from genre ID 28
    expect(recommendations).toContainEqual(expect.objectContaining({ id: 16 }));
    // Genre-based recommendation: from genre ID 35
    expect(recommendations).toContainEqual(expect.objectContaining({ id: 17 }));

    // Ensure no duplicates are present
    expect(recommendations.some(rec => rec.id === 3)).toBeFalsy();
    expect(recommendations.some(rec => rec.id === 4)).toBeFalsy();
  });

  it('should handle API errors gracefully without crashing', async () => {
    // Set up a mock handler that will return a 500 status code for all requests.
    server.use(
      http.get('*', () => {
        return HttpResponse.json({ results: [] }, { status: 500 });
      })
    );

    const recommendations = await getRecommendations();
    expect(recommendations).toEqual([]);
  });

  it('should return an empty array if there is no search history or favourites', async () => {
    // Mock IndexedDB to return empty arrays for both stores.
    (idb.openDB as jest.Mock).mockImplementationOnce(() => ({
      objectStoreNames: { contains: jest.fn(() => true) },
      getAll: jest.fn(() => Promise.resolve([])),
    }));

    const recommendations = await getRecommendations();
    expect(recommendations).toEqual([]);
  });

  it('should handle movie and TV show titles/names correctly', async () => {
    // A separate test to verify that both `title` and `name` properties are handled.
    const history = [{ id: 1, name: 'The Office' }];
    const favourites = [{ id: 2, title: 'The Office Movie' }];
    (idb.openDB as jest.Mock).mockImplementationOnce(() => ({
      objectStoreNames: { contains: jest.fn(() => true) },
      getAll: jest.fn((storeName: string) => {
        if (storeName === 'searchHistory') return Promise.resolve(history);
        if (storeName === 'favourites') return Promise.resolve(favourites);
        return Promise.resolve([]);
      }),
    }));

    // Mock API to return a single result for "the office" query
    server.use(
      http.get('https://api.themoviedb.org/3/search/multi', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('query') === 'the office') {
          return HttpResponse.json({ results: [{ id: 100, title: 'The Office (US)' }] });
        }
        return HttpResponse.json({ results: [] });
      })
    );

    const recommendations = await getRecommendations();

    expect(recommendations).toContainEqual(expect.objectContaining({ id: 100 }));
  });
});