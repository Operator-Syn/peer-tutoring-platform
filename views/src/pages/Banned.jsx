import React, { useState } from "react";

export default function Banned() {
    const [appealText, setAppealText] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        const res = await fetch("/api/appeals/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ appeal_text: appealText })
        });
        if (res.ok) setSubmitted(true);
    };

    return (
        <div className="container d-flex flex-column align-items-center justify-content-center vh-100">
            <div className="card p-5 shadow text-center" style={{maxWidth: "600px"}}>
                <h1 className="text-danger mb-4"> Account Suspended</h1>
                <p className="lead">Your account has been suspended due to a violation of our community guidelines.</p>
                
                {submitted ? (
                    <div className="alert alert-success mt-4">
                        Your appeal has been submitted. An admin will review it shortly.
                    </div>
                ) : (
                    <div className="mt-4 text-start">
                        <label className="form-label fw-bold">Submit an Appeal:</label>
                        <textarea 
                            className="form-control mb-3" 
                            rows="4" 
                            placeholder="Explain why your suspension should be lifted..."
                            value={appealText}
                            onChange={(e) => setAppealText(e.target.value)}
                        ></textarea>
                        <button className="btn btn-primary w-100" onClick={handleSubmit}>
                            Submit Appeal
                        </button>
                    </div>
                )}
                
                <a href="/api/auth/logout" className="btn btn-link mt-3 text-muted">Logout</a>
            </div>
        </div>
    );
}