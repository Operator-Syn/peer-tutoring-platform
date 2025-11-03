import "bootstrap/dist/css/bootstrap.min.css";
import placeholderImage from "../../assets/images/placeholders/placeholderImage.jpeg";
import CardComponent from "../CardComponent/CardComponent";
import {ConfirmButton, CloseButton, CancelAppointmentButton } from "../../data/AppointmentsPageModalButtons"

export default function App() {
    return (
        <div className="d-flex gap-4 p-4 flex-wrap align-items-start">

            <CardComponent
                title={{ label: "Subject Code:", value: "MAT 101" }}
                modalTitle="Appointment Details"
                leftAlignText="Tutor: Jazrel Xandrei Quinlob"
                rightAlignTop="October 19, 2025"
                rightAlignBottom="1:00 PM — 3:00 PM"
                footer="NN hours left before the appointment"
                image={placeholderImage}
                modalContent={[
                    { text: "Tutor: Jazrel Xandrei Quinlob", role: "Tutor", url: "https://example.com/tutor-profile" },
                    { text: "Tutee: John-Ronan Beira", role: "Tutee" }
                ]}
                modalButtonsRight={[...ConfirmButton, ...CloseButton]}
                modalButtonsLeft={CancelAppointmentButton}
            />

            <CardComponent
                title="CCC 101"
                modalTitle="Appointment Details"
                leftAlignText="Tutor: Jazrel Xandrei Quinlob"
                rightAlignTop="October 19, 2025"
                rightAlignBottom="1:00 PM — 3:00 PM"
                footer="NN hours left before the appointment"
                image={placeholderImage}
                modalContent={[
                    { text: "Tutor: Jazrel Xandrei Quinlob", role: "Tutor", url: "https://example.com/tutor-profile" },
                    { text: "Tutee: John-Ronan Beira", role: "Tutee" }
                ]}
                modalButtonsRight={[...ConfirmButton, ...CloseButton]}
                modalButtonsLeft={CancelAppointmentButton}
            />

        </div>
    );
}
