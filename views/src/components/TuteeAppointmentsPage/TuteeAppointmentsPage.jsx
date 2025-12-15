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

// --- REPLACED: Custom Pagination Component with React-Bootstrap Logic ---
const TuteePagination = ({ totalPages, currentPage, onPageChange }) => {
    if (totalPages <= 1) return null;

    // Apply styling from the Schedule component for consistent button size
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
// --------------------------------------------------------

export default function TuteeAppointmentsPage() {
    useRoleRedirect('TUTEE');

    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- 1. Filter State ---
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        PENDING: true,
        BOOKED: true,
        COMPLETED: true,
        CANCELLED: false
    });

    // --- 2. Pagination State ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(6); // Set a fixed number of cards per page

    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        // Reset to first page whenever we refetch
        setCurrentPage(1);
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

    // --- 3. Filter Logic ---
    const handleFilterToggle = (status) => {
        setFilters(prev => ({
            ...prev,
            [status]: !prev[status]
        }));
        // Reset to page 1 when filters change
        setCurrentPage(1);
    };

    // Filter the appointments based on the current state (Memoized)
    const filteredAppointments = useMemo(() => {
        return appointments.filter(appt => {
            return filters[appt.status] === true;
        });
    }, [appointments, filters]);

    // --- 4. Pagination Calculation and Slicing (Memoized) ---
    const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);

    // Calculate the indices for slicing the array
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    // Get the appointments for the current page
    const currentAppointments = filteredAppointments.slice(indexOfFirstItem, indexOfLastItem);

    // --- COUNTER LOGIC ---
    // Start index for display (1-based)
    const displayStartIndex = filteredAppointments.length > 0 ? indexOfFirstItem + 1 : 0;

    // End index for display. This must not exceed the total filtered count.
    const displayEndIndex = Math.min(indexOfLastItem, filteredAppointments.length);
    // ---------------------

    // Handler to change the page
    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
            // Scroll to top of the grid when page changes for better UX
            document.querySelector('.appointments-grid')?.scrollIntoView({ behavior: 'smooth' });
        }
    };
    // -------------------------------------------------------------

    return (
        <div className="container large-padding">

            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                <div>
                    <h2 className="fw-bold mb-0 text-dark">My Appointments</h2>
                    {/* --- ADJUSTED COUNTER LOGIC HERE --- */}
                    <small className="text-muted">
                        {filteredAppointments.length > 0
                            ? `Viewing ${displayStartIndex} – ${displayEndIndex} of ${filteredAppointments.length} sessions`
                            : 'No sessions to display'}
                    </small>
                    {/* ---------------------------------- */}
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
                // Empty State
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
                // Grid Section - Rendering current page's appointments
                <>
                    <div className="appointments-grid">
                        {currentAppointments.map((appointment, index) => (
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

                    {/* --- Pagination Component --- */}
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