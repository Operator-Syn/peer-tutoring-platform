import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import FillOut from "./Steps/FillOut/FillOut";
import Schedule from "./Steps/Schedule/Schedule";
import Overview from "./Steps/Overview/Overview";
import Settled from "./Steps/Settled/Settled";
import "./CreateAppointment.css";

export default function CreateAppointment() {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({});
    const [showConfirm, setShowConfirm] = useState(false);
    const navigate = useNavigate();

    function updateFormData(updates) {
        setFormData((prev) => ({ ...prev, ...updates }));
    }

    function next() {
        // Validation for FillOut step (step 0)
        if (step === 0) {
            if (!formData.courseCode || !formData.preferredDate) {
                alert("Please select a subject and a date before continuing.");
                return;
            }
        }

        // Step 1: require a tutor selection
        if (step === 1) {
            if (!formData.vacant_id) {
                alert("Please select a tutor before continuing.");
                return;
            }
        }

        // Step 2: Overview step — show confirmation modal first
        if (step === 2) {
            setShowConfirm(true);
            return;
        }

        // Step 3 (Settled) — redirect to home
        if (step === steps.length - 1) {
            navigate("/");
            return;
        }

        setStep((s) => Math.min(s + 1, steps.length - 1));
    }

    function confirmProceed() {
        setShowConfirm(false);
        setStep((s) => Math.min(s + 1, steps.length - 1));
    }

    function prev() {
        setStep((s) => Math.max(s - 1, 0));
    }

    const steps = [
        <FillOut data={formData} update={updateFormData} />,
        <Schedule data={formData} update={updateFormData} />,
        <Overview data={formData} />,
        <Settled data={formData} />,
    ];

    return (
        <div className="create-appointment-container container mt-4">
            <div className="create-appointment-step">{steps[step]}</div>

            <div className="pb-2 create-appointment-nav d-flex justify-content-between mt-4">
                {step > 0 && step < steps.length - 1 && (
                    <button
                        className="btn btn-outline-secondary px-4"
                        onClick={prev}
                    >
                        Back
                    </button>
                )}

                {step < steps.length - 1 ? (
                    <button
                        className="btn btn-primary px-4 ms-auto"
                        onClick={next}
                    >
                        Next
                    </button>
                ) : (
                    <button
                        className="btn btn-success px-4 ms-auto"
                        onClick={next}
                    >
                        Finish
                    </button>
                )}
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div
                    className="modal fade show"
                    tabIndex="-1"
                    style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirm Appointment</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowConfirm(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>
                                    Please confirm that all details are correct before submitting your appointment.
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowConfirm(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={confirmProceed}
                                >
                                    Confirm & Proceed
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
