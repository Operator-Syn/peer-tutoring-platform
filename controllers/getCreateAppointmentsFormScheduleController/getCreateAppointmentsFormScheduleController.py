from flask import Blueprint, jsonify, request
from psycopg2.extras import RealDictCursor
from datetime import datetime
from utils.db import get_connection
from models.getCreateAppointmentsFormScheduleModel.getCreateAppointmentsFormScheduleModel import AvailabilityCard

bp_availability = Blueprint("availability_by_subject", __name__, url_prefix="/api")


def fetch_availability_cards(rows):
    """Convert DB rows into AvailabilityCard dictionaries."""
    return [
        AvailabilityCard(
            vacant_id=row["vacant_id"],
            tutor_id=row["tutor_id"],
            tutor_name=row["tutor_name"],
            course_code=row["course_code"],
            day_of_week=row["day_of_week"],
            start_time=row["start_time"],
            end_time=row["end_time"],
        ).__dict__
        for row in rows
    ]


@bp_availability.route("/availability/by-subject", methods=["GET"])
def get_availability_by_subject():
    course_code = request.args.get("course_code")
    appointment_date = request.args.get("appointment_date")  # YYYY-MM-DD

    if not course_code or not appointment_date:
        return jsonify({"error": "Missing course_code or appointment_date parameter"}), 400

    # Convert string date to datetime object
    try:
        appointment_dt = datetime.strptime(appointment_date, "%Y-%m-%d")
    except ValueError:
        return jsonify({"error": "Invalid date format, expected YYYY-MM-DD"}), 400

    # Compute day of week
    day_of_week_name = appointment_dt.strftime("%A")  # 'Friday'

    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    query = """
        SELECT
            av.vacant_id,
            tr.tutor_id,
            tt.first_name || ' ' || COALESCE(tt.middle_name || ' ', '') || tt.last_name AS tutor_name,
            th.course_code,
            av.day_of_week,
            av.start_time,
            av.end_time
        FROM teaches th
        JOIN tutor tr ON th.tutor_id = tr.tutor_id
        JOIN tutee tt ON tr.tutor_id = tt.id_number
        JOIN availability av ON tr.tutor_id = av.tutor_id
        WHERE th.course_code = %s
          AND tr.status = 'ACTIVE'
          AND UPPER(av.day_of_week) = UPPER(%s)
          AND av.vacant_id NOT IN (
              SELECT a.vacant_id
              FROM appointment a
              WHERE a.status IN ('BOOKED', 'PENDING')
                AND a.appointment_date = %s
          )
        ORDER BY av.start_time;
    """

    try:
        cur.execute(query, [course_code, day_of_week_name, appointment_date])
        results = cur.fetchall()
    finally:
        cur.close()
        conn.close()

    return jsonify(fetch_availability_cards(results))
