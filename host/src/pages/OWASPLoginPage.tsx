import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import "../index.css";

// Define the PageConfig interface
interface PageConfig {
  title: string;
  showRememberMe: boolean;
  showForgotPassword: boolean;
  // Add other config properties as needed
}

// Example default config, adjust as needed for your app
const DEFAULT_PAGE_CONFIG: PageConfig = {
  title: "Login",
  showRememberMe: true,
  showForgotPassword: true,
  // Add other default config properties as required by PageConfig interface
};

// ... (Keep all the interfaces from the original component)

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [error, setError] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [config, setConfig] = useState<PageConfig>(DEFAULT_PAGE_CONFIG);

  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 300000;

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Fetch config on mount
  useEffect(() => {
    fetchPageConfig();
  }, []);

  const fetchPageConfig = async () => {
    try {
      setIsConfigLoading(true);
      const configData = await apiClient.get<PageConfig>('/config/login', { skipAuth: true });
      setConfig(configData);
    } catch (err) {
      console.error('Error fetching page config:', err);
      setConfig(DEFAULT_PAGE_CONFIG);
    } finally {
      setIsConfigLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (isLocked) {
      setError('Account temporarily locked. Please try again later.');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username')?.toString().trim();
    const password = formData.get('password')?.toString();
    const rememberMe = formData.get('rememberMe') === 'on';

    if (!username || !password) {
      setError('Please fill in all required fields');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_-]{3,50}$/;
    if (!usernameRegex.test(username)) {
      setError('Invalid username format');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      await login(username, password, rememberMe);
      setLoginAttempts(0);
      
      // Navigate to the page they were trying to access, or dashboard
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        setIsLocked(true);
        setError('Too many failed attempts. Account locked for 5 minutes.');
        
        setTimeout(() => {
          setIsLocked(false);
          setLoginAttempts(0);
        }, LOCKOUT_DURATION);
      } else {
        setError(err.message || 'Invalid credentials. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Example JSX for the login form (replace with your actual UI)
  return (
    <div className="login-page">
      <h1>{config.title}</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username</label>
          <input id="username" name="username" type="text" disabled={isLoading || isLocked} />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            disabled={isLoading || isLocked}
          />
          <button type="button" onClick={() => setShowPassword((v) => !v)}>
            {showPassword ? <EyeOff /> : <Eye />}
          </button>
        </div>
        {config.showRememberMe && (
          <div>
            <label htmlFor="rememberMe">Remember Me</label>
            <input id="rememberMe" name="rememberMe" type="checkbox" disabled={isLoading || isLocked} />
          </div>
        )}
        {error && (
          <div style={{ color: "red" }}>
            <AlertCircle /> {error}
          </div>
        )}
        <button type="submit" disabled={isLoading || isLocked}>
          {isLoading ? "Logging in..." : "Login"}
        </button>
        {config.showForgotPassword && (
          <div>
            <a href="/forgot-password">Forgot Password?</a>
          </div>
        )}
      </form>
    </div>
  );
}

// const container = document.getElementById("app");
// if (container) {
//   const root = ReactDOM.createRoot(container);
//   root.render(<LoginPage />);
// }