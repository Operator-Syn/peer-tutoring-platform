import React, { useState } from "react";
import "./tuteerate.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// session = one row from /api/rate-session/pending/<tutee_id>
function TuteeRate({ session, isTutor = false, onViewRatings, onRated }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tutorRatings, setTutorRatings] = useState([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [showRatings, setShowRatings] = useState(false);

  // modal confirm
  const [showConfirm, setShowConfirm] = useState(false);

  const tutorFullName = session
    ? [
        session.tutor_first_name,
        session.tutor_middle_name,
        session.tutor_last_name,
      ]
        .filter(Boolean)
        .join(" ")
    : null;

  const appointmentId = session?.appointment_id;
  const tutorLabel = tutorFullName || session?.tutor_id || "your tutor";

  // called when user clicks "Submit Rating" (opens modal only)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!appointmentId) {
      alert("No session selected.");
      return;
    }
    if (rating === 0) {
      alert("Please select a rating.");
      return;
    }

    setShowConfirm(true);
  };

  // actual submit (called when modal "Yes" is clicked)
  const performSubmit = async () => {
    if (!appointmentId) return;

    setIsSubmitting(true);
    try {
      const payload = {
        rating,
        comment,
      };

      const res = await fetch(
        `${API_BASE_URL}/api/rate-session/rate/${appointmentId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to submit");

      alert("Thanks for rating your session!");

      // tell parent to reload list
      if (typeof onRated === "function") {
        onRated();
      }

      setRating(0);
      setComment("");
      setShowConfirm(false);
    } catch (err) {
      console.error(err);
      alert("Error submitting rating.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewRatingsClick = async () => {
    if (onViewRatings) {
      onViewRatings();
      return;
    }

    const tutorId = session?.tutor_id;
    if (!tutorId) {
      alert("No tutor_id available for this session.");
      return;
    }

    setRatingsLoading(true);
    setShowRatings(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/rate-session/tutor/${tutorId}`, {
        credentials: "include",
      });

      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.error || "Failed to load ratings");

      setTutorRatings(data);
    } catch (err) {
      console.error("Error loading tutor ratings:", err);
      alert("Error loading ratings.");
    } finally {
      setRatingsLoading(false);
    }
  };

  return (
    <>
      <div className="rate-page tutee-rate-page">
        <div className="tutee-rate-header">
          <h2 className="tutee-rate-title">Rate Your Session</h2>

          {/* ✅ show for both tutor and tutee */}
         
        </div>

        <div className="tutee-rate-session-info mb-3">
          <p className="mb-0">
            You are rating:&nbsp;<strong>{tutorLabel}</strong>
          </p>
          {session?.tutor_id && (
            <p className="small text-muted mb-0">
              Tutor ID: <span>{session.tutor_id}</span>
            </p>
          )}
          {appointmentId && (
            <p className="small text-muted mb-0">
              Session ID: <span>{appointmentId}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="rate-form tutee-rate-form">
          <div className="stars tutee-rate-stars mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                className={`star-btn tutee-rate-star-btn ${
                  star <= (hover || rating) ? "active" : ""
                }`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
              >
                ★
              </button>
            ))}
          </div>

          <p className="small text-muted tutee-rate-hint">
            {rating === 0 ? "Select a rating" : `You rated ${rating}/5`}
          </p>

          <label className="form-label fw-semibold mt-2 tutee-rate-comment-label">
            Comment
          </label>
          <textarea
            className="form-control tutee-rate-comment"
            rows="4"
            placeholder="Write feedback about your tutor..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <button
            className="btn btn-primary mt-3 tutee-rate-submit-btn"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Rating"}
          </button>
        </form>

        {/* ✅ show for both tutor and tutee */}
        {showRatings && (
          <div className="tutor-ratings mt-4">
            <h3 className="h5">
              {isTutor ? "My Ratings" : "Tutor Ratings"}
            </h3>

            {ratingsLoading && <p>Loading ratings...</p>}

            {!ratingsLoading && tutorRatings.length === 0 && (
              <p className="text-muted">No ratings found.</p>
            )}

            {!ratingsLoading && tutorRatings.length > 0 && (
              <ul className="list-group">
                {tutorRatings.map((r) => {
                  const raterName =
                    [
                      r.tutee_first_name,
                      r.tutee_middle_name,
                      r.tutee_last_name,
                    ]
                      .filter(Boolean)
                      .join(" ") || r.tutee_id || "Unknown tutee";

                  return (
                    <li key={r.rating_id} className="list-group-item">
                      <div className="d-flex justify-content-between">
                        <div>
                          <strong>{raterName}</strong>{" "}
                          <span className="badge bg-primary ms-2">
                            {r.rating}/5
                          </span>
                          <div className="small text-muted">
  {[
    r.course_code,
    r.appointment_date,
    r.start_time && r.end_time ? `${r.start_time}–${r.end_time}` : null,
  ]
    .filter(Boolean)
    .join(" • ") || "Session details not available."}
</div>

                        </div>
                        {r.created_at && (
                          <div className="small text-muted">
                            {new Date(r.created_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                      {r.comment && (
                        <p className="mt-2 mb-0 small">“{r.comment}”</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Confirm modal overlay */}
      {showConfirm && (
        <div
          className="confirm-overlay"
          onClick={() => !isSubmitting && setShowConfirm(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1100,
          }}
        >
          <div
            className="confirm-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "white",
              borderRadius: "10px",
              padding: "20px 24px",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            <h5>Confirm Rating</h5>
            <p className="mt-3 mb-4">
              Submit a rating of <strong>{rating}/5</strong> for{" "}
              <strong>{tutorLabel}</strong>?
            </p>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn my-no-btn"
                onClick={() => setShowConfirm(false)}
                disabled={isSubmitting}
              >
                No
              </button>
              <button
                type="button"
                className="btn my-yes-btn btn-primary"
                onClick={performSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Yes, submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TuteeRate;
