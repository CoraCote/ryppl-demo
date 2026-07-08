import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { api, clearToken, getToken, setToken } from "@/src/api/client";

export type User = {
  id: string;
  phone: string;
  name: string;
  avatar_url: string;
  role: "customer" | "employee";
  sub_role: "packer" | "runner" | null;
  points: number;
  referral_code: string;
  orders_count?: number;
};

type AuthState = {
  user: User | null;
  booting: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({} as AuthState);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await api<User>("/auth/me");
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) {
        await refresh();
      }
      setBooting(false);
    })();
  }, [refresh]);

  const login = useCallback(async (token: string, u: User) => {
    await setToken(token);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, booting, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
