import React, { useEffect, useState } from "react";
import "./feedback.css";
import Tutor from "../../components/Ratesession/tutorrate";
import TuteeRate from "../../components/Ratesession/tuteerate";

function Feedback() {
  const [isTutor, setIsTutor] = useState(null);   // null = loading
  const [showTutorView, setShowTutorView] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      try {
        // 1) get logged-in user
        const resUser = await fetch("/api/auth/get_user", {
          credentials: "include",
        });
        if (!resUser.ok) throw new Error("Not authenticated");
        const user = await resUser.json();
        console.log("get_user in Feedback:", user);

        const googleId = (user.sub || user.google_id || "").toString().trim();
        if (!googleId) {
          setIsTutor(false);
          return;
        }

        // 2) find tutee row for this google user
        const tutees = await fetch("/api/tutee/all", {
          credentials: "include",
        }).then((r) => r.json());

        const me = tutees.find(
          (u) => (u.google_id || "").toString().trim() === googleId
        );

        const idNumber = (me?.id_number || "").toString().trim();
        if (!idNumber) {
          console.log("No tutee id_number found, treating as non-tutor");
          setIsTutor(false);
          return;
        }

        // 3) check if that id_number exists in tutor table
        const tutors = await fetch("/api/tutor/all", {
          credentials: "include",
        }).then((r) => r.json());

        const tutorRow = tutors.find(
          (t) => (t.tutor_id || "").toString().trim() === idNumber
        );

        const tutor = !!tutorRow;
        console.log("isTutor?", tutor, { idNumber, tutorRow });
        setIsTutor(tutor);
      } catch (err) {
        console.error("Role check failed:", err);
        setIsTutor(false);
      }
    };

    checkRole();
  }, []);

  if (isTutor === null) {
    return <div className="container">Loading...</div>;
  }

  // TODO: replace with real sessionId when you hook ratings to actual sessions
  const dummySessionId = 123;

  // If tutor clicked "View My Ratings" → show tutor view
  if (showTutorView && isTutor) {
    return (
      <div className="container feedback-page">
        <button
          type="button"
          className="btn btn-link mb-3"
          onClick={() => setShowTutorView(false)}
        >
          ← Back to rate session
        </button>
        <Tutor />
      </div>
    );
  }

  // Default: rate-session page (button shows if isTutor === true)
  return (
    <div className="container feedback-page">
      <TuteeRate
        sessionId={dummySessionId}
        isTutor={isTutor}
        onViewRatings={() => setShowTutorView(true)}
      />
    </div>
  );
}

export default Feedback;
