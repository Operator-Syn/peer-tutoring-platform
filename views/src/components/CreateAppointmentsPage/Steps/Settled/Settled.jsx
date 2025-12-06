import React, { useEffect, useState } from "react";

export default function Settled({ data }) {
    const [statusMessage, setStatusMessage] = useState("Recording your appointment...");

    useEffect(() => {
        if (!data) return;

        const payload = {
            vacant_id: data.vacant_id,
            tutee_id: data.idNumber,
            course_code: data.courseCode,
            appointment_date: data.preferredDate,
            start_time: data.start_time,
            end_time: data.end_time,
            status: "PENDING",
            first_name: data.firstName,
            middle_name: data.middleName,
            last_name: data.lastName,
            program_code: data.programCode,
            day_of_week: data.day_of_week
        };

        fetch("/api/create-pending-appointment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include", // if using session/cookie auth
            body: JSON.stringify(payload),
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to create appointment");
                return res.json();
            })
            .then((resData) => {
                setStatusMessage("Your appointment has been recorded successfully!");
            })
            .catch((err) => {
                console.error(err);
                setStatusMessage("Error recording your appointment. Please try again.");
            });
    }, [data]);

    return (
        <div className="p-5 m-5 create-appointment-form-bg">
            <h3>Step 4: Now waiting for confirmation from the tutor</h3>
            <p>{statusMessage}</p>
        </div>
    );
}
