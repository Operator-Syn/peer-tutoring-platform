import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./FillOut.css";

export default function FillOut({ data, update }) {
    const [programs, setPrograms] = useState([]);
    const [courses, setCourses] = useState([]);
    const [displayDate, setDisplayDate] = useState("");

    // Fetch programs and courses
    useEffect(() => {
        // Replace with your actual API endpoint
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

    // Date initialization logic
    useEffect(() => {
        if (!data.preferredDate) {
            const today = getToday();
            const dayOfWeek = getDayOfWeek(today);
            update({ preferredDate: today, day_of_week: dayOfWeek });
            setDisplayDate(formatDisplayDate(today));
        } else {
            setDisplayDate(formatDisplayDate(data.preferredDate));
        }
    }, []);

    const formatDisplayDate = (dateString) => {
        if (!dateString) return "";
        const dateParts = dateString.split("-");
        const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        return date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "2-digit" });
    };

    const getDayOfWeek = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        return days[date.getDay()];
    };

    const handleDateChange = (e) => {
        const selected = e.target.value;
        const dayOfWeek = getDayOfWeek(selected);
        update({ preferredDate: selected, day_of_week: dayOfWeek });
        setDisplayDate(formatDisplayDate(selected));
    };

    const getToday = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    return (
        <div className="create-appointment-form-bg">
            {/* Custom Class: fillout-side-label */}
            <h3 className="fillout-side-label h3-absolute">Fill Out</h3>

            {/* Custom Class: fillout-content-gap (Replaces gap-4) */}
            <div className="container d-flex flex-column fillout-content-gap">
                
                {/* Custom Class: fillout-title (Replaces mb-2) */}
                <h1 className="text-center text-decoration-underline fillout-title">
                    Appointment Form
                </h1>

                {/* Row with two columns - Standard Bootstrap Grid */}
                <div className="row g-3">
                    <div className="col-12 col-md-6 d-flex flex-column gap-3">
                        <div className="custom-border-label-group">
                            <label className="form-label custom-border-label">First Name</label>
                            <input
                                type="text"
                                className="form-control custom-input"
                                value={data.firstName || ''}
                                onChange={(e) => update({ firstName: e.target.value })}
                                readOnly
                            />
                        </div>

                        <div className="custom-border-label-group">
                            <label className="form-label custom-border-label">ID Number</label>
                            <input
                                type="text"
                                className="form-control custom-input"
                                value={data.idNumber || ''}
                                onChange={(e) => update({ idNumber: e.target.value })}
                                readOnly
                            />
                        </div>
                    </div>

                    <div className="col-12 col-md-6 d-flex flex-column gap-3">
                        <div className="custom-border-label-group">
                            <label className="form-label custom-border-label">Last Name</label>
                            <input
                                type="text"
                                className="form-control custom-input"
                                value={data.lastName || ''}
                                onChange={(e) => update({ lastName: e.target.value })}
                                readOnly
                            />
                        </div>

                        <div className="custom-border-label-group">
                            <label className="form-label custom-border-label">Year Level</label>
                            <input
                                type="text"
                                className="form-control custom-input"
                                value={data.yearLevel || ''}
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
                        disabled
                    >
                        <option value="" disabled>Select a program</option>
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
                        <option value="" disabled>Subject that you need help with</option>
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
                        type="text"
                        className="form-control custom-input"
                        value={displayDate}
                        onKeyDown={(e) => e.preventDefault()}
                        onFocus={(e) => {
                            e.target.type = "date";
                            if (data.preferredDate && data.preferredDate.includes('/')) {
                                const [mm, dd, yyyy] = data.preferredDate.split("/");
                                e.target.value = `${yyyy}-${mm}-${dd}`;
                            } else if (data.preferredDate) {
                                e.target.value = data.preferredDate;
                            }
                        }}
                        onBlur={(e) => {
                            e.target.type = "text";
                            e.target.value = displayDate; 
                        }}
                        onChange={handleDateChange}
                    />
                </div>
            </div>
        </div>
    );
}