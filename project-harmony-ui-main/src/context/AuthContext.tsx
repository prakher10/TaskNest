import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi, type ApiUser } from '@/lib/api';

interface AuthContextValue {
  user: ApiUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role?: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // On mount, verify the stored token is still valid
  useEffect(() => {
    const verify = async () => {
      const stored = localStorage.getItem('token');
      if (!stored) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await authApi.me();
        setUser(res.data.user);
        setToken(stored);
      } catch {
        // Token invalid or expired — clear it
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    verify();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const signup = async (name: string, email: string, password: string, role = 'Member') => {
    // Step 1 only — sends OTP. Does NOT log the user in yet.
    return await authApi.signup({ name, email, password, role });
  };

  const verifyOtp = async (email: string, otp: string) => {
    const res = await authApi.verifyOtp({ email, otp });
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Call this after profile updates to sync the navbar avatar/name
  const refreshUser = async () => {
    try {
      const res = await authApi.me();
      setUser(res.data.user);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, verifyOtp, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
