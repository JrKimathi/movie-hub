import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Actors from '../pages/Actors';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';

// --- Mocking Dependencies ---

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock data
const mockActors = [
  { id: 1, name: 'Actor 1', profile_path: '/path1.jpg', popularity: 100 },
  { id: 2, name: 'Actor 2', profile_path: '/path2.jpg', popularity: 200 },
];

describe('Actors Component', () => {
  beforeEach(() => {
    mockedAxios.get.mockReset();
  });

  it('renders without crashing and fetches popular actors', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        results: mockActors,
        total_pages: 5,
      },
    });

    render(
      <BrowserRouter>
        <Actors />
      </BrowserRouter>
    );

    expect(screen.getByText('Popular Actors')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Actor 1')).toBeInTheDocument();
      expect(screen.getByText('Actor 2')).toBeInTheDocument();
    });
  });

  it('handles pagination correctly', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        results: [{ id: 1, name: 'Actor A', profile_path: null, popularity: 100 }],
        total_pages: 5,
      },
    });

    render(
      <BrowserRouter>
        <Actors />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Actor A')).toBeInTheDocument();
    });

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        results: [{ id: 2, name: 'Actor B', profile_path: null, popularity: 200 }],
        total_pages: 5,
      },
    });

    const nextButton = screen.getByRole('button', { name: '>' });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Actor B')).toBeInTheDocument();
      expect(screen.queryByText('Actor A')).toBeNull(); 
    });

    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('page=2'));
  });
});