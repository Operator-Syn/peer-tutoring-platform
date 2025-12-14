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
        <div className="create-appointment-form-bg">
            {/* Matches FillOut side label style */}
            <h3 className="fillout-side-label h3-absolute">Overview</h3>

            {/* Matches FillOut inner container and gap */}
            <div className="container d-flex flex-column fillout-content-gap">
                
                {/* Matches FillOut title style */}
                <h1 className="text-center text-decoration-underline fillout-title">
                    Pre-Flight Check
                </h1>

                {/* --- SECTION 1: The Owlet (Personal Info) --- */}
                <h5 className="text-secondary mt-2 mb-0">The Owlet (That's You!)</h5>
                
                <div className="row g-3">
                    {/* Left Column */}
                    <div className="col-12 col-md-6 d-flex flex-column gap-3">
                        <div className="custom-border-label-group">
                            <label className="form-label custom-border-label">First Name</label>
                            <input
                                type="text"
                                className="form-control custom-input"
                                value={data.firstName || "—"}
                                readOnly
                            />
                        </div>
                        <div className="custom-border-label-group">
                            <label className="form-label custom-border-label">Middle Name</label>
                            <input
                                type="text"
                                className="form-control custom-input"
                                value={data.middleName || "—"}
                                readOnly
                            />
                        </div>
                        <div className="custom-border-label-group">
                            <label className="form-label custom-border-label">ID Number</label>
                            <input
                                type="text"
                                className="form-control custom-input"
                                value={data.idNumber || "—"}
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="col-12 col-md-6 d-flex flex-column gap-3">
                        <div className="custom-border-label-group">
                            <label className="form-label custom-border-label">Last Name</label>
                            <input
                                type="text"
                                className="form-control custom-input"
                                value={data.lastName || "—"}
                                readOnly
                            />
                        </div>
                        <div className="custom-border-label-group">
                            <label className="form-label custom-border-label">Year Level</label>
                            <input
                                type="text"
                                className="form-control custom-input"
                                value={data.yearLevel || "—"}
                                readOnly
                            />
                        </div>
                        <div className="custom-border-label-group">
                            <label className="form-label custom-border-label">Program Code</label>
                            <input
                                type="text"
                                className="form-control custom-input"
                                value={data.programCode || "—"}
                                readOnly
                            />
                        </div>
                    </div>
                </div>

                <hr className="text-secondary opacity-25 my-1" />

                {/* --- SECTION 2: Flight Plan (Tutoring Details) --- */}
                <h5 className="text-secondary mb-0">Flight Plan & Destination</h5>
                
                {/* Subject & Tutor */}
                <div className="row g-3">
                    <div className="col-md-6">
                        <div className="custom-border-label-group">
                            <label className="form-label custom-border-label">Target Subject</label>
                            <input
                                type="text"
                                className="form-control custom-input"
                                value={data.courseCode || "—"}
                                readOnly
                            />
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="custom-border-label-group">
                            <label className="form-label custom-border-label">Assigned Wise Owl</label>
                            <input
                                type="text"
                                className="form-control custom-input"
                                value={data.tutor_name || "—"}
                                readOnly
                            />
                        </div>
                    </div>
                </div>

                {/* Date, Time, Day (3 Columns for visual balance) */}
                <div className="row g-3">
                    <div className="col-md-4">
                        <div className="custom-border-label-group">
                            <label className="form-label custom-border-label">Date</label>
                            <input
                                type="text"
                                className="form-control custom-input"
                                value={formattedDate}
                                readOnly
                            />
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="custom-border-label-group">
                            <label className="form-label custom-border-label">Day</label>
                            <input
                                type="text"
                                className="form-control custom-input"
                                value={data.day_of_week || "—"}
                                readOnly
                            />
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="custom-border-label-group">
                            <label className="form-label custom-border-label">Time</label>
                            <input
                                type="text"
                                className="form-control custom-input"
                                value={data.formatted_time || "—"}
                                readOnly
                            />
                        </div>
                    </div>
                </div>

                {/* Technical IDs */}
                <div className="row g-3">
                    <div className="col-md-6">
                        <div className="custom-border-label-group">
                            <label className="form-label custom-border-label">Tutor ID</label>
                            <input
                                type="text"
                                className="form-control custom-input"
                                value={data.tutor_id || "—"}
                                readOnly
                            />
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="custom-border-label-group">
                            <label className="form-label custom-border-label">Vacant Slot ID</label>
                            <input
                                type="text"
                                className="form-control custom-input"
                                value={data.vacant_id || "—"}
                                readOnly
                            />
                        </div>
                    </div>
                </div>

                {/* --- Summary Notice --- */}
                <div className="alert alert-info mt-2 shadow-sm">
                    <p className="mb-0 small">
                        <strong>Ready to lock it in?</strong> Give everything a final look.
                        If a feather is out of place, click <strong>Back</strong> to fix it. 
                        Otherwise, click <strong>Finish</strong> to confirm your appointment!
                    </p>
                </div>
            </div>
        </div>
    );
}