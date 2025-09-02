import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navigator from "../navigation/Navigator";

jest.mock("../pages/Home", () => () => <div>Home Page</div>);
jest.mock("../pages/Series", () => () => <div>Series Page</div>);
jest.mock("../pages/Actors", () => () => <div>Actors Page</div>);
jest.mock("../pages/ActorDetails", () => () => <div>Actor Details Page</div>);
jest.mock("../pages/Genre", () => () => <div>Genres Page</div>);
jest.mock("../components/Auth", () => () => <div>Auth Page</div>);
jest.mock("../pages/SearchResults", () => () => <div>Search Results Page</div>);
jest.mock("../components/MovieDetails", () => () => <div>Movie Details Page</div>);
jest.mock("../components/SeriesDetails", () => () => <div>Series Details Page</div>);

describe("Navigator Routing", () => {
  test("renders Home page on default route", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Navigator />
      </MemoryRouter>
    );
    expect(screen.getByText("Home Page")).toBeInTheDocument();
  });

  test("renders Series page", () => {
    render(
      <MemoryRouter initialEntries={["/series"]}>
        <Navigator />
      </MemoryRouter>
    );
    expect(screen.getByText("Series Page")).toBeInTheDocument();
  });

  test("renders Actor Details page with id param", () => {
    render(
      <MemoryRouter initialEntries={["/actors/123"]}>
        <Navigator />
      </MemoryRouter>
    );
    expect(screen.getByText("Actor Details Page")).toBeInTheDocument();
  });

  test("redirects invalid route to Home", () => {
    render(
      <MemoryRouter initialEntries={["/invalid-route"]}>
        <Navigator />
      </MemoryRouter>
    );
    expect(screen.getByText("Home Page")).toBeInTheDocument();
  });

  test("renders Movie Details page with id param", () => {
    render(
      <MemoryRouter initialEntries={["/movie/456"]}>
        <Navigator />
      </MemoryRouter>
    );
    expect(screen.getByText("Movie Details Page")).toBeInTheDocument();
  });

  test("renders Auth page", () => {
    render(
      <MemoryRouter initialEntries={["/auth"]}>
        <Navigator />
      </MemoryRouter>
    );
    expect(screen.getByText("Auth Page")).toBeInTheDocument();
  });

  test("renders Search Results page", () => {
    render(
      <MemoryRouter initialEntries={["/search"]}>
        <Navigator />
      </MemoryRouter>
    );
    expect(screen.getByText("Search Results Page")).toBeInTheDocument();
  });
});
