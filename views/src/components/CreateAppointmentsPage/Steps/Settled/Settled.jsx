import React, { useEffect, useState } from "react";
import { Modal, Button, ProgressBar } from "react-bootstrap"; 
import "bootstrap/dist/css/bootstrap.min.css";
import "./Settled.css"; 

const SUBMITTED_IMAGE_URL = "https://wedygbolktkdbpxxrlcr.supabase.co/storage/v1/object/public/assets/appointment-submitted.png";

export default function Settled({ data }) {
    const [statusType, setStatusType] = useState("loading"); 
    const [imageLoaded, setImageLoaded] = useState(false); 
    const [errorModal, setErrorModal] = useState({ show: false, message: "" });
    const [progress, setProgress] = useState(10);

    useEffect(() => {
        if (!data) return;

        const progressInterval = setInterval(() => {
            setProgress((prev) => (prev < 90 ? prev + 10 : prev));
        }, 300);

        const payload = {
            vacant_id: data.vacant_id,
            tutee_id: data.idNumber,
            course_code: data.courseCode,
            appointment_date: data.preferredDate,
            start_time: data.start_time,
            end_time: data.end_time,
            status: "PENDING",
            first_name: data.firstName,
            middle_name: data.middleName || " ",
            last_name: data.lastName,
            program_code: data.programCode,
            day_of_week: data.day_of_week
        };

        fetch("/api/create-pending-appointment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
        })
            .then(async (res) => {
                // 1. Check for server errors and extract the JSON message
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.error || "Failed to create appointment");
                }
                return res.json();
            })
            .then(() => {
                setProgress(100);
                setTimeout(() => setStatusType("success"), 500);
            })
            .catch((err) => {
                console.error("❌ Submission Error:", err);
                setStatusType("error");
                
                // 2. Set the error message for BOTH the modal and the UI card
                setErrorModal({ 
                    show: true, 
                    message: err.message || "We encountered some turbulence. Please try again." 
                });
            })
            .finally(() => clearInterval(progressInterval));

    }, [data]);

    const handleCloseError = () => setErrorModal({ ...errorModal, show: false });

return (
        <div className="create-appointment-form-bg">
            <h3 className="fillout-side-label h3-absolute d-none d-lg-block">Settled</h3>

            {/* ✅ FIXED: Removed 'min-vh-100' and 'justify-content-center' */}
            {/* Added 'py-5' and 'mt-4' to position it nicely at the top instead */}
            <div className="container d-flex flex-column fillout-content-gap align-items-center py-5 mt-3">
                
                <h1 className="text-center text-decoration-underline fillout-title mb-3 mb-md-5 text-dark">
                    Mission Status
                </h1>

                <div 
                    className="card shadow-lg border-0 rounded-5 p-3 p-md-4 text-center w-100 fade-in-up"
                    style={{ maxWidth: "550px", backgroundColor: "#ffffff" }}
                >
                    <div className="card-body d-flex flex-column align-items-center justify-content-center pt-2 pt-md-4">
                        
                        {/* 1. LOADING STATE */}
                        {statusType === 'loading' && (
                            <div className="w-100 py-2 py-md-4">
                                <h2 className="fw-bold text-primary mb-3">In Flight...</h2>
                                <p className="text-muted mb-4">Dispatching your request via Owl Post...</p>
                                
                                <div className="px-2 px-md-5">
                                    <ProgressBar 
                                        animated 
                                        now={progress} 
                                        variant="primary" 
                                        style={{ height: "10px", borderRadius: "10px" }} 
                                    />
                                </div>
                            </div>
                        )}

                        {/* 2. SUCCESS STATE */}
                        {statusType === 'success' && (
                            <div className="fade-in-up w-100">
                                <h2 className="fw-bold text-success mb-2 fs-2 fs-md-1">Touchdown!</h2>
                                <p className="text-muted mb-3">Request delivered successfully.</p>
                                
                                <div className="mb-3 position-relative d-flex justify-content-center" style={{ minHeight: "160px" }}>
                                    {!imageLoaded && (
                                        <div className="d-flex align-items-center justify-content-center w-100 h-100">
                                            <div className="spinner-border text-success" role="status"></div>
                                        </div>
                                    )}
                                    <img 
                                        src={SUBMITTED_IMAGE_URL} 
                                        alt="Appointment Submitted" 
                                        onLoad={() => setImageLoaded(true)}
                                        className={`img-fluid sticker-img ${!imageLoaded ? 'd-none' : ''}`}
                                        style={{ 
                                            maxWidth: "100%", 
                                            maxHeight: "220px",
                                            borderRadius: "24px", 
                                            boxShadow: "0 8px 20px rgba(0,0,0,0.1)", 
                                            imageRendering: "-webkit-optimize-contrast" 
                                        }} 
                                    />
                                </div>
                                
                                <div className="ticket-box p-3 mt-1 mx-0 mx-md-2">
                                    <p className="mb-0 text-secondary small fw-medium">
                                        <i className="bi bi-info-circle me-2"></i>
                                        Your Wise Owl is currently reviewing the flight plan. 
                                        Keep an eye on your dashboard!
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* 3. ERROR STATE */}
                        {statusType === 'error' && (
                            <div className="py-3 fade-in-up">
                                <div className="display-1 mb-2">⚠️</div>
                                <h2 className="fw-bold text-danger mb-2">Turbulence Detected</h2>
                                
                                <p className="text-dark px-3 fs-6">
                                    {errorModal.message || "We couldn't deliver your message."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ERROR MODAL */}
            <Modal show={errorModal.show} onHide={handleCloseError} centered backdrop="static" keyboard={false}>
                <Modal.Header closeButton className="bg-danger-subtle border-0">
                    <Modal.Title className="fw-bold text-danger">
                        Mission Aborted
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4 text-center">
                    <p className="fs-5 text-dark">{errorModal.message}</p>
                </Modal.Body>
                <Modal.Footer className="border-0 justify-content-center bg-light">
                    <Button variant="danger" className="px-4 rounded-pill" onClick={handleCloseError}>
                        Understood
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}