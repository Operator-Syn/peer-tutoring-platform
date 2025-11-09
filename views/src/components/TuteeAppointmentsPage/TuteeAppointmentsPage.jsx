import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from "react";
import placeholderImage from "../../assets/images/placeholders/placeholderImage.jpeg";
import CardComponent from "../CardComponent/CardComponent";
import { ConfirmButton, CloseButton, CancelAppointmentButton } from "../../data/AppointmentsPageModalButtons";
import "./TuteeAppointmentsPage.css";

export default function TuteeAppointmentsPage() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch all appointments from the Flask API
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

    if (loading) {
        return <div className="container">Loading appointments...</div>;
    }

    if (appointments.length === 0) {
        return <div className="container">No appointments found.</div>;
    }

    return (
        <div className="d-flex container gap-4 flex-wrap align-items-start large-padding">
            {appointments.map((appointment, index) => (
                <CardComponent
                    key={index}
                    title={{ label: "Subject Code:", value: appointment.subject_code }}
                    modalTitle="Appointment Details"
                    leftAlignText={`Tutor: ${appointment.tutor_name}`}
                    rightAlignTop={appointment.appointment_date}
                    rightAlignBottom={`${appointment.start_time} — ${appointment.end_time}`}
                    footer={appointment.footer}
                    image={placeholderImage} // still static
                    modalContent={appointment.modal_content}
                    modalButtonsRight={[...ConfirmButton, ...CloseButton]} // static
                    modalButtonsLeft={CancelAppointmentButton} // static
                />
            ))}
        </div>
    );
}
