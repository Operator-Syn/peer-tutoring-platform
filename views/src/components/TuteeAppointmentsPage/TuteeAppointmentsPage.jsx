import { useEffect, useState, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import waitingImage from "../../assets/cropped-waiting.png";
import approvedImage from "../../assets/approving-owl.png";
import sadOwl from "../../assets/sad-owl.png";
import CardComponent from "../CardComponent/CardComponent";
import { ConfirmButton, CloseButton, CancelAppointmentButton } from "../../data/AppointmentsPageModalButtons";
import "./TuteeAppointmentsPage.css";
import { useRoleRedirect } from "../../hooks/useRoleRedirect";
import AppointmentFilterModal from "./AppointmentFilterModal"; // Import the new modal

export default function TuteeAppointmentsPage() {
    useRoleRedirect('TUTEE');
    
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // --- 1. Filter State ---
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        PENDING: true,
        BOOKED: true,
        COMPLETED: true, // Usually users want to see history, but you can set false if preferred
        CANCELLED: false // Hidden by default as requested
    });

    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/appointments");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setAppointments(data);
        } catch (err) {
            console.error("Error fetching appointments:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const getStatusImage = (footerText) => {
        if (!footerText) return undefined;
        const lower = footerText.toLowerCase();
        if (lower.includes("pending") || lower.includes("left")) return waitingImage;
        if (lower.includes("started")) return approvedImage;
        if (lower.includes("cancelled") || lower.includes("declined")) return sadOwl;
        return undefined;
    };

    // --- 2. Filter Logic ---
    const handleFilterToggle = (status) => {
        setFilters(prev => ({
            ...prev,
            [status]: !prev[status]
        }));
    };

    // Filter the appointments based on the current state
    const filteredAppointments = appointments.filter(appt => {
        // The backend returns explicit "status" field (PENDING, BOOKED, etc.)
        // We check if that status is true in our filters object.
        return filters[appt.status] === true;
    });

    return (
        <div className="container large-padding">
            
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                <div>
                    <h2 className="fw-bold mb-0 text-dark">My Appointments</h2>
                    <small className="text-muted">View your upcoming and past sessions</small>
                </div>
                
                <div className="d-flex gap-2">
                    {/* Filter Button */}
                    <button 
                        className="btn btn-light border d-flex align-items-center gap-2"
                        onClick={() => setIsFilterOpen(true)}
                        style={{ height: "38px", fontWeight: 500 }}
                    >
                        <i className="bi bi-funnel"></i> Filter
                    </button>

                    {/* Refresh Button */}
                    <button 
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2" 
                        onClick={fetchAppointments}
                        disabled={loading}
                        style={{ height: "38px" }}
                    >
                        {loading ? 'Refreshing...' : <><i className="bi bi-arrow-clockwise"></i> Refresh</>}
                    </button>
                </div>
            </div>

            {/* --- Filter Modal --- */}
            <AppointmentFilterModal 
                isOpen={isFilterOpen} 
                onClose={() => setIsFilterOpen(false)}
                filters={filters}
                onToggle={handleFilterToggle}
            />

            {/* Loading State */}
            {loading ? (
                <div className="d-flex flex-column align-items-center justify-content-center py-5">
                    <div className="spinner-border text-primary mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted">Loading appointments...</p>
                </div>
            ) : filteredAppointments.length === 0 ? (
                // Empty State (Customized message depending on if raw data was empty or just filters)
                <div className="text-center py-5">
                    <img src={waitingImage} alt="No appointments" style={{ width: "120px", opacity: 0.7, marginBottom: "1rem" }} />
                    <h4>No Appointments Found</h4>
                    <p className="text-muted">
                        {appointments.length === 0 
                            ? "You have no scheduled tutoring sessions yet." 
                            : "No appointments match your selected filters."}
                    </p>
                </div>
            ) : (
                // Grid Section - Rendering filteredAppointments
                <div className="appointments-grid">
                    {filteredAppointments.map((appointment, index) => (
                        <CardComponent
                            key={index}
                            title={{ label: "Subject Code:", value: appointment.subject_code }}
                            modalTitle="Appointment Details"
                            leftAlignText={`Tutor: ${appointment.tutor_name}`}
                            rightAlignTop={appointment.appointment_date}
                            rightAlignBottom={`${appointment.start_time} — ${appointment.end_time}`}
                            footer={appointment.footer}
                            image={getStatusImage(appointment.footer)}
                            modalContent={appointment.modal_content}
                            modalButtonsRight={[...ConfirmButton, ...CloseButton]}
                            modalButtonsLeft={CancelAppointmentButton}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}