# controllers/ratesessioncontroller/ratesessioncontroller.py

from flask import Blueprint, jsonify, request
from utils.db import get_connection
from psycopg2.extras import RealDictCursor

rate_session_bp = Blueprint(
    "rate_session_bp", __name__, url_prefix="/api/rate-session"
)


@rate_session_bp.route("/pending/<tutee_id>", methods=["GET"])
def get_pending_ratings(tutee_id):
    """
    Pending ratings for a tutee:
      - rating = 0
      - Uses snapshot fields stored in session_rating (so it works even if appointment is deleted)
    """
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute(
            """
            SELECT
                sr.rating_id,
                sr.appointment_id,
                sr.tutee_id,
                sr.tutor_id,
                sr.rating,
                sr.comment,
                sr.created_at,

                -- ✅ snapshot info saved in session_rating
                sr.course_code,
                sr.appointment_date,
                sr.start_time,
                sr.end_time,

                -- tutor name
                tt.first_name  AS tutor_first_name,
                tt.middle_name AS tutor_middle_name,
                tt.last_name   AS tutor_last_name
            FROM session_rating sr
            JOIN tutor tu
              ON sr.tutor_id = tu.tutor_id
            JOIN tutee tt
              ON tu.tutor_id = tt.id_number
            WHERE sr.tutee_id = %s
              AND sr.rating = 0
            ORDER BY sr.created_at DESC
            """,
            (tutee_id,),
        )

        rows = cur.fetchall()

        for r in rows:
            if r.get("appointment_date"):
                r["appointment_date"] = r["appointment_date"].isoformat()
            if r.get("start_time"):
                r["start_time"] = r["start_time"].strftime("%H:%M")
            if r.get("end_time"):
                r["end_time"] = r["end_time"].strftime("%H:%M")
            if r.get("created_at"):
                r["created_at"] = r["created_at"].isoformat()

        return jsonify(rows), 200

    except Exception as e:
        print("❌ Error in get_pending_ratings:", e)
        return jsonify({"error": "Internal server error"}), 500

    finally:
        cur.close()
        conn.close()


@rate_session_bp.route("/rate/<int:appointment_id>", methods=["PUT"])
def submit_rating(appointment_id):
    """
    Update a session_rating row for this appointment to a value 1–5
    and save the optional comment.
    """
    data = request.get_json(silent=True) or {}
    rating = data.get("rating")
    comment = data.get("comment")

    try:
        rating = int(rating)
    except (TypeError, ValueError):
        return jsonify({"error": "Rating must be an integer"}), 400

    if rating < 1 or rating > 5:
        return jsonify({"error": "Rating must be between 1 and 5"}), 400

    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute(
            """
            SELECT rating_id
            FROM session_rating
            WHERE appointment_id = %s
            """,
            (appointment_id,),
        )
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "Session rating row not found"}), 404

        cur.execute(
            """
            UPDATE session_rating
            SET rating = %s,
                comment = %s
            WHERE appointment_id = %s
            """,
            (rating, comment, appointment_id),
        )

        conn.commit()
        return jsonify({"message": "Rating submitted successfully"}), 200

    except Exception as e:
        conn.rollback()
        print("❌ Error in submit_rating:", e)
        return jsonify({"error": "Internal server error"}), 500

    finally:
        cur.close()
        conn.close()


@rate_session_bp.route("/tutor/<tutor_id>", methods=["GET"])
def get_tutor_ratings(tutor_id):
    """
    Return all ratings for a tutor (rated sessions only).
    Uses snapshot fields stored in session_rating (so it works even if appointment is deleted).
    """
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute(
            """
            SELECT
                sr.rating_id,
                sr.appointment_id,
                sr.tutee_id,
                sr.tutor_id,
                sr.rating,
                sr.comment,
                sr.created_at,

                -- tutee (rater) name
                t.first_name  AS tutee_first_name,
                t.middle_name AS tutee_middle_name,
                t.last_name   AS tutee_last_name,

                -- ✅ snapshot info saved in session_rating
                sr.course_code,
                sr.appointment_date,
                sr.start_time,
                sr.end_time
            FROM session_rating sr
            JOIN tutee t
              ON sr.tutee_id = t.id_number
            WHERE sr.tutor_id = %s
              AND sr.rating > 0
            ORDER BY sr.created_at DESC
            """,
            (tutor_id,),
        )

        rows = cur.fetchall()

        for r in rows:
            if r.get("appointment_date"):
                r["appointment_date"] = r["appointment_date"].isoformat()
            if r.get("start_time"):
                r["start_time"] = r["start_time"].strftime("%H:%M")
            if r.get("end_time"):
                r["end_time"] = r["end_time"].strftime("%H:%M")
            if r.get("created_at"):
                r["created_at"] = r["created_at"].isoformat()

        return jsonify(rows), 200

    except Exception as e:
        print("❌ Error in get_tutor_ratings:", e)
        return jsonify({"error": "Internal server error"}), 500

    finally:
        cur.close()
        conn.close()
