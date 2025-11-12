from db import db  # your SQLAlchemy db instance

class Request(db.Model):
    __tablename__ = "request"

    request_id = db.Column(db.BigInteger, primary_key=True)
    tutee_id = db.Column(db.String(32), db.ForeignKey("tutee.id_number"), nullable=False)
    tutor_id = db.Column(db.String(32), db.ForeignKey("tutor.tutor_id"), nullable=False)
    year_level = db.Column(db.SmallInteger, nullable=False)
    day_of_week = db.Column(db.String(10), nullable=False)
    program_code = db.Column(db.String(32), nullable=False)
    course_code = db.Column(db.String(32), nullable=False)
    appointment_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="PENDING")
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())
    name = db.Column(db.String(100), nullable=False)
