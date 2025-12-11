import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import waitingImage from "../../assets/cropped-waiting.png";
import approvedImage from "../../assets/approving-owl.png"
import sadOwl from "../../assets/sad-owl.png"
import CardComponent from "../CardComponent/CardComponent";
import { ConfirmButton, CloseButton, CancelAppointmentButton } from "../../data/AppointmentsPageModalButtons";
import "./TuteeAppointmentsPage.css";
import { useRoleRedirect } from "../../hooks/useRoleRedirect";

export default function TuteeAppointmentsPage() {
    useRoleRedirect('TUTEE');
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 992);

    useEffect(() => {
        const handleResize = () => setIsSmallScreen(window.innerWidth < 992);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        fetch("/api/appointments")
            .then((res) => res.json())
            .then((data) => {
                setAppointments(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching appointments:", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="container">Loading appointments...</div>;
    if (appointments.length === 0) return <div className="container">No appointments found.</div>;

    return (
        <div className="container appointments-grid large-padding">
            {appointments.map((appointment, index) => {
                // Determine which image to use
                let imageToShow;
                const footerLower = appointment.footer.toLowerCase();
                if (footerLower.includes("pending") || footerLower.includes("left")) {
                    imageToShow = waitingImage;
                } else if (footerLower.includes("started")) {
                    imageToShow = approvedImage;
                } else if (footerLower.includes("cancelled") || footerLower.includes("declined")) {
                    imageToShow = sadOwl;
                } else {
                    imageToShow = null;
                }

                return (
                    <CardComponent
                        key={index}
                        title={{ label: "Subject Code:", value: appointment.subject_code }}
                        modalTitle="Appointment Details"
                        leftAlignText={`Tutor: ${appointment.tutor_name}`}
                        rightAlignTop={appointment.appointment_date}
                        rightAlignBottom={`${appointment.start_time} — ${appointment.end_time}`}
                        footer={appointment.footer}
                        image={imageToShow}
                        modalContent={appointment.modal_content}
                        modalButtonsRight={[...ConfirmButton, ...CloseButton]}
                        modalButtonsLeft={CancelAppointmentButton}
                    />
                );
            })}
        </div>
    );
}
