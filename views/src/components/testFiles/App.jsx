import "bootstrap/dist/css/bootstrap.min.css";
import SmallCardComponent from "../smallCardComponent/SmallCardComponent";
import {ConfirmButton, CloseButton } from "../../data/AppointmentsPageModalButtons"

export default function App() {
    return (
        <div className="d-flex gap-4 p-4 flex-wrap align-items-start">
            {/* Regular Card */}
            <SmallCardComponent
                title="MAT 101"
                modalTitle="Appointment Details"
                leftAlignText="Tutor: Jazrel Xandrei Quinlob"
                rightAlignTop="October 19, 2025"
                rightAlignBottom="1:00 PM — 3:00 PM"
                footer="NN hours left before the appointment"
                image="https://cdn.discordapp.com/attachments/1392833768959770624/1404304146785370142/FB_IMG_1754882557879.jpg?ex=68f50267&is=68f3b0e7&hm=7e5e81eed7b2ad817fd8b3a9e312c8131b0a2639494425b39b4f9ae934724507&"
                modalContent="This is a test modal content."
                modalButtons={[...ConfirmButton, ...CloseButton]}
            />

            {/* Card with Modal */}
            <SmallCardComponent
                title="Clickable Card"
                leftAlignText="Click me to open a modal!"
                modalContent={<p>This modal was triggered by clicking the card.</p>}
            />
        </div>
    );
}
