import { Outlet, Navigate } from "react-router-dom";
import { useLoginCheck } from "../hooks/useLoginCheck";
import { useState, useEffect } from "react";

export default function ProtectedRoute() {
  const loginCheck = useLoginCheck({ login: true });
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function check() {
      const user = await loginCheck();
      setUser(user);
      setAuthChecked(true);
    }
    check();
  }, []);

  if (!authChecked) return <div>Loading...</div>;
  if (!user) return null;

  return <Outlet />;
}