"use client";

import { apiLogout, apiMe } from "@/lib/api/authClient";
import { useEffect, useState } from "react";

type User = { id: string; email: string; name: string | null; role: string };

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const { user } = await apiMe();
    setUser(user);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return { user, loading, refresh, logout };
}