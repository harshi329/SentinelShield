import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import axios from "axios";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  avatarId: string;
  setAvatarId: (id: string) => void;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user,     setUser]     = useState<AuthUser | null>(null);
  const [token,    setToken]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [avatarId, setAvatarIdState] = useState<string>(
    () => localStorage.getItem("ss_avatar") || "shield"
  );

  const setAvatarId = (id: string) => {
    localStorage.setItem("ss_avatar", id);
    setAvatarIdState(id);
  };

  useEffect(() => {
    const stored = localStorage.getItem("ss_token");
    if (stored) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${stored}`;
      axios.get("/api/auth/me")
        .then((res) => {
          setToken(stored);
          setUser(res.data.user);
        })
        .catch(() => {
          localStorage.removeItem("ss_token");
          delete axios.defaults.headers.common["Authorization"];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (t: string, u: AuthUser) => {
    localStorage.setItem("ss_token", t);
    axios.defaults.headers.common["Authorization"] = `Bearer ${t}`;
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("ss_token");
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, avatarId, setAvatarId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
