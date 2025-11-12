import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Overview.css";

export default function Overview({ data }) {
    // Convert preferredDate to readable format
    const formattedDate = data.preferredDate
        ? new Date(data.preferredDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        : "—";

    return (
        <div className="container p-5 mt-4 overview-container rounded shadow-sm bg-light">
            <h3 className="mb-3 h3-absolute">Overview</h3>
            <h3 className="mb-4 text-center text-primary fw-bold">Appointment Overview</h3>

            {/* --- Personal Information Section --- */}
            <div className="mb-4">
                <h5 className="border-bottom pb-2 mb-3 text-secondary">Tutee Information</h5>
                <div className="row g-3">
                    <div className="col-md-6">
                        <p><strong>First Name:</strong> {data.firstName || "—"}</p>
                    </div>
                    <div className="col-md-6">
                        <p><strong>Last Name:</strong> {data.lastName || "—"}</p>
                    </div>
                    <div className="col-md-6">
                        <p><strong>Middle Name:</strong> {data.middleName || "—"}</p>
                    </div>
                    <div className="col-md-6">
                        <p><strong>ID Number:</strong> {data.idNumber || "—"}</p>
                    </div>
                    <div className="col-md-6">
                        <p><strong>Year Level:</strong> {data.yearLevel || "—"}</p>
                    </div>
                    <div className="col-md-6">
                        <p><strong>Program Code:</strong> {data.programCode || "—"}</p>
                    </div>
                </div>
            </div>

            {/* --- Tutoring Request Section --- */}
            <div className="mb-4">
                <h5 className="border-bottom pb-2 mb-3 text-secondary">Tutoring Details</h5>
                <div className="row g-3">
                    <div className="col-md-6">
                        <p><strong>Subject Code:</strong> {data.courseCode || "—"}</p>
                    </div>
                    <div className="col-md-6">
                        <p><strong>Vacant Slot ID:</strong> {data.vacant_id || "—"}</p>
                    </div>
                    <div className="col-md-6">
                        <p><strong>Tutor Name:</strong> {data.tutor_name || "—"}</p>
                    </div>
                    <div className="col-md-6">
                        <p><strong>Tutor ID:</strong> {data.tutor_id || "—"}</p>
                    </div>
                    <div className="col-md-6">
                        <p><strong>Preferred Date:</strong> {formattedDate}</p>
                    </div>
                    <div className="col-md-6">
                        <p><strong>Day:</strong> {data.day_of_week || "—"}</p>
                    </div>
                    <div className="col-md-6">
                        <p><strong>Time:</strong> {data.formatted_time || "—"}</p>
                    </div>
                </div>
            </div>

            {/* --- Summary Notice --- */}
            <div className="alert alert-info mt-4">
                <p className="mb-0">
                    Please review the details above before submitting your appointment.
                    If something looks incorrect, click <strong>Back</strong> to make changes.
                </p>
            </div>
        </div>
    );
}
