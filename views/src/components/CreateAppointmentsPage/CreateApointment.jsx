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

        if (step === steps.length - 1) {
            // Last step: redirect to home
            navigate("/");
            return;
        }

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
        <div className="create-appointment-container container">
            <div className="create-appointment-step">{steps[step]}</div>

            <div className="create-appointment-nav">
                {step > 0 && step < steps.length - 1 && (
                    <button className="nav-button back-button" onClick={prev}>
                        Back
                    </button>
                )}
                {step < steps.length - 1 ? (
                    <button className="nav-button next-button" onClick={next}>
                        Next
                    </button>
                ) : (
                    <button className="nav-button next-button" onClick={next}>
                        Finish
                    </button>
                )}
            </div>
        </div>
    );
}
