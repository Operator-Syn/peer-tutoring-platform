import React, { useState, useEffect } from "react";

export default function Events() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTutor, setIsTutor] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      try {
        // 1️⃣ Fetch logged-in user info
        const resUser = await fetch("/api/auth/get_user", { credentials: "include" });
        if (resUser.status === 401) {
          window.location.href = "/api/auth/login";
          return;
        }
        const loggedInUser = await resUser.json();

        // 2️⃣ Fetch all tutees
        const resTutees = await fetch("/api/tutee/all");
        const tutees = await resTutees.json();

        // 3️⃣ Fetch all tutors
        const resTutors = await fetch("/api/tutor/all");
        const tutors = await resTutors.json();

        // 4️⃣ Match logged-in user in tutees
        const userData = tutees.find(u => u.google_id === loggedInUser.sub);

        // 5️⃣ Check if user exists in tutors
        const tutorExists = tutors.some(t => t.tutor_id === userData?.id_number);

        setCurrentUser(userData || null);
        setIsTutor(tutorExists);

      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!currentUser) return <div>No matching user found</div>;

  return (
    <div style={{ padding: "3rem" }}>
      <h2>Events</h2>
      <p>This is the event page content.</p>

      <p>User is {isTutor ? "a Tutor" : "not a Tutor"}</p>

      <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", marginTop: "2rem" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Google ID</th>
            <th>ID Number</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{currentUser.name}</td>
            <td>{currentUser.email}</td>
            <td>{currentUser.google_id}</td>
            <td>{currentUser.id_number}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
