import "bootstrap/dist/css/bootstrap.min.css";
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
                image="https://cdn.discordapp.com/attachments/1392833768959770624/1404072835902869605/529905001_1182140307281774_2732309772554834092_n.png?ex=68fd657a&is=68fc13fa&hm=344f9c2d1360740dcc5f34614ab6482f895d85d97203ddfeeb1a3c8e01091bd5&"
                modalContent={[
                    { text: "Tutor: Jazrel Xandrei Quinlob", role: "Tutor", url: "https://example.com/tutor-profile" },
                    { text: "Tutee: John-Ronan Beira", role: "Tutee" }
                ]}
                tutorMessage="Please review chapters 1—3 before our next session."
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
                image="https://cdn.discordapp.com/attachments/1392833768959770624/1392872101127520348/a_pixie_dyed_here.gif?ex=68fd847b&is=68fc32fb&hm=1bba2f4cad6c30002adc71ea48ee48ac5f938777c0418b0e72e7a50f184ede5d&"
                modalContent={[
                    { text: "Tutor: Jazrel Xandrei Quinlob", role: "Tutor", url: "https://example.com/tutor-profile" },
                    { text: "Tutee: John-Ronan Beira", role: "Tutee" }
                ]}
                tutorMessage="Please review chapters 1—3 before our next session."
                modalButtonsRight={[...ConfirmButton, ...CloseButton]}
                modalButtonsLeft={CancelAppointmentButton}
            />

        </div>
    );
}
