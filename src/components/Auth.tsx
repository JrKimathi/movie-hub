import { useState, useEffect } from "react";
import styles from "../styles/authstyles/auth.module.css";
import Navbar from '../components/Navbar';
import { useNavigate } from "react-router-dom";



const DB_NAME = "AuthDB";
const STORE_NAME = "users";
const DB_VERSION = 3;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject("Error opening IndexedDB");

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "email" });
      }
    };

    request.onsuccess = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.close();
        indexedDB.deleteDatabase(DB_NAME);
        const retry = indexedDB.open(DB_NAME, DB_VERSION);
        retry.onupgradeneeded = () => {
          const newDB = retry.result;
          newDB.createObjectStore(STORE_NAME, { keyPath: "email" });
        };
        retry.onsuccess = () => resolve(retry.result);
        retry.onerror = () => reject("Error recreating database");
      } else {
        resolve(db);
      }
    };
  });
};


const addUserToDB = async (user: { email: string; firstName: string; lastName: string; password: string }) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(user);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject("Error adding user");
  });
};

const getUserFromDB = async (email: string): Promise<any> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(email);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject("Error fetching user");
  });
};

const Auth = () => {
    const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [authMessage, setAuthMessage] = useState("");

  // Check if user is logged in already (from sessionStorage)
  useEffect(() => {
    const sessionUser = sessionStorage.getItem("sessionUser");
    if (sessionUser) {
      setAuthMessage(`Welcome back, ${sessionUser}!`);
    }
  }, []);

  
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  const storedUser = await getUserFromDB(loginEmail);

  if (storedUser && storedUser.password === loginPassword) {
    // Store user in sessionStorage
    sessionStorage.setItem("sessionUser", storedUser.firstName);

    // Store last login in localStorage
    localStorage.setItem("lastLogin", new Date().toISOString());

    setAuthMessage(`Logged in successfully. Welcome ${storedUser.firstName}!`);

    // Redirect to home
    navigate("/home"); 
  } else {
    setAuthMessage("Invalid email or password.");
  }
};


  // Handle signup with validation
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};

    if (!firstName.trim()) newErrors.firstName = "First name is required.";
    if (!lastName.trim()) newErrors.lastName = "Last name is required.";
    if (!email.trim()) newErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Invalid email format.";

    if (!signupPassword) {
      newErrors.signupPassword = "Password is required.";
    } else if (signupPassword.length < 6) {
      newErrors.signupPassword = "Password must be at least 6 characters.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (signupPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const existingUser = await getUserFromDB(email);
      if (existingUser) {
        setAuthMessage("User already exists. Please log in.");
        return;
      }

      const newUser = { email, firstName, lastName, password: signupPassword };
      await addUserToDB(newUser);

      // Save email in localStorage for persistence
      localStorage.setItem("registeredUser", email);

      setAuthMessage("Account created successfully! You can now log in.");
      setActiveTab("login");

      // Clear form
      setFirstName("");
      setLastName("");
      setEmail("");
      setSignupPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.card}>
        {/* Tabs */}
        <div className={styles.tabs}>
          <div
            className={`${styles.tab} ${activeTab === "login" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("login")}
          >
            Login
          </div>
          <div
            className={`${styles.tab} ${activeTab === "signup" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("signup")}
          >
            Sign Up
          </div>
        </div>

        {/* Feedback */}
        {authMessage && <p className={styles.subtitle}>{authMessage}</p>}

        {/* Login form */}
        {activeTab === "login" && (
          <>
            <h1 className={styles.title}>Welcome!</h1>
            <p className={styles.subtitle}>Please log in to your account.</p>

            <form className={styles.form} onSubmit={handleLogin}>
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="login-email">
                  Email
                </label>
                <input
                  type="email"
                  id="login-email"
                  className={styles.input}
                  placeholder="Enter your email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="login-password">
                  Password
                </label>
                <input
                  type="password"
                  id="login-password"
                  className={styles.input}
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className={styles.button}>
                Log In
              </button>
            </form>
          </>
        )}

        {/* Signup form */}
        {activeTab === "signup" && (
          <>
            <p className={styles.subtitle}>Create a Free account</p>

            <form className={styles.form} onSubmit={handleSignup}>
              {/* First Name */}
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="firstName">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  className={`${styles.input} ${errors.firstName ? styles.inputError : ""}`}
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (errors.firstName) setErrors({ ...errors, firstName: "" });
                  }}
                />
                {errors.firstName && <p className={styles.errorText}>{errors.firstName}</p>}
              </div>

              {/* Last Name */}
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="lastName">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  className={`${styles.input} ${errors.lastName ? styles.inputError : ""}`}
                  placeholder="Enter your last name"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (errors.lastName) setErrors({ ...errors, lastName: "" });
                  }}
                />
                {errors.lastName && <p className={styles.errorText}>{errors.lastName}</p>}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="email">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: "" });
                  }}
                />
                {errors.email && <p className={styles.errorText}>{errors.email}</p>}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="signup-password">
                  Password
                </label>
                <input
                  type="password"
                  id="signup-password"
                  className={`${styles.input} ${errors.signupPassword ? styles.inputError : ""}`}
                  placeholder="Create a password"
                  value={signupPassword}
                  onChange={(e) => {
                    setSignupPassword(e.target.value);
                    if (errors.signupPassword) setErrors({ ...errors, signupPassword: "" });
                  }}
                />
                {errors.signupPassword && <p className={styles.errorText}>{errors.signupPassword}</p>}
              </div>

         
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ""}`}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
                  }}
                />
                {errors.confirmPassword && <p className={styles.errorText}>{errors.confirmPassword}</p>}
              </div>

              <button type="submit" className={styles.button}>
                Sign Up
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;
