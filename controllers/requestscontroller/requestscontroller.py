from flask import Blueprint, jsonify, request
from utils.db import get_connection
from psycopg2.extras import RealDictCursor
from datetime import datetime

requests_bp = Blueprint("requests_bp", __name__, url_prefix="/api/requests")

# ✅ GET all pending requests for a tutor
@requests_bp.route("/pending/<tutor_id>", methods=["GET"])
def get_pending_requests(tutor_id):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    query = """
        SELECT 
            r.request_id,
            r.tutee_id,
            r.name,
            r.course_code,
            r.appointment_date,
            r.program_code,
            TO_CHAR(r.appointment_date, 'Day') AS day_of_week,
            r.start_time,
            r.end_time,
            r.status
        FROM request r
        JOIN tutee tu ON r.tutee_id = tu.id_number
        JOIN course c ON r.course_code = c.course_code
        WHERE r.tutor_id = %s AND r.status = 'PENDING'
        ORDER BY r.appointment_date, r.start_time
    """

    cur.execute(query, (tutor_id,))
    results = cur.fetchall()
    cur.close()
    conn.close()

    # Format datetime fields for JSON response
    for r in results:
        r["appointment_date"] = r["appointment_date"].isoformat()
        r["start_time"] = r["start_time"].strftime("%H:%M")
        r["end_time"] = r["end_time"].strftime("%H:%M")
        # Strip trailing spaces from day_of_week (Postgres pads 'Day' to width)
        if r.get("day_of_week"):
            r["day_of_week"] = r["day_of_week"].strip()

    return jsonify(results)




