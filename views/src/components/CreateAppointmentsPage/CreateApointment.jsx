import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import FillOut from "./Steps/FillOut/FillOut";
import Schedule from "./Steps/Schedule/Schedule";
import Overview from "./Steps/Overview/Overview";
import Settled from "./Steps/Settled/Settled";
import "./CreateAppointment.css";

export default function CreateAppointment() {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({});
    
    const [showConfirm, setShowConfirm] = useState(false);
    const [alertState, setAlertState] = useState({ show: false, title: "", message: "" });

    const navigate = useNavigate();

    function updateFormData(updates) {
        setFormData((prev) => ({ ...prev, ...updates }));
    }

    const closeAlert = () => setAlertState({ show: false, title: "", message: "" });
    const closeConfirm = () => setShowConfirm(false);

    function next() {
        // Step 0: Subject & Date Check
        if (step === 0) {
            if (!formData.courseCode || !formData.preferredDate) {
                setAlertState({ 
                    show: true, 
                    title: "Whooo's looking for a tutor?", 
                    message: "Please select a Subject and Date so we can fly in the correct schedule!" 
                });
                return;
            }
        }
        
        // Step 1: Tutor Selection Check
        if (step === 1) {
            if (!formData.vacant_id) {
                setAlertState({ 
                    show: true, 
                    title: "Empty Perch!", // UPDATED: Witty Title
                    message: "You haven't picked a tutor yet. Please select a wise owl to guide you!" // UPDATED: Witty Message
                });
                return;
            }
        }

        // Step 2: Show Confirmation Modal
        if (step === 2) {
            setShowConfirm(true);
            return;
        }

        // Final Step: Navigate Home
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

    const isNextDisabled = step === 1 && formData.hasAvailableTutors === false;

    return (
        <div className="create-appointment-container container mt-4">
            <div className="create-appointment-step">{steps[step]}</div>

            <div className="pb-2 create-appointment-nav d-flex justify-content-between mt-4">
                {step > 0 && step < steps.length - 1 && (
                    <button className="btn btn-outline-secondary px-4" onClick={prev}>
                        Back
                    </button>
                )}

                {step < steps.length - 1 ? (
                    <button 
                        className="btn btn-primary px-4 ms-auto" 
                        onClick={next}
                        disabled={isNextDisabled}
                    >
                        Next
                    </button>
                ) : (
                    <button className="btn btn-success px-4 ms-auto" onClick={next}>
                        Finish
                    </button>
                )}
            </div>

            {/* Validation Alert */}
            <Modal show={alertState.show} onHide={closeAlert} centered>
                <Modal.Header closeButton className="bg-warning-subtle">
                    <Modal.Title>{alertState.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>{alertState.message}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={closeAlert}>
                        Got it!
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Confirmation Modal */}
            <Modal show={showConfirm} onHide={closeConfirm} centered>
                <Modal.Header closeButton>
                    {/* UPDATED: Witty Title */}
                    <Modal.Title>Ready to Fly?</Modal.Title> 
                </Modal.Header>
                <Modal.Body>
                    {/* UPDATED: Witty Message */}
                    <p>Please double-check your flight plan! Are all these details correct?</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeConfirm}>
                        Wait, Go Back
                    </Button>
                    <Button variant="success" onClick={confirmProceed}>
                        Confirm & Proceed
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}