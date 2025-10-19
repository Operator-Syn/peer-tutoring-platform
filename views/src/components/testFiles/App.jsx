import "bootstrap/dist/css/bootstrap.min.css";
import SmallCardComponent from "../smallCardComponent/SmallCardComponent";
import {ConfirmButton, CloseButton } from "../../data/AppointmentsPageModalButtons"

export default function App() {
    return (
        <div className="d-flex gap-4 p-4 flex-wrap align-items-start">

            <SmallCardComponent
                title="MAT 101"
                modalTitle="Appointment Details"
                leftAlignText="Tutor: Jazrel Xandrei Quinlob"
                rightAlignTop="October 19, 2025"
                rightAlignBottom="1:00 PM — 3:00 PM"
                footer="NN hours left before the appointment"
                image="https://cdn.discordapp.com/attachments/1392833768959770624/1404304146785370142/FB_IMG_1754882557879.jpg?ex=68f50267&is=68f3b0e7&hm=7e5e81eed7b2ad817fd8b3a9e312c8131b0a2639494425b39b4f9ae934724507&"
                modalContent={[
                    { text: "Tutor: Jazrel Xandrei Quinlob", role: "Tutor", url: "https://example.com/tutor-profile" },
                    { text: "Tutee: John-Ronan Beira", role: "Tutee" }
                ]}
                tutorMessage="Please review chapters 1–3 before our next session."
                modalButtons={[...ConfirmButton, ...CloseButton]}
            />

            <SmallCardComponent
                title="MAT 101"
                modalTitle="Appointment Details"
                leftAlignText="Tutor: Jazrel Xandrei Quinlob"
                rightAlignTop="October 19, 2025"
                rightAlignBottom="1:00 PM — 3:00 PM"
                footer="NN hours left before the appointment"
                image="https://cdn.discordapp.com/attachments/1392833768959770624/1392872101127520348/a_pixie_dyed_here.gif?ex=68f59b7b&is=68f449fb&hm=ece4208b1b0af1c0dd6aa3a4a71173ee9ce2f858de8623d063e0662454767152&"
                modalContent={[
                    { text: "Tutor: Jazrel Xandrei Quinlob", role: "Tutor", url: "https://example.com/tutor-profile" },
                    { text: "Tutee: John-Ronan Beira", role: "Tutee" }
                ]}
                tutorMessage="Please review chapters 1–3 before our next session."
                modalButtons={[...ConfirmButton, ...CloseButton]}
            />

        </div>
    );
}
