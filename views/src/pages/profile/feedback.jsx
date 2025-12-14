import React, { useEffect, useState } from "react";
import "./feedback.css";

import TuteeRate from "../../components/Ratesession/tuteerate";
import TutorRate from "../../components/Ratesession/tutorrate";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Feedback() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tuteeId, setTuteeId] = useState(null);
  const [isTutor, setIsTutor] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const toastOpts = {
    position: "top-right",
    autoClose: 2500,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  };

  const reloadSessions = async (idNumberOverride) => {
    const id = idNumberOverride || tuteeId;
    if (!id) return;

    try {
      const resPending = await fetch(`/api/rate-session/pending/${id}`, {
        credentials: "include",
      });

      const pendingData = await resPending.json().catch(() => []);
      if (!resPending.ok) {
        console.error("Failed to reload pending sessions:", pendingData);
        toast.error("Failed to reload sessions.", toastOpts);
      }

      setSessions(pendingData);
      setAllSessions(pendingData);
      setSelectedSession(null);
    } catch (err) {
      console.error("Error reloading sessions:", err);
      toast.error("Network error while reloading sessions.", toastOpts);
    }
  };

  useEffect(() => {
    async function fetchUserData() {
      try {
        const resUser = await fetch("/api/auth/get_user", {
          credentials: "include",
        });

        if (resUser.status === 401) {
          toast.error("Session expired. Redirecting to login...", toastOpts);
          window.location.href = "/api/auth/login";
          return;
        }

        const loggedInUser = await resUser.json();

        const resTutees = await fetch("/api/tutee/all", { credentials: "include" });
        if (!resTutees.ok) {
          toast.error("Failed to load tutee list.", toastOpts);
          return;
        }
        const tutees = await resTutees.json();

        const resTutors = await fetch("/api/tutor/all", { credentials: "include" });
        if (!resTutors.ok) {
          toast.error("Failed to load tutor list.", toastOpts);
          return;
        }
        const tutors = await resTutors.json();

        const userData = tutees.find((u) => u.google_id === loggedInUser.sub);

        if (!userData) {
          setCurrentUser(null);
          toast.error("No matching user found.", toastOpts);
          return;
        }

        const tutorExists = tutors.some((t) => t.tutor_id === userData?.id_number);

        setCurrentUser(userData);
        const idNumber = userData?.id_number || null;
        setTuteeId(idNumber);
        setIsTutor(tutorExists);

        if (idNumber) await reloadSessions(idNumber);
      } catch (err) {
        console.error("Error fetching Feedback data:", err);
        toast.error("Network error while loading feedback.", toastOpts);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return setSessions(allSessions);

    const filtered = allSessions.filter((s) =>
      [
        s.course_code,
        s.appointment_date,
        s.start_time,
        s.end_time,
        s.tutor_first_name,
        s.tutor_middle_name,
        s.tutor_last_name,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query))
    );

    setSessions(filtered);
  };

  // Loading UI
  if (loading) {
    return (
      <div className="feedback-loading">
        <ToastContainer newestOnTop limit={2} theme="light" />
        <div className="feedback-loading-box">
          <div className="spinner-border" role="status" />
          <span className="ms-2">Loading your sessions...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="feedback-loading">
        <ToastContainer newestOnTop limit={2} theme="light" />
        <div className="feedback-loading-box">
          <span>No matching user found.</span>
        </div>
      </div>
    );
  }

  // Tutor view
  if (isTutor) {
    return (
      <div className="feedback-page">
        <ToastContainer newestOnTop limit={2} theme="light" />
        <div className="feedback-container">
          <h1 className="fw-bold mb-1 feedback-title-center">My Session Ratings</h1>
          <p className="text-muted mb-4 feedback-subtitle-center"></p>
          <TutorRate />
        </div>
      </div>
    );
  }

  // Tutee view
  return (
    <div className="feedback-page">
      <ToastContainer newestOnTop limit={2} theme="light" />
      <div className="feedback-container">
        <h1 className="fw-bold mb-1 feedback-title-center">Rate Sessions</h1>
        <p className="text-muted mb-4 feedback-subtitle-center"></p>

        {/* Search */}
        <div className="feedback-search-row">
          <div className="feedback-search">
            <input
              type="text"
              className="form-control feedback-search-input"
              placeholder="Search sessions to rate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
            <button className="btn btn-success feedback-search-btn" onClick={handleSearch}>
              Enter
            </button>
          </div>
        </div>

        {/* Session list */}
        <div className="feedback-list">
          {sessions.length === 0 ? (
            <div className="feedback-empty">Sorry, you have no sessions to rate.</div>
          ) : (
            sessions.map((s) => {
              const tutorName = [s.tutor_first_name, s.tutor_middle_name, s.tutor_last_name]
                .filter(Boolean)
                .join(" ");

              const initials = tutorName
                ? tutorName
                    .split(" ")
                    .filter((n) => n)
                    .map((n) => n[0]?.toUpperCase() || "")
                    .join("")
                : (s.tutor_id || "?").slice(0, 2).toUpperCase();

              const isThisSelected =
                selectedSession && selectedSession.appointment_id === s.appointment_id;

              return (
                <div key={s.appointment_id} className="alert custom-alert feedback-session-card">
                  <div className="feedback-card-content">
                    {/* Left */}
                    <div className="feedback-left">
                      <div className="feedback-avatar">{initials}</div>

                      <div className="feedback-subject">
                        <span className="feedback-label">Subject Code</span>
                        <span className="feedback-subject-code">{s.course_code}</span>
                      </div>
                    </div>

                    {/* Middle */}
                    <div className="feedback-info">
                      <div className="feedback-info-block">
                        <span className="feedback-label">Tutor</span>
                        <span className="feedback-value">
                          {tutorName || s.tutor_id || "Unknown tutor"}
                        </span>
                      </div>

                      <div className="feedback-info-block">
                        <span className="feedback-label">Appointment Date</span>
                        <span className="feedback-value">{s.appointment_date}</span>
                      </div>

                      <div className="feedback-info-block">
                        <span className="feedback-label">Time</span>
                        <span className="feedback-value">
                          {s.start_time} - {s.end_time}
                        </span>
                      </div>
                    </div>

                  
                    <div className="feedback-actions">
                      <button
                        className="btn fw-semibold feedback-rate-btn"
                        onClick={() => setSelectedSession(isThisSelected ? null : s)}
                      >
                        {isThisSelected ? "Hide" : "Rate"}
                      </button>
                    </div>
                  </div>

         
                  {isThisSelected && (
                    <div className="feedback-form-wrap">
                      <TuteeRate
                        session={s}
                        isTutor={false}
                        onViewRatings={null}
                        onRated={reloadSessions}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default Feedback;
