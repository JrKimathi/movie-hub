import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Series from '../pages/Series';
import axios from 'axios'; 
import { BrowserRouter } from 'react-router-dom';

// --- Mocking Dependencies ---

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock IndexedDB
const idbMock = {
  openDB: jest.fn(() =>
    Promise.resolve({
      transaction: () => ({
        objectStore: () => ({
          put: jest.fn(() => ({ oncomplete: (cb: any) => cb() })),

          delete: jest.fn(() => Promise.resolve()),
          getAll: jest.fn(() => ({
            onsuccess: (cb: any) => cb({ target: { result: [] } }),
          })),
        }),
      }),
    })
  ),
};

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
const mockSeries = [
  { id: 1, name: 'Series 1', poster_path: '/series1.jpg' },
  { id: 2, name: 'Series 2', poster_path: '/series2.jpg' },
];

describe('Series Component', () => {
  beforeEach(() => {
    mockedAxios.get.mockReset();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders without crashing and fetches series categories', async () => {
    mockedAxios.get.mockResolvedValue({ data: { results: mockSeries } });

    render(
      <BrowserRouter>
        <Series />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('All TV Shows')).toBeInTheDocument();
      expect(screen.getByText('Top Series')).toBeInTheDocument();
      expect(screen.getByText('Latest TV Shows')).toBeInTheDocument();
      expect(screen.getByText('Coming This Year')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Series 1')).toHaveLength(4);
  });

  it('displays a login message when attempting to favourite without being logged in', async () => {
    mockedAxios.get.mockResolvedValue({ data: { results: mockSeries } });

    render(
      <BrowserRouter>
        <Series />
      </BrowserRouter>
    );
    await waitFor(() => expect(screen.getAllByText('Series 1')).toHaveLength(4));

    const heartIcon = screen.getAllByRole('button', { name: /favourite/i })[0];
    fireEvent.click(heartIcon);

    await waitFor(() => {
      expect(
        screen.getByText('You need to log in to add a series to favourites.')
      ).toBeInTheDocument();
    });
  });

  it('allows a logged-in user to add a series to favourites', async () => {
    sessionStorage.setItem('sessionUser', 'testuser');
    mockedAxios.get.mockResolvedValue({ data: { results: mockSeries } });

    // ❌ FIX: The put/delete mocks now need to be defined here to control their behavior.
    const mockPut = jest.fn(() => ({ oncomplete: (cb: any) => cb() }));
    const mockDelete = jest.fn(() => ({ oncomplete: (cb: any) => cb() }));
    const mockGetAll = jest.fn(() => ({
      onsuccess: (cb: any) => cb({ target: { result: [] } }),
    }));
    // ❌ FIX: This block should directly mock the `idb` module's methods.
    jest.mock('idb', () => ({
      openDB: jest.fn(() =>
        Promise.resolve({
          transaction: () => ({
            objectStore: () => ({ put: mockPut, delete: mockDelete, getAll: mockGetAll }),
          }),
        })
      ),
    }));

    render(
      <BrowserRouter>
        <Series />
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getAllByText('Series 1')).toHaveLength(4));

    const heartIcon = screen.getAllByRole('button', { name: /favourite/i })[0];
    fireEvent.click(heartIcon);

    await waitFor(() => {
      expect(screen.getByText('My Favourites')).toBeInTheDocument();
      expect(screen.getByText('Series 1')).toBeInTheDocument();
    });

    expect(mockPut).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });
});