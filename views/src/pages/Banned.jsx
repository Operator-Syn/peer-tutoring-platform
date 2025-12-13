import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap"; 
import "bootstrap/dist/css/bootstrap.min.css";

export default function Banned() {
    const [appealText, setAppealText] = useState("");
    const [files, setFiles] = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState({ title: "", body: "" });

    // Handle file selection (Multiple files)
    const handleFileChange = (e) => {
        setFiles(e.target.files);
    };

    const showAlert = (title, body) => {
        setModalContent({ title, body });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!appealText.trim()) {
            showAlert("Missing Information", "Please provide an explanation for your appeal.");
            return;
        }
        
        setLoading(true);
        
        const formData = new FormData();
        formData.append("appeal_text", appealText);
        
        for (let i = 0; i < files.length; i++) {
            formData.append("files", files[i]);
        }

        try {
            const res = await fetch("/api/appeals/submit", {
                method: "POST",
                credentials: "include",
                body: formData 
            });

            if (res.ok) {
                setSubmitted(true);
            } else {
                const data = await res.json();
                showAlert("Submission Failed", data.error || "Failed to submit appeal. Please try again.");
            }
        } catch(err) {
            console.error(err);
            showAlert("Network Error", "Could not connect to the server. Please check your internet connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container d-flex flex-column align-items-center justify-content-center vh-100 pt-5">
            <div className="card p-5 shadow text-center border-0" style={{maxWidth: "600px", width: "100%", borderRadius: "15px"}}>
                <h1 className="text-danger mb-3 display-1"><i className="bi bi-shield-lock-fill"></i></h1>
                <h2 className="text-danger mb-4">Account Suspended</h2>
                <p className="lead text-muted">Your account has been suspended due to a violation of our community guidelines.</p>
                
                {submitted ? (
                    <div className="alert alert-success mt-4 p-4 rounded-3 shadow-sm">
                        <h4 className="alert-heading"><i className="bi bi-check-circle-fill"></i> Appeal Submitted</h4>
                        <p className="mb-0">Your appeal has been received. An admin will review it shortly.</p>
                    </div>
                ) : (
                    <div className="mt-4 text-start w-100">
                        <label className="form-label fw-bold">Explanation</label>
                        <textarea 
                            className="form-control mb-3" 
                            rows="5" 
                            placeholder="Please explain why your suspension should be lifted"
                            value={appealText}
                            onChange={(e) => setAppealText(e.target.value)}
                            style={{ resize: "none", borderRadius: "8px", border: "1px solid #ced4da" }}
                        ></textarea>

                        <label className="form-label fw-bold">Evidence (Optional)</label>
                        <input 
                            type="file" 
                            multiple 
                            accept="image/*"
                            className="form-control mb-4"
                            onChange={handleFileChange}
                            style={{ borderRadius: "8px" }}
                        />
                        {files.length > 0 && (
                            <div className="mb-3 text-muted small">
                                <strong>Selected files:</strong>
                                <ul className="mb-0 ps-3">
                                    {Array.from(files).map((f, i) => <li key={i}>{f.name}</li>)}
                                </ul>
                            </div>
                        )}

                        <button 
                            className="btn w-100 py-2 fw-bold text-white" 
                            onClick={handleSubmit} 
                            disabled={loading}
                            style={{ 
                                backgroundColor: "#5865f2", 
                                borderColor: "#5865f2", 
                                borderRadius: "8px",
                                transition: "background-color 0.2s"
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = "#4752c4"}
                            onMouseOut={(e) => e.target.style.backgroundColor = "#5865f2"}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Submitting...
                                </>
                            ) : "Submit Appeal"}
                        </button>
                    </div>
                )}
                
                {!submitted && (
                    <a href="/api/auth/logout" className="btn btn-link mt-3 text-secondary text-decoration-none">
                        Sign out and return to Home
                    </a>
                )}
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered contentClassName="border-0 shadow-lg" style={{ borderRadius: "12px" }}>
                <Modal.Header closeButton className="border-bottom-0 pb-0">
                    <Modal.Title style={{ color: "#2d3748", fontWeight: "600" }}>{modalContent.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4 text-center">
                    <p className="fs-5 text-muted mb-0">{modalContent.body}</p>
                </Modal.Body>
                <Modal.Footer className="border-top-0 pt-0 pb-4 justify-content-center">
                    <Button 
                        onClick={() => setShowModal(false)}
                        style={{ 
                            backgroundColor: "#5865f2", 
                            borderColor: "#5865f2", 
                            padding: "8px 24px",
                            fontWeight: "500" 
                        }}
                    >
                        Okay
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}