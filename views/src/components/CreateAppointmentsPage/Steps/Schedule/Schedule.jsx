import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState, useRef } from "react";
import { Pagination } from "react-bootstrap";
import CardComponent from "../../../CardComponent/CardComponent";
import "./Schedule.css";

// --- CDN CONSTANTS ---
const NO_TUTOR_IMAGE_URL = "https://wedygbolktkdbpxxrlcr.supabase.co/storage/v1/object/public/assets/no-tutor-around.png";
const SCHEDULE_OWL_URL = "https://wedygbolktkdbpxxrlcr.supabase.co/storage/v1/object/public/assets/secondary-tutor-available.png";

export default function Schedule({ data, update }) {
    const [availabilities, setAvailabilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(data.vacant_id || null);

    // Responsive State
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [itemsPerPage, setItemsPerPage] = useState(window.innerWidth < 768 ? 3 : 6);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [emptyStateImgLoaded, setEmptyStateImgLoaded] = useState(false);

    const headerRef = useRef(null);
    const isFirstRender = useRef(true);

    // Handle Screen Resize
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            setItemsPerPage(mobile ? 3 : 6);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Fetch Data
    useEffect(() => {
        if (!data.courseCode || !data.preferredDate) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setEmptyStateImgLoaded(false);
        setCurrentPage(1); // Reset page on new fetch

        // 🚨 FIXED: Added credentials: 'include' so backend gets the session cookie
        fetch(`/api/availability/by-subject?course_code=${data.courseCode}&appointment_date=${data.preferredDate}`, {
            method: 'GET',
            credentials: 'include'
        })
            .then(res => res.json())
            .then(fetchedData => {
                setAvailabilities(fetchedData);
                setLoading(false);
                update({ hasAvailableTutors: fetchedData.length > 0 });
            })
            .catch(err => {
                console.error("Error fetching availabilities:", err);
                setLoading(false);
                update({ hasAvailableTutors: false });
            });
    }, [data.courseCode, data.preferredDate]);

    // Improved Scroll Logic
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (headerRef.current) {
            setTimeout(() => {
                headerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [currentPage]);

    const handleSelect = (vacant_id) => {
        if (selected === vacant_id) {
            setSelected(null);
            update({
                vacant_id: null,
                tutor_name: null,
                tutor_id: null,
                day_of_week: null,
                formatted_time: null,
                start_time: null,
                end_time: null,
            });
            return;
        }

        const slot = availabilities.find(a => a.vacant_id === vacant_id);
        if (!slot) return;
        setSelected(vacant_id);
        update({
            vacant_id: slot.vacant_id,
            tutor_name: slot.tutor_name,
            tutor_id: slot.tutor_id,
            day_of_week: slot.day_of_week,
            formatted_time: slot.formatted_time,
            start_time: slot.start_time,
            end_time: slot.end_time
        });
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="text-center py-4">
                    <div className="spinner-border text-primary mb-3" role="status"></div>
                    <h5 className="text-primary">Flying in the schedules...</h5>
                </div>
            );
        }

        if (availabilities.length === 0) {
            return (
                <div className="d-flex flex-column align-items-center justify-content-center text-center py-3">
                    <div className="mb-3 position-relative rounded-4 shadow-sm overflow-hidden" style={{ width: "250px", height: "250px" }}>
                        {!emptyStateImgLoaded && (
                            <div
                                className="w-100 h-100 bg-secondary-subtle placeholder-glow d-flex align-items-center justify-content-center"
                                style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }}
                            >
                                <span className="placeholder w-100 h-100"></span>
                            </div>
                        )}
                        <img
                            src={NO_TUTOR_IMAGE_URL}
                            alt="No tutors around"
                            className="w-100 h-100"
                            style={{
                                objectFit: "cover",
                                opacity: emptyStateImgLoaded ? 1 : 0,
                                transition: "opacity 0.5s ease-in-out"
                            }}
                            onLoad={() => setEmptyStateImgLoaded(true)}
                        />
                    </div>
                    <h4 className="fw-bold text-secondary">It's quiet... too quiet.</h4>
                    <p className="text-muted" style={{ maxWidth: "400px" }}>
                        Looks like no owls are roosting on this branch right now.
                        Try picking a different date to get a hoot from us!
                    </p>
                </div>
            );
        }

        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = availabilities.slice(indexOfFirstItem, indexOfLastItem);
        const totalPages = Math.ceil(availabilities.length / itemsPerPage);

        const cardsPerRow = 3;
        const remainder = currentItems.length % cardsPerRow;
        const placeholders = (!isMobile && remainder > 0) ? Array(cardsPerRow - remainder).fill(null) : [];

        const paginationBtnStyle = { minWidth: "3rem", textAlign: "center" };

        return (
            <>
                <div className="appointments-grid fillout-content-gap">
                    {currentItems.map(a => {
                        const isSelected = selected === a.vacant_id;
                        const isDisabled = selected && !isSelected;

                        const selectButton = {
                            text: isSelected ? "Unselect" : "Select",
                            variant: isSelected ? "secondary" : "primary",
                            onClick: (closeModal) => {
                                handleSelect(a.vacant_id);
                                closeModal();
                            },
                            className: isDisabled ? "disabled" : "",
                        };

                        return (
                            <CardComponent
                                key={a.vacant_id}
                                title={{ label: "Tutor:", value: a.tutor_name }}
                                modalTitle="Availability Details"
                                leftAlignText={`Day: ${a.day_of_week}`}
                                rightAlignTop={`Course: ${a.course_code}`}
                                rightAlignBottom={`Time: ${a.formatted_time}`}
                                footer={isSelected ? "Selected" : ""}
                                image={SCHEDULE_OWL_URL}
                                modalContent={[
                                    {
                                        role: "Tutor",
                                        text: a.tutor_name,
                                        url: `/tutor/${a.tutor_id}`
                                    },
                                    { role: "Tutor ID", text: a.tutor_id },
                                    { text: `Vacant Slot ID: ${a.vacant_id}` },
                                ]}
                                modalButtonsRight={[selectButton]}
                                modalButtonsLeft={[]}
                            />
                        );
                    })}

                    {placeholders.map((_, idx) => (
                        <div key={`placeholder-${idx}`} className="placeholder-card" />
                    ))}
                </div>

                {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-4 pb-2">
                        <Pagination size={isMobile ? "sm" : "md"}>
                            <Pagination.Prev
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                style={paginationBtnStyle}
                            />

                            {[...Array(totalPages)].map((_, index) => (
                                <Pagination.Item
                                    key={index + 1}
                                    active={index + 1 === currentPage}
                                    onClick={() => handlePageChange(index + 1)}
                                    style={paginationBtnStyle}
                                >
                                    {index + 1}
                                </Pagination.Item>
                            ))}

                            <Pagination.Next
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                style={paginationBtnStyle}
                            />
                        </Pagination>
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="container create-appointment-form-bg p-3 p-md-5 mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h3
                    ref={headerRef}
                    className="mb-0 h3-absolute"
                    style={{ scrollMarginTop: "20px" }}
                >
                    Schedule
                </h3>
            </div>

            {renderContent()}
        </div>
    );
}