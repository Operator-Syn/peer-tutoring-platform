import React, { useEffect, useState } from "react";
import "./tutorrate.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function TutorRate() {
  const [tutorId, setTutorId] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const resUser = await fetch("/api/auth/get_user", {
          credentials: "include",
        });
        if (!resUser.ok) {
          window.location.href = "/api/auth/login";
          return;
        }
        const user = await resUser.json();
        const googleId = (user.sub || user.google_id || "").toString().trim();

        const resTutees = await fetch("/api/tutee/all", {
          credentials: "include",
        });
        const tutees = await resTutees.json();
        const me = tutees.find(
          (t) => (t.google_id || "").toString().trim() === googleId
        );

        if (!me) {
          console.warn("No tutee found for this google_id");
          setLoading(false);
          return;
        }

        const idNumber = (me.id_number || "").toString().trim();

        const resTutors = await fetch("/api/tutor/all", {
          credentials: "include",
        });
        const tutors = await resTutors.json();
        const tutorRow = tutors.find(
          (t) => (t.tutor_id || "").toString().trim() === idNumber
        );

        if (!tutorRow) {
          console.warn("User is not a tutor, no ratings to show.");
          setTutorId(null);
          setRatings([]);
          return;
        }

        setTutorId(idNumber);

        const res = await fetch(
          `${API_BASE_URL}/api/rate-session/tutor/${idNumber}`,
          { credentials: "include" }
        );

        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data.error || "Failed to load ratings");

        setRatings(data || []);
      } catch (err) {
        console.error("Fetch ratings error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, []);

  const renderStars = (count) =>
    "★".repeat(count || 0) + "☆".repeat(5 - (count || 0));

  const averageRating =
    ratings.length > 0
      ? (
          ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length
        ).toFixed(1)
      : null;

  const totalReviews = ratings.length;

  return (
    <div className="tutor-ratings-page">
      <div className="tutor-ratings-card">
        <h2 className="tutor-ratings-title">Your Session Ratings</h2>

        {loading && <p className="tutor-text-muted">Loading ratings...</p>}

        {!loading && tutorId === null && (
          <p className="tutor-text-muted">
            You are not registered as a tutor, so there are no ratings to show.
          </p>
        )}

        {!loading && tutorId !== null && (
          <>
            <div className="tutor-summary">
              <div className="tutor-summary-left">
                <div className="tutor-summary-rating">
                  {averageRating || "—"}
                </div>
                <div className="tutor-summary-stars">
                  {renderStars(Math.round(averageRating || 0))}
                </div>
                <div className="tutor-summary-count">
                  {totalReviews} review{totalReviews === 1 ? "" : "s"}
                </div>
              </div>

              <div className="tutor-summary-right">
                <p className="tutor-text-muted">
                  These are the feedback and star ratings given by tutees from
                  your completed sessions.
                </p>
              </div>
            </div>

            {ratings.length === 0 && (
              <p className="tutor-text-muted mt-3">No one has rated you yet.</p>
            )}

            {ratings.length > 0 && (
              <div className="ratings-stack ratings-stack-scroll">
                {ratings.map((r) => {
                  const raterName =
                    [
                      r.tutee_first_name,
                      r.tutee_middle_name,
                      r.tutee_last_name,
                    ]
                      .filter(Boolean)
                      .join(" ") ||
                    r.tutee_id ||
                    "Unknown tutee";

                  const sessionInfo = [
                    r.course_code,
                    r.appointment_date,
                    r.start_time && r.end_time
                      ? `${r.start_time}–${r.end_time}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" • ");

                  const createdAt = r.created_at
                    ? new Date(r.created_at).toLocaleString()
                    : "";

                  return (
                    <div key={r.rating_id} className="rating-card">
                      <div className="rating-card-header">
                        <div className="rating-avatar">
                          {raterName
                            .split(" ")
                            .filter(Boolean)
                            .map((n) => n[0]?.toUpperCase() || "")
                            .join("")
                            .slice(0, 2)}
                        </div>

                        <div className="rating-header-text">
                          <div className="rating-rater-name">{raterName}</div>
                          {sessionInfo && (
                            <div className="rating-session-info">
                              {sessionInfo}
                            </div>
                          )}
                        </div>

                        <div className="rating-stars-badge">
                          <span className="rating-stars-number">
                            {r.rating || 0}
                          </span>
                          <span className="rating-stars-symbols">
                            {renderStars(r.rating)}
                          </span>
                        </div>
                      </div>

                      <div className="rating-comment">
                        {r.comment && r.comment.trim()
                          ? r.comment
                          : "No comment left."}
                      </div>

                      {createdAt && (
                        <div className="rating-footer">
                          <span className="rating-date">Rated on {createdAt}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default TutorRate;
