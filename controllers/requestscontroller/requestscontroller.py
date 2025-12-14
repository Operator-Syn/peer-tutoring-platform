from flask import Blueprint, jsonify, request
from utils.db import get_connection
from psycopg2.extras import RealDictCursor
from datetime import datetime

requests_bp = Blueprint("requests_bp", __name__, url_prefix="/api/requests")



@requests_bp.route("/pending/<tutor_id>", methods=["GET"])
def get_pending_requests(tutor_id):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    query = """
        SELECT 
            a.appointment_id,
            a.tutee_id,
            COALESCE(t.first_name, 'Unknown') || ' ' || 
            COALESCE(t.middle_name, '') || ' ' || 
            COALESCE(t.last_name, '') AS name,
            a.course_code,
            a.appointment_date,
            v.vacant_id,
            v.tutor_id,
            v.day_of_week,
            v.start_time,
            v.end_time,
            a.status
        FROM appointment a
        JOIN availability v ON a.vacant_id = v.vacant_id
        LEFT JOIN tutee t ON a.tutee_id = t.id_number
        WHERE v.tutor_id = %s
          AND a.status = 'PENDING'
        ORDER BY a.appointment_date, v.start_time;
    """

    cur.execute(query, (tutor_id,))
    results = cur.fetchall()
    cur.close()
    conn.close()

    for r in results:
        if r.get("appointment_date"):
            r["appointment_date"] = r["appointment_date"].isoformat()
        if r.get("start_time"):
            r["start_time"] = r["start_time"].strftime("%H:%M")
        if r.get("end_time"):
            r["end_time"] = r["end_time"].strftime("%H:%M")
        if r.get("day_of_week"):
            r["day_of_week"] = r["day_of_week"].strip()

    return jsonify(results)


