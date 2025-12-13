from utils.db import db

class SubjectRequest(db.Model):
    __tablename__ = "subject_request"

    request_id = db.Column(db.BigInteger, primary_key=True)
    requester_id = db.Column(db.String(32), db.ForeignKey("tutee.id_number"), nullable=False)
    subject_code = db.Column(db.String(32), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), nullable=False, default="PENDING")
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())