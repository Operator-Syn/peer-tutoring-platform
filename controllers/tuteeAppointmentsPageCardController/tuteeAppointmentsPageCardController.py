from flask import Blueprint, jsonify, session
from models.tuteeAppointmentsPageCardModel.tuteeAppointmentsPageCardModel import AppointmentCard, ModalContentItem
from utils.db import get_connection
from psycopg2.extras import RealDictCursor

bp_appointments = Blueprint("appointments", __name__, url_prefix="/api")

def fetch_appointment_cards(results):
    """Convert DB rows into AppointmentCard instances"""
    cards = []
    for result in results:
        appointment_date_str = result['appointment_date'].strftime("%B %d, %Y")
        start_time_str = result['start_time'].strftime("%I:%M %p")
        end_time_str = result['end_time'].strftime("%I:%M %p")
        modal_content = [
            ModalContentItem(text=result['tutor_name'], role="Tutor", url=f"/tutor/{result['tutor_id']}"),
            ModalContentItem(text=result['tutee_name'], role="Tutee")
        ]
        card = AppointmentCard(
            subject_code=result['course_code'],
            tutor_name=result['tutor_name'],
            tutee_name=result['tutee_name'],
            appointment_date=appointment_date_str,
            start_time=start_time_str,
            end_time=end_time_str,
            modal_content=modal_content
        )
        cards.append(card.__dict__)
    return cards

@bp_appointments.route("/appointments")
def get_user_appointments():
    user = session.get("user")
    if not user or not user.get("sub"):
        return jsonify({"error": "User not authenticated"}), 401

    google_id = user["sub"]

    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # --- Fetch the current tutee ID ---
        cur.execute("SELECT id_number FROM tutee WHERE google_id = %s LIMIT 1;", (google_id,))
        tutee_result = cur.fetchone()
        if not tutee_result:
            return jsonify({"error": "No tutee found for this account"}), 404
        tutee_id = tutee_result["id_number"]

        query = """
        SELECT
            a.appointment_id,
            a.appointment_date,
            a.status,
            t.id_number AS tutor_id,
            t.first_name || ' ' || COALESCE(t.middle_name,'') || ' ' || t.last_name AS tutor_name,
            tu.id_number AS tutee_id,
            tu.first_name || ' ' || COALESCE(tu.middle_name,'') || ' ' || tu.last_name AS tutee_name,
            av.start_time,
            av.end_time,
            c.course_code,
            c.course_name
        FROM appointment a
        JOIN availability av ON a.vacant_id = av.vacant_id
        JOIN tutor tr ON av.tutor_id = tr.tutor_id
        JOIN tutee t ON tr.tutor_id = t.id_number
        JOIN tutee tu ON a.tutee_id = tu.id_number
        JOIN course c ON a.course_code = c.course_code
        WHERE a.tutee_id = %s
        ORDER BY a.appointment_date, av.start_time;
        """
        cur.execute(query, (tutee_id,))
        results = cur.fetchall()
        return jsonify(fetch_appointment_cards(results))

    finally:
        cur.close()
        conn.close()
