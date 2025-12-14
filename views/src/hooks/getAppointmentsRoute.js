export async function getAppointmentRoute() {
    try {
        // Fetch logged-in user
        const resUser = await fetch("/api/auth/get_user", { credentials: "include" });
        if (!resUser.ok) return "/Appointments";
        const user = await resUser.json();

        // Fetch all tutees
        const resTutees = await fetch("/api/tutee/all");
        if (!resTutees.ok) return "/Appointments";
        const tutees = await resTutees.json();
        const tuteeData = tutees.find(u => u.google_id === user.sub);

        // Fetch all tutors
        const resTutors = await fetch("/api/tutor/all");
        if (!resTutors.ok) return "/Appointments";
        const tutors = await resTutors.json();
        const tutorData = tutors.find(t => t.tutor_id === tuteeData?.id_number);

        // Decide route
        const isActiveTutor = tutorData && tutorData.status === "ACTIVE";
        return isActiveTutor ? "/TutorAppointments" : "/Appointments";

    } catch (err) {
        console.error(err);
        return "/Appointments";
    }
}
