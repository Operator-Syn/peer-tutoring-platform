import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useLoginCheck } from "../hooks/useLoginCheck";
import { useState, useEffect } from "react";

export default function ProtectedRoute() {
    const loginCheck = useLoginCheck({ login: true });
    const [authChecked, setAuthChecked] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
		setAuthChecked(false);
        async function check() {
            const user = await loginCheck();
            setUser(user);
            setAuthChecked(true);
            if (user && user.registered_tutee === false) {
                navigate("/AccountCreation");
            }
        }
        check();
    }, [location.pathname]);


	if (!user) return null;

	return <Outlet />;
}