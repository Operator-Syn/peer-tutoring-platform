import React, { useEffect, useState } from "react";
import "./feedback.css";

function Feedback() {
  const [sessions, setSessions] = useState([]);
  const [ratings, setRatings] = useState({}); // { appointment_id: number }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch pending sessions to rate
  useEffect(() => {
    async function fetchSessionsToRate() {
      try {
        setLoading(true);
        setError(null);

        // 1) Get logged-in user (same pattern as your other pages)
        const resUser = await fetch("/api/auth/get_user", {
          credentials: "include",
        });
        if (!resUser.ok) {
          window.location.href = "/api/auth/login";
          return;
        }
        const loggedInUser = await resUser.json();
        const googleId = loggedInUser.sub;

        // 2) Find tutee row
        const resTutees = await fetch("/api/tutee/all");
        const tutees = await resTutees.json();
        const currentTutee = tutees.find((t) => t.google_id === googleId);
        if (!currentTutee) {
          setError("Tutee record not found.");
          setLoading(false);
          return;
        }

        const tuteeId = currentTutee.id_number;

        // 3) Fetch sessions from rate_session where rating = 0 for this tutee
        const resSessions = await fetch(
          `/api/rate-session/pending/${tuteeId}`
        );
        if (!resSessions.ok) {
          const body = await resSessions.json().catch(() => null);
          throw new Error(body?.error || "Failed to load sessions to rate");
        }

        const data = await resSessions.json();
        setSessions(data || []);
      } catch (err) {
        console.error("Error fetching sessions to rate:", err);
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    fetchSessionsToRate();
  }, []);

  const handleRatingChange = (appointmentId, value) => {
    setRatings((prev) => ({
      ...prev,
      [appointmentId]: Number(value),
    }));
  };

  const handleSubmitRating = async (appointmentId) => {
    const rating = ratings[appointmentId];
    if (!rating || rating < 1 || rating > 5) {
      alert("Please select a rating between 1 and 5.");
      return;
    }

    try {
      setSubmitting(true);

      // Call backend to update rating in rate_session
      const res = await fetch(`/api/rate-session/rate/${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error || "Failed to submit rating");
      }

      // After successful rating, remove the session from the list
      setSessions((prev) =>
        prev.filter((s) => s.appointment_id !== appointmentId)
      );

      // Also remove local rating
      setRatings((prev) => {
        const copy = { ...prev };
        delete copy[appointmentId];
        return copy;
      });
    } catch (err) {
      console.error("Error submitting rating:", err);
      alert(err.message || "Failed to submit rating.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container feedback-page">
      <div className="space-center">
        <div className="container d-flex flex-column align-items-start py-4 request spacing">
          <div className="w-80 px-3 px-md-5">
            <div className="text-start fw-bold display-5 mb-4 feedback-title">
              Session Feedback
            </div>
            <p className="text-muted mb-4">
              Please rate your completed tutoring sessions.
            </p>
          </div>

          <div className="w-100 px-3 px-md-5">
            {loading && <p>Loading sessions to rate...</p>}

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            {!loading && !error && sessions.length === 0 && (
              <div
                className="text-center py-5"
                style={{
                  color: "#4956AD",
                  fontWeight: 500,
                  fontSize: "1rem",
                  backgroundColor: "#F8F9FF",
                  borderRadius: "12px",
                  padding: "2rem 3rem",
                  margin: "1rem auto",
                  maxWidth: "600px",
                }}
              >
                You have no sessions to rate right now.
              </div>
            )}

            {!loading && !error && sessions.length > 0 && (
              <div className="feedback-list">
                {sessions.map((session) => (
                  <div
                    key={session.appointment_id}
                    className="card feedback-card mb-4"
                  >
                    <div className="card-body">
                      <h5 className="card-title">
                        {session.course_code}{" "}
                        <span className="text-muted">
                          ({session.appointment_date})
                        </span>
                      </h5>

                      <p className="card-text mb-1">
                        <strong>Tutor: </strong>
                        {`${session.tutor_first_name || ""} ${
                          session.tutor_middle_name || ""
                        } ${session.tutor_last_name || ""}`
                          .trim()
                          .trim() || "N/A"}
                      </p>

                      <p className="card-text mb-3">
                        <strong>Time: </strong>
                        {session.start_time} – {session.end_time}
                      </p>

                      <div className="d-flex align-items-center flex-wrap gap-3">
                        <div className="rating-group d-flex align-items-center gap-2">
                          <span className="me-2">Rating:</span>
                          <select
                            className="form-select rating-select"
                            style={{ width: "120px" }}
                            value={ratings[session.appointment_id] || ""}
                            onChange={(e) =>
                              handleRatingChange(
                                session.appointment_id,
                                e.target.value
                              )
                            }
                          >
                            <option value="">Select</option>
                            <option value="1">1 - Poor</option>
                            <option value="2">2 - Fair</option>
                            <option value="3">3 - Good</option>
                            <option value="4">4 - Very Good</option>
                            <option value="5">5 - Excellent</option>
                          </select>
                        </div>

                        <button
                          className="btn btn-primary"
                          style={{
                            backgroundColor: "#4956AD",
                            border: "none",
                            borderRadius: "6px",
                            padding: "8px 20px",
                          }}
                          disabled={
                            submitting || !ratings[session.appointment_id]
                          }
                          onClick={() =>
                            handleSubmitRating(session.appointment_id)
                          }
                        >
                          {submitting ? "Submitting..." : "Submit Rating"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Feedback;
