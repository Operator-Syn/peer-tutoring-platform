import React, { useState } from "react";
import FillOut from "./Steps/FillOut/FillOut";
import Schedule from "./Steps/Schedule/Scedule";
import Overview from "./Steps/Overview/Overview";
import Settled from "./Steps/Settled/Settled";
import "./CreateAppointment.css"; // optional external styling

export default function CreateAppointment() {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        program: "",
        subjectCode: "",
        date: "",
    });

    function updateFormData(updates) {
        setFormData(function (prev) {
            return { ...prev, ...updates };
        });
    }

    function next() {
        setStep(function (s) {
            return Math.min(s + 1, steps.length - 1);
        });
    }

    function prev() {
        setStep(function (s) {
            return Math.max(s - 1, 0);
        });
    }

    const steps = [
        <FillOut data={formData} update={updateFormData} />,
        <Schedule data={formData} update={updateFormData} />,
        <Overview data={formData} />,
        <Settled data={formData} />,
    ];

    return (
        <div className="create-appointment-container container">
            <h2 className="create-appointment-title">Create Appointment</h2>

            <div className="create-appointment-step">{steps[step]}</div>

            <div className="create-appointment-nav">
                {step > 0 && (
                    <button className="nav-button back-button" onClick={prev}>
                        Back
                    </button>
                )}
                {step < steps.length - 1 && (
                    <button className="nav-button next-button" onClick={next}>
                        Next
                    </button>
                )}
            </div>
        </div>
    );
}
