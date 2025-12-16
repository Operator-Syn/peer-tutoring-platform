import { useEffect, useState, useCallback, useMemo } from "react";
// Import Pagination from react-bootstrap
import { Pagination as BootstrapPagination } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import CardComponent from "../CardComponent/CardComponent";
import { ConfirmButton, CloseButton, CancelAppointmentButton } from "../../data/AppointmentsPageModalButtons";
import "./TuteeAppointmentsPage.css";
import { useRoleRedirect } from "../../hooks/useRoleRedirect";
import AppointmentFilterModal from "./AppointmentFilterModal";

const waitingImage = "https://wedygbolktkdbpxxrlcr.supabase.co/storage/v1/object/public/assets/cropped-waiting.png";
const approvedImage = "https://wedygbolktkdbpxxrlcr.supabase.co/storage/v1/object/public/assets/approving-owl.png";
const sadOwl = "https://wedygbolktkdbpxxrlcr.supabase.co/storage/v1/object/public/assets/sad-owl.png";
const completedOwl = "https://wedygbolktkdbpxxrlcr.supabase.co/storage/v1/object/public/assets/appointment-submitted.png";

// --- Pagination Component ---
const TuteePagination = ({ totalPages, currentPage, onPageChange }) => {
    if (totalPages <= 1) return null;

    const paginationBtnStyle = { minWidth: "3rem", textAlign: "center" };

    return (
        <div className="d-flex justify-content-center mt-4 pb-2">
            <BootstrapPagination size="md">
                <BootstrapPagination.Prev
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={paginationBtnStyle}
                />

                {[...Array(totalPages)].map((_, index) => (
                    <BootstrapPagination.Item
                        key={index + 1}
                        active={index + 1 === currentPage}
                        onClick={() => onPageChange(index + 1)}
                        style={paginationBtnStyle}
                    >
                        {index + 1}
                    </BootstrapPagination.Item>
                ))}

                <BootstrapPagination.Next
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={paginationBtnStyle}
                />
            </BootstrapPagination>
        </div>
    );
};

export default function TuteeAppointmentsPage() {
    useRoleRedirect('TUTEE');

    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- Store fetched ratings ---
    const [tutorRatings, setTutorRatings] = useState({});

    // --- Filter State ---
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        PENDING: true,
        BOOKED: true,
        COMPLETED: true,
        CANCELLED: false
    });

    // --- Pagination State ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(6);

    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        setCurrentPage(1);
        setTutorRatings({}); // Reset ratings on refresh

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
        if (lower.includes("completed") || lower.includes("submitted")) return completedOwl;
        return undefined;
    };

    const handleFilterToggle = (status) => {
        setFilters(prev => ({
            ...prev,
            [status]: !prev[status]
        }));
        setCurrentPage(1);
    };

    const filteredAppointments = useMemo(() => {
        return appointments.filter(appt => {
            return filters[appt.status] === true;
        });
    }, [appointments, filters]);

    // --- Pagination Calculation ---
    const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentAppointments = filteredAppointments.slice(indexOfFirstItem, indexOfLastItem);

    // --- Fetch Ratings for Visible Tutors ---
    useEffect(() => {
        if (currentAppointments.length === 0) return;

        // Extract Tutor IDs directly (Now works because backend sends tutor_id)
        const uniqueTutorIds = [...new Set(currentAppointments.map(a => a.tutor_id))];
        
        uniqueTutorIds.forEach(tutorId => {
            // Skip if invalid or already fetched
            if (!tutorId || tutorRatings[tutorId] !== undefined) return; 

            fetch(`/api/rate-session/tutor/${tutorId}`)
                .then(res => res.json())
                .then(ratings => {
                    if (Array.isArray(ratings) && ratings.length > 0) {
                        const sum = ratings.reduce((acc, curr) => acc + (curr.rating || 0), 0);
                        const avg = sum / ratings.length;
                        setTutorRatings(prev => ({ ...prev, [tutorId]: avg }));
                    } else {
                        setTutorRatings(prev => ({ ...prev, [tutorId]: 0 }));
                    }
                })
                .catch(err => console.error("Error fetching rating for", tutorId, err));
        });
    }, [currentAppointments]); 

    // --- Counter Logic ---
    const displayStartIndex = filteredAppointments.length > 0 ? indexOfFirstItem + 1 : 0;
    const displayEndIndex = Math.min(indexOfLastItem, filteredAppointments.length);

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
            document.querySelector('.appointments-grid')?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="container large-padding">
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                <div>
                    <h2 className="fw-bold mb-0 text-dark">My Appointments</h2>
                    <small className="text-muted">
                        {filteredAppointments.length > 0
                            ? `Viewing ${displayStartIndex} – ${displayEndIndex} of ${filteredAppointments.length} sessions`
                            : 'No sessions to display'}
                    </small>
                </div>

                <div className="d-flex gap-2">
                    <button
                        className="btn btn-light border d-flex align-items-center gap-2"
                        onClick={() => setIsFilterOpen(true)}
                        style={{ height: "38px", fontWeight: 500 }}
                    >
                        <i className="bi bi-funnel"></i> Filter
                    </button>

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

            <AppointmentFilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={filters}
                onToggle={handleFilterToggle}
            />

            {/* Loading & Content */}
            {loading ? (
                <div className="d-flex flex-column align-items-center justify-content-center py-5">
                    <div className="spinner-border text-primary mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted">Loading appointments...</p>
                </div>
            ) : filteredAppointments.length === 0 ? (
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
                <>
                    <div className="appointments-grid">
                        {currentAppointments.map((appointment, index) => {
                            // Get Rating safely
                            const rating = tutorRatings[appointment.tutor_id] !== undefined 
                                ? tutorRatings[appointment.tutor_id] 
                                : null;

                            return (
                                <CardComponent
                                    key={index}
                                    title={{ label: "Subject Code:", value: appointment.subject_code }}
                                    
                                    // --- PASS RATING ---
                                    rating={rating}
                                    
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
                            );
                        })}
                    </div>

                    <TuteePagination
                        totalPages={totalPages}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                    />
                </>
            )}
        </div>
    );
}