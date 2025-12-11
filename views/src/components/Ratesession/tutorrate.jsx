import React, { useEffect, useState } from "react";
import "./tutorrate.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function TutorRate() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/ratings/my_ratings`, {
          credentials: "include",
        });

        const data = await res.json();
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
    "★".repeat(count) + "☆".repeat(5 - count);

  return (
    <div className="tutor-ratings-page">
      <h2 className="mb-3">Your Session Ratings</h2>

      {loading && <p>Loading ratings...</p>}

      {!loading && ratings.length === 0 && (
        <p className="text-muted">No one has rated you yet.</p>
      )}

      {!loading && ratings.length > 0 && (
        <div className="ratings-list">
          {ratings.map((r) => (
            <div key={r.rating_id} className="rating-card">
              <div className="rating-header">
                <strong>{r.rated_by_name || "Anonymous Tutee"}</strong>
                <span className="stars-text">{renderStars(r.rating)}</span>
              </div>

              <p className="rating-comment">
                {r.comment || "No comment left."}
              </p>

              <small className="text-muted">
                {r.date_submitted
                  ? new Date(r.date_submitted).toLocaleString()
                  : ""}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TutorRate;
