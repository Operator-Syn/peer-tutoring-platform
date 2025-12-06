import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useRoleRedirect(targetRole) {
    const navigate = useNavigate();

    useEffect(() => {
        const checkRole = async () => {
            try {
                // 1️⃣ Fetch logged-in user info
                const resUser = await fetch("/api/auth/get_user", { credentials: "include" });
                if (!resUser.ok) return;

                const loggedInUser = await resUser.json();

                // 2️⃣ Fetch all tutees
                const resTutees = await fetch("/api/tutee/all");
                if (!resTutees.ok) return;
                const tutees = await resTutees.json();
                const tuteeData = tutees.find(u => u.google_id === loggedInUser.sub);
                if (!tuteeData) return;

                // 3️⃣ Fetch all tutors
                const resTutors = await fetch("/api/tutor/all");
                if (!resTutors.ok) return;
                const tutors = await resTutors.json();
                const tutorData = tutors.find(t => t.tutor_id === tuteeData.id_number);

                // Only active tutors count as tutors
                const isActiveTutor = tutorData && tutorData.status === "ACTIVE";

                // 4️⃣ Redirect based on role
                if (targetRole === "TUTEE" && isActiveTutor) {
                    navigate("/TutorAppointments");
                } else if (targetRole === "TUTOR" && !isActiveTutor) {
                    navigate("/Appointments");
                }

            } catch (err) {
                console.error("Role redirect error:", err);
            }
        };

        checkRole();
    }, [targetRole, navigate]);
}