from flask import Blueprint, jsonify, request
from utils.db import get_connection
from psycopg2.extras import RealDictCursor

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


@requests_bp.route("/update-status-and-log/<int:appointment_id>", methods=["PUT"])
def update_appointment_status_and_log(appointment_id):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        data = request.get_json(silent=True) or {}
        action = (data.get("action") or "").lower()

        if action not in ("accept", "decline"):
            return jsonify({"error": "Invalid action"}), 400

        # ✅ get appointment info first (we need vacant_id + appointment_date)
        cur.execute("""
            SELECT appointment_id, vacant_id, appointment_date, status
            FROM appointment
            WHERE appointment_id = %s
        """, (appointment_id,))
        appt = cur.fetchone()

        if not appt:
            return jsonify({"error": "Appointment not found"}), 404

        # ✅ if accepting, pre-check if slot already has a BOOKED appointment
        if action == "accept":
            cur.execute("""
                SELECT 1
                FROM appointment
                WHERE vacant_id = %s
                  AND appointment_date = %s
                  AND status = 'BOOKED'
                  AND appointment_id <> %s
                LIMIT 1
            """, (appt["vacant_id"], appt["appointment_date"], appointment_id))

            already_taken = cur.fetchone()
            if already_taken:
                conn.rollback()
                return jsonify({"error": "This schedule is already taken."}), 409

            # set to BOOKED
            cur.execute("""
                UPDATE appointment
                SET status = 'BOOKED'
                WHERE appointment_id = %s
            """, (appointment_id,))

            # (optional) add your logging insert here if you have one

            conn.commit()
            return jsonify({"message": "Accepted"}), 200

        # decline
        cur.execute("""
            UPDATE appointment
            SET status = 'CANCELLED'
            WHERE appointment_id = %s
        """, (appointment_id,))

        # (optional) add your logging insert here if you have one

        conn.commit()
        return jsonify({"message": "Declined"}), 200

    except IntegrityError as e:
        conn.rollback()

        # ✅ Unique constraint violation (vacant_id, appointment_date) already booked
        # Postgres unique violation code = 23505
        if getattr(e, "pgcode", None) == "23505" and "unique_booked_slot" in str(e):
           return jsonify({"error": "That schedule has already been taken."}), 409


        print("❌ IntegrityError in update_appointment_status_and_log:", e)
        return jsonify({"error": "Database integrity error"}), 500

    except Exception as e:
        conn.rollback()
        print("❌ Error in update_appointment_status_and_log:", e)
        return jsonify({"error": "Internal server error"}), 500

    finally:
        cur.close()
        conn.close()



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
                t.program_code,
                a.appointment_date,
                av.day_of_week,
                av.start_time,
                av.end_time,
                a.status
            FROM appointment a
            JOIN tutee t ON a.tutee_id = t.id_number
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
                    t.program_code ILIKE %s OR
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


from flask import request  # make sure this is imported

@requests_bp.route("/appointments/<tutor_id>", methods=["GET"])
def get_appointments(tutor_id):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # ?status=BOOKED,PENDING,COMPLETED
    status_param = (request.args.get("status") or "BOOKED").strip()
    statuses = [s.strip().upper() for s in status_param.split(",") if s.strip()]

    allowed = {"BOOKED", "PENDING", "COMPLETED", "CANCELLED"}
    statuses = [s for s in statuses if s in allowed]
    if not statuses:
        statuses = ["BOOKED"]

    cur.execute(
        """
        SELECT 
            a.appointment_id,
            a.status,
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
          AND a.status = ANY(%s)
        ORDER BY a.appointment_date ASC, av.start_time ASC
        """,
        (tutor_id, statuses),
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


@requests_bp.route("/create-pending-appointment", methods=["POST"])
def create_pending_appointment():
    data = request.get_json(silent=True) or {}

    vacant_id = data.get("vacant_id")
    tutee_id = data.get("tutee_id")
    course_code = data.get("course_code")
    appointment_date = data.get("appointment_date")

    status = "PENDING"

    if not all([vacant_id, tutee_id, course_code, appointment_date]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT tutor_id, start_time, end_time
            FROM availability
            WHERE vacant_id = %s
            """,
            (vacant_id,),
        )
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "Availability slot not found"}), 404

        tutor_id, start_time, end_time = row

        cur.execute(
            """
            INSERT INTO appointment (vacant_id, tutee_id, course_code, appointment_date, status)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING appointment_id
            """,
            (vacant_id, tutee_id, course_code, appointment_date, status),
        )
        new_appt_id = cur.fetchone()[0]

        # Notification to tutor: BOOKING_REQUEST
        cur.execute(
            """
            INSERT INTO notifications (recipient_id, sender_id, type, reference_id, message_text)
            VALUES (%s, %s, 'BOOKING_REQUEST', %s, %s)
            """,
            (
                tutor_id,
                tutee_id,
                new_appt_id,
                f"New booking request for {course_code} on {appointment_date} ({start_time}-{end_time}).",
            ),
        )

        conn.commit()
        return jsonify({"message": "Appointment requested successfully", "id": new_appt_id}), 201

    except Exception as e:
        conn.rollback()
        print("❌ Error creating appointment:", e)

        if "unique_request_per_student" in str(e):
            return jsonify({"error": "You already have a pending request for this slot."}), 409
        if "unique_active_booking" in str(e):
            return jsonify({"error": "This slot is currently locked by another student."}), 409

        return jsonify({"error": "Failed to create appointment"}), 500

    finally:
        cur.close()
        conn.close()


@requests_bp.route("/appointments/finish/<int:appointment_id>", methods=["POST"])
def finish_appointment(appointment_id):
    """
    Create a session_rating row (rating=0) then mark appointment COMPLETED.
    No snapshot columns because session_rating no longer has them.
    """
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT
                a.tutee_id,
                av.tutor_id
            FROM appointment a
            JOIN availability av ON a.vacant_id = av.vacant_id
            WHERE a.appointment_id = %s
            """,
            (appointment_id,),
        )

        row = cur.fetchone()
        if not row:
            return jsonify({"error": "Appointment not found"}), 404

        tutee_id, tutor_id = row

        cur.execute(
            """
            INSERT INTO session_rating (appointment_id, tutee_id, tutor_id, rating)
            VALUES (%s, %s, %s, 0)
            ON CONFLICT (appointment_id, tutee_id) DO NOTHING
            """,
            (appointment_id, tutee_id, tutor_id),
        )

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
