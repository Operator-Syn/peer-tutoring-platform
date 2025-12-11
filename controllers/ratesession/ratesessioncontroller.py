from flask import Blueprint, jsonify, request
from utils.db import get_connection
from psycopg2.extras import RealDictCursor

rate_session_bp = Blueprint(
    "rate_session_bp",
    __name__,
    url_prefix="/api/rate-session"
)


@rate_session_bp.route("/pending/<tutee_id>", methods=["GET"])
def get_pending_session_ratings(tutee_id):
    """
    Return all session_rating rows for this tutee where rating = 0.
    These are the sessions they still need to rate.
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
                sr.created_at,

                -- basic appointment info
                a.course_code,
                a.appointment_date,
                av.start_time,
                av.end_time,

                -- tutor name (tutor is a subtype of tutee)
                tut.first_name AS tutor_first_name,
                tut.middle_name AS tutor_middle_name,
                tut.last_name AS tutor_last_name

            FROM session_rating sr
            JOIN appointment a
              ON sr.appointment_id = a.appointment_id
            JOIN availability av
              ON a.vacant_id = av.vacant_id
            JOIN tutor tu
              ON sr.tutor_id = tu.tutor_id
            JOIN tutee tut
              ON tu.tutor_id = tut.id_number

            WHERE sr.tutee_id = %s  -- ✅ only this tutee
              AND sr.rating = 0     -- ✅ only not-yet-rated sessions
            ORDER BY a.appointment_date DESC, av.start_time DESC
            """,
            (tutee_id,),
        )

        rows = cur.fetchall()

        # Format date/time for frontend
        for r in rows:
            if r.get("appointment_date"):
                r["appointment_date"] = r["appointment_date"].isoformat()
            if r.get("start_time"):
                r["start_time"] = r["start_time"].strftime("%H:%M")
            if r.get("end_time"):
                r["end_time"] = r["end_time"].strftime("%H:%M")

        return jsonify(rows), 200

    except Exception as e:
        print("❌ Error in get_pending_session_ratings:", e)
        return jsonify({"error": "Internal server error"}), 500

    finally:
        cur.close()
        conn.close()


@rate_session_bp.route("/rate/<int:appointment_id>", methods=["PUT"])
def rate_session(appointment_id):
    """
    Update the rating (1–5) for a given appointment + tutee in session_rating.
    """
    data = request.get_json(silent=True) or {}
    rating = data.get("rating")
    tutee_id = data.get("tutee_id")  # we’ll pass this from frontend

    if not tutee_id:
        return jsonify({"error": "tutee_id is required"}), 400

    # Validate rating
    try:
        rating = int(rating)
    except (TypeError, ValueError):
        return jsonify({"error": "Rating must be an integer 1–5"}), 400

    if rating < 1 or rating > 5:
        return jsonify({"error": "Rating must be between 1 and 5"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            UPDATE session_rating
            SET rating = %s
            WHERE appointment_id = %s
              AND tutee_id = %s
            """,
            (rating, appointment_id, tutee_id),
        )

        if cur.rowcount == 0:
            return jsonify({"error": "Session rating row not found"}), 404

        conn.commit()
        return jsonify({"message": "Rating submitted successfully"}), 200

    except Exception as e:
        conn.rollback()
        print("❌ Error in rate_session:", e)
        return jsonify({"error": "Internal server error"}), 500

    finally:
        cur.close()
        conn.close()
