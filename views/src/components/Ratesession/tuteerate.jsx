import React, { useState } from "react";
import "./tuteerate.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function TuteeRate({ sessionId, isTutor = false, onViewRatings }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log("TuteeRate isTutor prop:", isTutor);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sessionId) {
      alert("No session selected.");
      return;
    }
    if (rating === 0) {
      alert("Please select a rating.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        session_id: sessionId,
        rating,
        comment,
      };

      const res = await fetch(`${API_BASE_URL}/api/ratings/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to submit");

      alert("Thanks for rating your session!");
      setRating(0);
      setComment("");
    } catch (err) {
      console.error(err);
      alert("Error submitting rating.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rate-page tutee-rate-page">
      {/* header row with optional tutor button */}
      <div className="tutee-rate-header">
        <h2 className="tutee-rate-title">Rate Your Session</h2>

        {isTutor && (
          <button
            type="button"
            className="btn btn-outline-primary btn-sm tutee-rate-view-btn"
            onClick={onViewRatings}
          >
            View My Ratings
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="rate-form tutee-rate-form">
        {/* Stars */}
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

        {/* Comment */}
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
    </div>
  );
}

export default TuteeRate;