@requests_bp.route("/update-status/<int:request_id>", methods=["PUT"])
def update_request_status(request_id):
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")

    # Only allow "APPROVED" to trigger auto-creation
    if new_status != "APPROVED":
        return jsonify({"error": "Only approval triggers appointment creation"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        # 1️⃣ Fetch request details
        cur.execute("""
            SELECT request_id, tutor_id, tutee_id, program_code, year_level,
                   TO_CHAR(appointment_date, 'Day') AS day_of_week,
                   course_code, appointment_date, start_time, end_time
            FROM request
            WHERE request_id = %s
        """, (request_id,))
        req = cur.fetchone()

        if not req:
            return jsonify({"error": "Request not found"}), 404

        (
            _,
            tutor_id,
            tutee_id,
            program_code,
            year_level,
            day_of_week,
            course_code,
            appointment_date,
            start_time,
            end_time
        ) = req

        # Clean the day name from padding
        day_of_week = day_of_week.strip().upper()

        # 2️⃣ Ensure tutor exists
        cur.execute("""
            INSERT INTO tutor (tutor_id, status)
            VALUES (%s, 'ACTIVE')
            ON CONFLICT (tutor_id) DO NOTHING
        """, (tutor_id,))

        # 3️⃣ Ensure tutor teaches the course
        cur.execute("""
            INSERT INTO teaches (tutor_id, course_code)
            VALUES (%s, %s)
            ON CONFLICT DO NOTHING
        """, (tutor_id, course_code))

        # 4️⃣ Reuse existing availability slot if it exists, otherwise create it
        cur.execute("""
            SELECT vacant_id
            FROM availability
            WHERE tutor_id = %s AND day_of_week = %s AND start_time = %s AND end_time = %s
        """, (tutor_id, day_of_week, start_time, end_time))
        existing_avail = cur.fetchone()

        if existing_avail:
            vacant_id = existing_avail[0]
        else:
            cur.execute("""
                INSERT INTO availability (tutor_id, day_of_week, start_time, end_time)
                VALUES (%s, %s, %s, %s)
                RETURNING vacant_id
            """, (tutor_id, day_of_week, start_time, end_time))
            vacant_id = cur.fetchone()[0]

        # 5️⃣ Create appointment only if not already existing
        cur.execute("""
            SELECT appointment_id FROM appointment
            WHERE vacant_id = %s AND appointment_date = %s
        """, (vacant_id, appointment_date))
        existing = cur.fetchone()

        if existing:
            appointment_id = existing[0]
        else:
            cur.execute("""
    INSERT INTO appointment (vacant_id, tutee_id, appointment_date, status, course_code)
    VALUES (%s, %s, %s, 'BOOKED', %s)
    RETURNING appointment_id
""", (vacant_id, tutee_id, appointment_date, course_code))

            appointment_id = cur.fetchone()[0]

        # 6️⃣ Update request status to APPROVED
        cur.execute("""
            UPDATE request
            SET status = 'APPROVED'
            WHERE request_id = %s
        """, (request_id,))


        # ✅ Insert into history
        cur.execute("""
            INSERT INTO history (tutor_id, tutee_id, start_time, end_time, subject_name)
            VALUES (%s, %s, %s, %s, %s)
        """, (tutor_id, tutee_id, start_time, end_time, course_code))

        # ✅ Insert into notifications
        cur.execute("""
            INSERT INTO notifications (tutor_id, tutee_id)
            VALUES (%s, %s)
        """, (tutor_id, tutee_id))



        conn.commit()
        return jsonify({"message": f"Appointment {appointment_id} created successfully!"}), 200

    except Exception as e:
        conn.rollback()
        print("❌ Error in update_request_status (auto-appointment):", e)
        return jsonify({"error": "Internal server error"}), 500

    finally:
        cur.close()
        conn.close()





# ✅ DELETE endpoint for declined requests
@requests_bp.route("/delete/<int:request_id>", methods=["DELETE"])
def delete_request(request_id):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("DELETE FROM request WHERE request_id = %s", (request_id,))
    conn.commit()

    cur.close()
    conn.close()

    return jsonify({"message": f"Request {request_id} deleted"}), 200


# ✅ SEARCH requests (with day of week)
# ✅ SEARCH requests (searches across all card values + day of week)
@requests_bp.route("/search", methods=["GET"])
def search_requests():
    query = request.args.get("q", "").strip()

    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if not query:
            sql = """
                SELECT 
                    r.request_id,
                    r.tutee_id,
                    r.name,
                    r.course_code,
                    r.program_code,
                    r.appointment_date,
                    TO_CHAR(r.appointment_date, 'Day') AS day_of_week,
                    r.start_time,
                    r.end_time,
                    r.status
                FROM request r
                JOIN course c ON r.course_code = c.course_code
                WHERE r.status = 'PENDING'
                ORDER BY r.appointment_date, r.start_time
                LIMIT 20
            """
            cur.execute(sql)
        else:
            sql = """
                SELECT 
                    r.request_id,
                    r.tutee_id,
                    r.name,
                    r.course_code,
                    r.program_code,
                    r.appointment_date,
                    TO_CHAR(r.appointment_date, 'Day') AS day_of_week,
                    r.start_time,
                    r.end_time,
                    r.status
                FROM request r
                JOIN course c ON r.course_code = c.course_code
                WHERE (
                    r.name ILIKE %s OR
                    r.tutee_id::TEXT ILIKE %s OR
                    r.request_id::TEXT ILIKE %s OR
                    r.course_code ILIKE %s OR
                    r.program_code ILIKE %s OR
                    r.status ILIKE %s OR
                    TO_CHAR(r.appointment_date, 'YYYY-MM-DD') ILIKE %s OR
                    TO_CHAR(r.appointment_date, 'Day') ILIKE %s
                )
                ORDER BY r.appointment_date, r.start_time
            """
            like = f"%{query}%"
            cur.execute(sql, (like, like, like, like, like, like, like, like))

        results = cur.fetchall()

        # Format date & time for JSON output
        for r in results:
            r["appointment_date"] = r["appointment_date"].isoformat()
            r["start_time"] = r["start_time"].strftime("%H:%M")
            r["end_time"] = r["end_time"].strftime("%H:%M")
            if r.get("day_of_week"):
                r["day_of_week"] = r["day_of_week"].strip()

        return jsonify(results)

    except Exception as e:
        print("Search error:", e)
        return jsonify({"error": "Internal Server Error"}), 500

    finally:
        cur.close()
        conn.close()

@requests_bp.route("/appointments/<tutor_id>", methods=["GET"])
def get_appointments(tutor_id):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute("""
        SELECT 
            a.appointment_id AS request_id,
            t.name,
            a.course_code,
            a.appointment_date,
            av.start_time,
            av.end_time
        FROM appointment a
        JOIN availability av ON a.vacant_id = av.vacant_id
        JOIN tutee t ON a.tutee_id = t.id_number
        WHERE av.tutor_id = %s
        ORDER BY a.appointment_date ASC, av.start_time ASC
    """, (tutor_id,))

    results = cur.fetchall()
    cur.close()
    conn.close()

    for row in results:
        row["appointment_date"] = row["appointment_date"].isoformat()
        row["start_time"] = row["start_time"].strftime("%H:%M")
        row["end_time"] = row["end_time"].strftime("%H:%M")

    return jsonify(results)

@requests_bp.route("/update-status-and-log/<id>", methods=["PUT"])
def update_request_status_and_log(id):
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")

    if not new_status:
        return jsonify({"error": "Missing status"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        # 1️⃣ Update status and fetch important details
        cur.execute("""
            UPDATE request
            SET status = %s
            WHERE request_id = %s
            RETURNING tutor_id, tutee_id, start_time, end_time, course_code;
        """, (new_status, request_id))

        result = cur.fetchone()
        if not result:
            return jsonify({"error": "Request not found"}), 404

        tutor_id, tutee_id, start_time, end_time, course_code = result

        # 2️⃣ When approved, insert to history + notifications
        if new_status == "APPROVED":
            cur.execute("""
                INSERT INTO history (tutor_id, tutee_id, start_time, end_time, subject_name)
                VALUES (%s, %s, %s, %s, %s)
            """, (tutor_id, tutee_id, start_time, end_time, course_code))

            cur.execute("""
                INSERT INTO notifications (tutor_id, tutee_id)
                VALUES (%s, %s)
            """, (tutor_id, tutee_id))

        conn.commit()
        return jsonify({"message": f"Request {new_status} successfully!"}), 200

    except Exception as e:
        conn.rollback()
        print("❌ Error in update_request_status:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()
