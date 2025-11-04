# controllers/tuteeAppointmentsPageCardController.py
from flask import Blueprint, jsonify
from datetime import datetime
from models.tuteeAppointmentsPageCardModel.tuteeAppointmentsPageCardModel import AppointmentCard, ModalContentItem
from utils.db import get_connection
from psycopg2.extras import RealDictCursor

bp_appointments = Blueprint("appointmcd ents", __name__, url_prefix="/api")

def fetch_appointment_cards(results):
    """Helper to convert DB rows into AppointmentCard instances"""
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
def get_all_appointments():
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    query = """
        SELECT
            a.appointment_id,
            a.appointment_date,
            a.status,
            t.id_number AS tutor_id,
            t.first_name || ' ' || t.middle_name || ' ' || t.last_name AS tutor_name,
            tu.id_number AS tutee_id,
            tu.first_name || ' ' || tu.middle_name || ' ' || tu.last_name AS tutee_name,
            av.start_time,
            av.end_time,
            c.course_code,
            c.course_name
        FROM appointment a
        JOIN availability av ON a.vacant_id = av.vacant_id
        JOIN tutor ttr ON av.tutor_id = ttr.tutor_id
        JOIN tutee t ON t.id_number = ttr.tutor_id
        JOIN tutee tu ON a.tutee_id = tu.id_number
        JOIN teaches th ON ttr.tutor_id = th.tutor_id
        JOIN course c ON th.course_code = c.course_code
        ORDER BY a.appointment_date, av.start_time
    """
    cur.execute(query)
    results = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(fetch_appointment_cards(results))
