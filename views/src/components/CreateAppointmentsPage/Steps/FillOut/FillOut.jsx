import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./FillOut.css";

export default function FillOut({ data, update }) {
    const [programs, setPrograms] = useState([]);
    const [courses, setCourses] = useState([]);

    // Fetch programs and courses, and set initial tutee data
    useEffect(() => {
        fetch("/api/fillout", { credentials: "include" })
            .then((res) => res.json())
            .then((data) => {
                setPrograms(data.programs || []);
                setCourses(data.courses || []);
                update({
                    firstName: data.tutee.first_name,
                    lastName: data.tutee.last_name,
                    middleName: data.tutee.middle_name,
                    idNumber: data.tutee.id_number,
                    yearLevel: data.tutee.year_level,
                    programCode: data.tutee.program_code,
                });
            })
            .catch((err) => console.error("Error fetching programs:", err));
    }, []);

    // Convert date to uppercase weekday string for backend filtering
    const getDayOfWeek = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        return days[date.getDay()];
    };

    // Update preferredDate and also compute day_of_week
    const handleDateChange = (e) => {
        const preferredDate = e.target.value;
        const dayOfWeek = getDayOfWeek(preferredDate);
        update({ preferredDate, day_of_week: dayOfWeek });
    };

    return (
        <div className="p-5 m-5 create-appointment-form-bg">
            <h3 className="mb-3 h3-absolute">Fill Out</h3>

            <div className="container d-flex flex-column gap-4">
                {/* Heading */}
                <h1 className="text-center text-decoration-underline">Appointment Form</h1>

                {/* Row with two columns */}
                <div className="row g-3">
                    <div className="col-md-6 d-flex flex-column gap-3">
                        <div className="custom-border-label-group">
                            <label className="form-label custom-border-label">First Name</label>
                            <input
                                type="text"
                                className="form-control custom-input"
                                value={data.firstName}
                                onChange={(e) => update({ firstName: e.target.value })}
                            />
                        </div>

                        <div className="custom-border-label-group">
                            <label className="form-label custom-border-label">ID Number</label>
                            <input
                                type="text"
                                className="form-control custom-input"
                                value={data.idNumber}
                                onChange={(e) => update({ idNumber: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="col-md-6 d-flex flex-column gap-3">
                        <div className="custom-border-label-group">
                            <label className="form-label custom-border-label">Last Name</label>
                            <input
                                type="text"
                                className="form-control custom-input"
                                value={data.lastName}
                                onChange={(e) => update({ lastName: e.target.value })}
                            />
                        </div>

                        <div className="custom-border-label-group">
                            <label className="form-label custom-border-label">Year Level</label>
                            <input
                                type="text"
                                className="form-control custom-input"
                                value={data.yearLevel}
                                readOnly
                            />
                        </div>
                    </div>
                </div>

                {/* Program select */}
                <div className="custom-border-label-group">
                    <label className="form-label custom-border-label">Program</label>
                    <select
                        className="form-select custom-select"
                        value={data.programCode || ""}
                        onChange={(e) => update({ programCode: e.target.value })}
                    >
                        <option value="" disabled>
                            Select a program
                        </option>
                        {programs.map((program) => (
                            <option key={program.program_code} value={program.program_code}>
                                {program.program_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Course Subject */}
                <div className="custom-border-label-group">
                    <label className="form-label custom-border-label">Subject Code to Avail Tutoring</label>
                    <select
                        className="form-select custom-select"
                        value={data.courseCode || ""}
                        onChange={(e) => update({ courseCode: e.target.value })}
                    >
                        <option value="" disabled>
                            Subject that you need help with
                        </option>
                        {courses.map((course) => (
                            <option key={course.course_code} value={course.course_code}>
                                {course.course_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Date Picker Field */}
                <div className="custom-border-label-group">
                    <label className="form-label custom-border-label">Preferred Date</label>
                    <input
                        type="date"
                        className="form-control custom-input"
                        value={data.preferredDate || ""}
                        onChange={handleDateChange}
                    />
                </div>
            </div>
        </div>
    );
}
