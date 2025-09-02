import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SearchOverlay from "../components/SearchOverlay";

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("SearchOverlay Component", () => {
  let onCloseMock: jest.Mock;

  beforeEach(() => {
    onCloseMock = jest.fn();
    mockNavigate.mockClear();
  });

  it("renders input and focuses it on mount", () => {
    render(<SearchOverlay onClose={onCloseMock} />);
    const input = screen.getByPlaceholderText(/Find by phrase/i);

    expect(input).toBeInTheDocument();
    expect(document.activeElement).toBe(input); // Focus check
  });

  it("updates input value when typing", () => {
    render(<SearchOverlay onClose={onCloseMock} />);
    const input = screen.getByPlaceholderText(/Find by phrase/i);

    fireEvent.change(input, { target: { value: "Inception" } });

    expect(input).toHaveValue("Inception");
  });

  it("navigates and calls onClose when pressing Enter with valid search", () => {
    render(<SearchOverlay onClose={onCloseMock} />);
    const input = screen.getByPlaceholderText(/Find by phrase/i);

    fireEvent.change(input, { target: { value: "Matrix" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(mockNavigate).toHaveBeenCalledWith("/search?query=Matrix");
    expect(onCloseMock).toHaveBeenCalled();
  });

  it("does not navigate when pressing Enter with empty search", () => {
    render(<SearchOverlay onClose={onCloseMock} />);
    const input = screen.getByPlaceholderText(/Find by phrase/i);

    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(onCloseMock).not.toHaveBeenCalled();
  });

  it("calls onClose when close button is clicked", () => {
    render(<SearchOverlay onClose={onCloseMock} />);
    const closeButton = screen.getByRole("button");

    fireEvent.click(closeButton);

    expect(onCloseMock).toHaveBeenCalled();
  });
});