@requests_bp.route("/update-status/<int:appointment_id>", methods=["PUT"])
def update_appointment_status(appointment_id):
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")

    if new_status not in ("BOOKED", "CANCELLED", "COMPLETED"):
        return jsonify({"error": "Invalid status"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        # ✅ Fetch appointment info INCLUDING appointment_date
        # Needed so we only cancel competitors for this exact date (not other days)
        cur.execute(
            """
            SELECT 
                a.vacant_id,
                a.tutee_id,
                a.course_code,
                a.appointment_date,
                av.tutor_id,
                av.start_time,
                av.end_time
            FROM appointment a
            JOIN availability av ON a.vacant_id = av.vacant_id
            WHERE a.appointment_id = %s
            """,
            (appointment_id,),
        )
        appt = cur.fetchone()

        if not appt:
            return jsonify({"error": "Appointment not found"}), 404

        vacant_id, tutee_id, course_code, appointment_date, tutor_id, start_time, end_time = appt

        # ✅ Update the appointment status
        cur.execute(
            """
            UPDATE appointment
            SET status = %s
            WHERE appointment_id = %s
            """,
            (new_status, appointment_id),
        )

        # ✅ If BOOKED, cancel competitors + log + notify
        if new_status == "BOOKED":
            # A) Auto-decline competitors on same slot + same date
            cur.execute(
                """
                UPDATE appointment
                SET status = 'CANCELLED'
                WHERE vacant_id = %s
                  AND appointment_date = %s
                  AND status = 'PENDING'
                  AND appointment_id != %s
                """,
                (vacant_id, appointment_date, appointment_id),
            )

            # B) Log history
            cur.execute(
                """
                INSERT INTO history (tutor_id, tutee_id, start_time, end_time, subject_name)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (tutor_id, tutee_id, start_time, end_time, course_code),
            )

            # C) Notify
            cur.execute(
                """
                INSERT INTO notifications (tutor_id, tutee_id)
                VALUES (%s, %s)
                """,
                (tutor_id, tutee_id),
            )

        conn.commit()
        return jsonify({"message": f"Appointment {appointment_id} updated to {new_status}!"}), 200

    except Exception as e:
        conn.rollback()
        print("❌ Error in update_appointment_status:", e)
        return jsonify({"error": "Internal server error"}), 500

    finally:
        cur.close()
        conn.close()


@requests_bp.route("/delete/<int:request_id>", methods=["DELETE"])
def delete_request(request_id):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("DELETE FROM request WHERE request_id = %s", (request_id,))
    conn.commit()

    cur.close()
    conn.close()
    return jsonify({"message": f"Request {request_id} deleted"}), 200


@requests_bp.route("/search", methods=["GET"])
def search_requests():
    query = request.args.get("q", "").strip()
    tutor_id = request.args.get("tutor_id", "").strip()

    if not tutor_id:
        return jsonify({"error": "Missing tutor_id"}), 400

    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        name_concat = "TRIM(CONCAT(t.first_name, ' ', COALESCE(t.middle_name || ' ', ''), t.last_name))"

        base_select = f"""
            SELECT 
                a.appointment_id,
                a.tutee_id,
                {name_concat} AS name,
                a.course_code,
                tu.program_code,
                a.appointment_date,
                av.day_of_week,
                av.start_time,
                av.end_time,
                a.status
            FROM appointment a
            JOIN tutee t ON a.tutee_id = t.id_number
            JOIN tutee tu ON a.tutee_id = tu.id_number
            JOIN availability av ON a.vacant_id = av.vacant_id
            WHERE av.tutor_id = %s
            AND a.status = 'PENDING'
        """

        if query:
            search_filter = f"""
                AND (
                    {name_concat} ILIKE %s OR
                    a.tutee_id::TEXT ILIKE %s OR
                    a.course_code ILIKE %s OR
                    tu.program_code ILIKE %s OR
                    a.status ILIKE %s OR
                    TO_CHAR(a.appointment_date, 'YYYY-MM-DD') ILIKE %s
                )
            """
            sql = base_select + search_filter + " ORDER BY a.appointment_date, av.start_time"
            like = f"%{query}%"
            cur.execute(sql, (tutor_id, like, like, like, like, like, like))
        else:
            sql = base_select + " ORDER BY a.appointment_date, av.start_time"
            cur.execute(sql, (tutor_id,))

        results = cur.fetchall()

        for r in results:
            if r.get("appointment_date"):
                r["appointment_date"] = r["appointment_date"].isoformat()
            if r.get("start_time"):
                r["start_time"] = r["start_time"].strftime("%H:%M")
            if r.get("end_time"):
                r["end_time"] = r["end_time"].strftime("%H:%M")

        return jsonify(results)

    except Exception as e:
        print("❌ Search error:", e)
        return jsonify({"error": "Internal Server Error"}), 500

    finally:
        cur.close()
        conn.close()


@requests_bp.route("/appointments/<tutor_id>", methods=["GET"])
def get_appointments(tutor_id):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute(
        """
        SELECT 
            a.appointment_id,
            t.first_name,
            t.middle_name,
            t.last_name,
            a.course_code,
            a.appointment_date,
            av.start_time,
            av.end_time
        FROM appointment a
        JOIN availability av ON a.vacant_id = av.vacant_id
        JOIN tutee t ON a.tutee_id = t.id_number
        WHERE av.tutor_id = %s
          AND a.status = 'BOOKED'
        ORDER BY a.appointment_date ASC, av.start_time ASC
        """,
        (tutor_id,),
    )

    results = cur.fetchall()
    cur.close()
    conn.close()

    for row in results:
        if row.get("appointment_date"):
            row["appointment_date"] = row["appointment_date"].isoformat()
        if row.get("start_time"):
            row["start_time"] = row["start_time"].strftime("%H:%M")
        if row.get("end_time"):
            row["end_time"] = row["end_time"].strftime("%H:%M")

    return jsonify(results)


@requests_bp.route("/appointments/clear/<int:appointment_id>", methods=["DELETE"])
def clear_appointment(appointment_id):
    """
    (Legacy) Hard delete an appointment.
    You can keep or remove this if you only want the 'finish' behaviour.
    """
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("DELETE FROM appointment WHERE appointment_id = %s", (appointment_id,))
        conn.commit()
        return jsonify({"message": f"Appointment {appointment_id} cleared"}), 200

    except Exception as e:
        conn.rollback()
        print("❌ Error in clear_appointment:", e)
        return jsonify({"error": "Internal server error"}), 500

    finally:
        cur.close()
        conn.close()


@requests_bp.route("/update-status-and-log/<int:appointment_id>", methods=["PUT"])
def update_appointment_status_and_log(appointment_id):
    """
    Update the appointment status and log it to history table.
    Accept = BOOKED
    Decline = CANCELLED
    """
    data = request.get_json(silent=True) or {}
    action = data.get("action")  # "accept" or "decline"

    if action not in ["accept", "decline"]:
        return jsonify({"error": "Invalid action"}), 400

    new_status = "BOOKED" if action == "accept" else "CANCELLED"

    conn = get_connection()
    cur = conn.cursor()

    try:
        # ✅ Include vacant_id + appointment_date so we can auto-cancel competitors
        cur.execute(
            """
            SELECT 
                a.tutee_id,
                a.course_code,
                a.vacant_id,
                a.appointment_date,
                av.tutor_id,
                av.start_time,
                av.end_time
            FROM appointment a
            JOIN availability av ON a.vacant_id = av.vacant_id
            WHERE a.appointment_id = %s
            """,
            (appointment_id,),
        )

        appt = cur.fetchone()
        if not appt:
            return jsonify({"error": "Appointment not found"}), 404

        tutee_id, course_code, vacant_id, appointment_date, tutor_id, start_time, end_time = appt

        # 2) Update target status
        cur.execute(
            """
            UPDATE appointment
            SET status = %s
            WHERE appointment_id = %s
            """,
            (new_status, appointment_id),
        )
        auto_cancelled = 0
        if new_status == "BOOKED":
            # A) Log history
            cur.execute(
                """
                INSERT INTO history (tutor_id, tutee_id, start_time, end_time, subject_name)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (tutor_id, tutee_id, start_time, end_time, course_code),
            )

            # B) Notify winner
            cur.execute(
                """
                INSERT INTO notifications (tutor_id, tutee_id, action)
                VALUES (%s, %s, %s)
                """,
                (tutor_id, tutee_id, new_status),
            )

            # C) Auto-decline competitors
            cur.execute(
    """
    UPDATE appointment
    SET status = 'CANCELLED'
    WHERE vacant_id = %s
      AND appointment_date = %s
      AND status = 'PENDING'
      AND appointment_id != %s
    RETURNING appointment_id
    """,
    (vacant_id, appointment_date, appointment_id),
)

            auto_cancelled = cur.rowcount


        elif new_status == "CANCELLED":
            # Notify declined
            cur.execute(
                """
                INSERT INTO notifications (tutor_id, tutee_id, action)
                VALUES (%s, %s, %s)
                """,
                (tutor_id, tutee_id, new_status),
            )

        conn.commit()
        return jsonify({
    "message": f"Appointment {new_status} successfully!",
    "auto_cancelled": auto_cancelled if new_status == "BOOKED" else 0
}), 200


    except Exception as e:
        conn.rollback()
        print("❌ Error in update_appointment_status_and_log:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()

@requests_bp.route("/appointments/finish/<int:appointment_id>", methods=["POST"])
def finish_appointment(appointment_id):
    """
    Save snapshot into session_rating first, then MARK appointment as COMPLETED
    (do NOT delete it because messages reference appointment_id).
    """
    conn = get_connection()
    cur = conn.cursor()

    try:
        # 1) Get all needed info
        cur.execute(
            """
            SELECT
                a.tutee_id,
                av.tutor_id,
                a.course_code,
                a.appointment_date,
                av.start_time,
                av.end_time
            FROM appointment a
            JOIN availability av ON a.vacant_id = av.vacant_id
            WHERE a.appointment_id = %s
            """,
            (appointment_id,),
        )
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "Appointment not found"}), 404

        tutee_id, tutor_id, course_code, appointment_date, start_time, end_time = row

        # 2) Insert snapshot into session_rating (rating=0)
        cur.execute(
            """
            INSERT INTO session_rating
                (appointment_id, tutee_id, tutor_id, rating, course_code, appointment_date, start_time, end_time)
            VALUES
                (%s, %s, %s, 0, %s, %s, %s, %s)
            ON CONFLICT (appointment_id, tutee_id) DO NOTHING
            """,
            (appointment_id, tutee_id, tutor_id, course_code, appointment_date, start_time, end_time),
        )

        # 3) Mark appointment as COMPLETED (instead of deleting)
        cur.execute(
            """
            UPDATE appointment
            SET status = 'COMPLETED'
            WHERE appointment_id = %s
            """,
            (appointment_id,),
        )

        conn.commit()
        return jsonify({"message": "Appointment marked COMPLETED. Rating is now available."}), 200

    except Exception as e:
        conn.rollback()
        print("❌ Error in finish_appointment:", e)
        return jsonify({"error": "Internal server error"}), 500

    finally:
        cur.close()
        conn.close()
