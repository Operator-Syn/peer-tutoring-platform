import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from "react";
import placeholderImage from "../../../../assets/images/placeholders/placeholderImage.jpeg";
import scheduleOwl from "../../../../assets/schedule-owl.png";
import CardComponent from "../../../CardComponent/CardComponent";
import "./Schedule.css";

export default function Schedule({ data, update }) {
    const [availabilities, setAvailabilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 992);

    useEffect(() => {
        const handleResize = () => setIsSmallScreen(window.innerWidth < 992);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (!data.courseCode || !data.preferredDate) return;

        setLoading(true);
        fetch(`/api/availability/by-subject?course_code=${data.courseCode}&appointment_date=${data.preferredDate}`)
            .then(res => res.json())
            .then(fetchedData => {
                setAvailabilities(fetchedData);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching availabilities:", err);
                setLoading(false);
            });
    }, [data.courseCode, data.preferredDate]);

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

    if (!data.courseCode) return <div className="container">Select a subject first.</div>;
    if (!data.preferredDate) return <div className="container">Select a date first.</div>;
    if (loading) return <div className="container">Loading schedules...</div>;
    if (availabilities.length === 0) return <div className="container">No available schedules.</div>;

    // layout adjustments
    const cardsPerRow = 3;
    const remainder = availabilities.length % cardsPerRow;
    const placeholders = remainder > 0 ? Array(cardsPerRow - remainder).fill(null) : [];

    return (
        <div className="container create-appointment-form-bg p-5 mb-4">
            <h3 className="mb-3 h3-absolute">Schedule</h3>

            {/* Grid container for the cards */}
            <div className="appointments-grid">
                {availabilities.map(a => {
                    const isSelected = selected === a.vacant_id;
                    const isDisabled = selected && !isSelected;

                    const selectButton = {
                        text: isSelected ? "Unselect Tutor" : "Select Tutor",
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
                            image={scheduleOwl}
                            modalContent={[
                                { role: "Tutor ID", text: ` ${a.tutor_id}` },
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
        </div>
    );
}
