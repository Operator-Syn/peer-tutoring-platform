import { Outlet, useNavigate } from "react-router-dom";
import { useLoginCheck } from "../hooks/useLoginCheck";
import { useState, useEffect } from "react";

// reuses login check logic to check if user is admin before navigating to /admin
export default function AdminRoute() {
    const loginCheck = useLoginCheck({ login: true });
    const [isChecking, setIsChecking] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        async function verifyAdmin() {
            const user = await loginCheck();
            
            if (user) {
                if (user.role === 'ADMIN') {
                    setIsAdmin(true);
                } else {
                    navigate("/"); 
                }
            }
            setIsChecking(false);
        }
        verifyAdmin();
    }, []);

    if (isChecking) return <div style={{padding: "15rem"}}>Loading...</div>;
    
    return isAdmin ? <Outlet /> : null;
}