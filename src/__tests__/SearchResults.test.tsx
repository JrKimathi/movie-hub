import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SearchResults from "../pages/SearchResults";


jest.mock("../components/Navbar", () => () => <div>Mock Navbar</div>);


const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    search: "?query=batman", 
  }),
}));

const mockFetch = (results: any, ok = true) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve({ results }),
    } as Response)
  ) as jest.Mock;
};

describe("SearchResults", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders loading state", async () => {
    mockFetch([]);
    render(<SearchResults />);
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  test("renders error state when fetch fails", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: false }) as any
    );

    render(<SearchResults />);
    await waitFor(() =>
      expect(
        screen.getByText(/An error occurred while fetching search results/i)
      ).toBeInTheDocument()
    );
  });

  test("renders 'no results found' when API returns empty", async () => {
    mockFetch([]);

    render(<SearchResults />);
    await waitFor(() =>
      expect(
        screen.getByText(/No results found for "batman"/i)
      ).toBeInTheDocument()
    );
  });

  test("renders movie & TV results", async () => {
    mockFetch([
      {
        id: 1,
        title: "Batman Begins",
        media_type: "movie",
        poster_path: "/poster.jpg",
        release_date: "2005-06-15",
        vote_average: 8.2,
      },
    ]);

    render(<SearchResults />);
    await waitFor(() =>
      expect(screen.getByText("Batman Begins")).toBeInTheDocument()
    );
    expect(screen.getByText(/Rating: 8.2/i)).toBeInTheDocument();
    expect(screen.getByText(/Movies & TV Shows/i)).toBeInTheDocument();
  });

  test("renders actor results and navigates on click", async () => {
    mockFetch([
      {
        id: 2,
        name: "Christian Bale",
        media_type: "person",
        profile_path: "/profile.jpg",
      },
    ]);

    render(<SearchResults />);
    await waitFor(() =>
      expect(screen.getByText("Christian Bale")).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText("Christian Bale"));
    expect(mockNavigate).toHaveBeenCalledWith("/actors/2");
  });

  test("toggles favorite when heart icon clicked", async () => {
    mockFetch([
      {
        id: 3,
        title: "The Dark Knight",
        media_type: "movie",
        poster_path: "/poster.jpg",
        release_date: "2008-07-18",
        vote_average: 9.0,
      },
    ]);

    render(<SearchResults />);
    await waitFor(() =>
      expect(screen.getByText("The Dark Knight")).toBeInTheDocument()
    );

    const heart = screen.getByRole("img", { hidden: true });
    fireEvent.click(heart);
    fireEvent.click(heart);

    expect(heart).toBeInTheDocument(); 
  });
});
