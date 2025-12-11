import React, { useState } from "react";

export default function Banned() {
    const [appealText, setAppealText] = useState("");
    const [files, setFiles] = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!appealText.trim()) return alert("Please explain your appeal.");
        
        setLoading(true);
        const formData = new FormData();
        formData.append("appeal_text", appealText);
        
        for (let i = 0; i < files.length; i++) {
            formData.append("files", files[i]);
        }

        try {
            const res = await fetch("/api/appeals/submit", {
                method: "POST",
                body: formData
            });
            if (res.ok) {
                setSubmitted(true);
            } else {
                alert("Failed to submit appeal.");
            }
        } catch(err) {
            console.error(err);
            alert("Network error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container d-flex flex-column align-items-center justify-content-center vh-100">
            <div className="card p-5 shadow text-center" style={{maxWidth: "600px", width: "100%"}}>
                <h1 className="text-danger mb-4">Account Suspended</h1>
                <p className="lead">Your account has been suspended due to a violation of our community guidelines.</p>
                
                {submitted ? (
                    <div className="alert alert-success mt-4">
                        Appeal submitted. An admin will review it shortly.
                    </div>
                ) : (
                    <div className="mt-4 text-start">
                        <label className="form-label fw-bold">Explanation:</label>
                        <textarea 
                            className="form-control mb-3" 
                            rows="4" 
                            placeholder="Why should we lift the suspension?"
                            value={appealText}
                            onChange={(e) => setAppealText(e.target.value)}
                        ></textarea>

                        <label className="form-label fw-bold">Evidence (Optional):</label>
                        <input 
                            type="file" 
                            multiple 
                            className="form-control mb-4"
                            onChange={(e) => setFiles(e.target.files)}
                        />

                        <button className="btn btn-primary w-100" onClick={handleSubmit} disabled={loading}>
                            {loading ? "Submitting..." : "Submit Appeal"}
                        </button>
                    </div>
                )}
                <a href="/api/auth/logout" className="btn btn-link mt-3 text-muted">Logout</a>
            </div>
        </div>
    );
}