import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Auth from "../components/Auth";

// --- Mock CSS modules
jest.mock("../styles/authstyles/auth.module.css", () => new Proxy({}, { get: (target, prop) => prop }));

// --- Mock Navbar
jest.mock("../components/Navbar", () => () => <div data-testid="navbar">Navbar</div>);

// --- Mock IndexedDB
const mockDB: Record<string, any> = {};
const openDBMock = jest.fn(() => ({
  transaction: (storeName: string, mode: string) => {
    return {
      objectStore: () => ({
        put: (user: any) => { mockDB[user.email] = user; },
        get: (email: string) => ({
          onsuccess: undefined as any,
          onerror: undefined as any,
          result: mockDB[email] || undefined,
        }),
      }),
      oncomplete: undefined as any,
      onerror: undefined as any,
    };
  }
}));

beforeAll(() => {
  (global as any).indexedDB = {
    open: jest.fn(() => {
      const request: any = {};
      setTimeout(() => {
        request.result = { transaction: openDBMock().transaction };
        request.onsuccess?.();
      }, 0);
      return request;
    }),
  };
});

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  Object.keys(mockDB).forEach(k => delete mockDB[k]);
});

describe("Auth Component", () => {
  it("renders login tab by default", () => {
    render(<Auth />);
    expect(screen.getByText(/please log in/i)).toBeInTheDocument();
  });

  it("switches to signup tab when clicked", () => {
    render(<Auth />);
    fireEvent.click(screen.getByText(/sign up/i));
    expect(screen.getByText(/create a free account/i)).toBeInTheDocument();
  });

  it("shows validation errors on empty signup submit", async () => {
    render(<Auth />);
    fireEvent.click(screen.getByText(/sign up/i));
    fireEvent.click(screen.getByText(/sign up/i, { selector: "button" }));

    expect(await screen.findByText(/first name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/last name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it("successfully signs up a new user", async () => {
    render(<Auth />);
    fireEvent.click(screen.getByText(/sign up/i));

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Doe" } });
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "johnd@email.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "Johnd" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "Johnd" } });

    fireEvent.click(screen.getByText(/sign up/i, { selector: "button" }));

    await waitFor(() => {
      expect(screen.getByText(/account created successfully/i)).toBeInTheDocument();
    });

    expect(localStorage.getItem("registeredUser")).toBe("johndoe@email.com");
  });

  it("logs in successfully with existing user", async () => {
    mockDB["janedoe@email.com"] = {
      email: "janedoe@email.com",
      firstName: "Jane",
      lastName: "Doe",
      password: "Jdoe123"
    };

    render(<Auth />);

    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "jane@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "secret123" } });

    fireEvent.click(screen.getByText(/log in/i, { selector: "button" }));

    await waitFor(() => {
      expect(screen.getByText(/logged in successfully/i)).toBeInTheDocument();
    });

    expect(sessionStorage.getItem("sessionUser")).toBe("Jane");
    expect(localStorage.getItem("lastLogin")).not.toBeNull();
  });

  it("shows error on invalid login", async () => {
    render(<Auth />);

    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "nouser@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "wrongpass" } });

    fireEvent.click(screen.getByText(/log in/i, { selector: "button" }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  it("displays welcome message if session exists", () => {
    sessionStorage.setItem("sessionUser", "Alice");
    render(<Auth />);
    expect(screen.getByText(/welcome back, alice/i)).toBeInTheDocument();
  });
});
