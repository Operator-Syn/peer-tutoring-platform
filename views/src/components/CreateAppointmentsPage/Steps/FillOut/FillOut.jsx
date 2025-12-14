import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./FillOut.css";
import ModalComponent from "../../../../components/modalComponent/ModalComponent"; 
import { Form, Button, Toast, ToastContainer } from "react-bootstrap"; 

export default function FillOut({ data, update }) {
    const [programs, setPrograms] = useState([]);
    const [courses, setCourses] = useState([]);
    const [displayDate, setDisplayDate] = useState("");

    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [requestSubject, setRequestSubject] = useState('');
    const [requestReason, setRequestReason] = useState('');
    
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success');

    // Fetch programs and courses
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

    const triggerToast = (message, variant = 'success') => {
        setToastMessage(message);
        setToastVariant(variant);
        setShowToast(true);
    };

    const handleInitialSubmit = () => {
        if (!requestSubject.trim()) {
            triggerToast("Subject name is required", "danger");
            return;
        }
        setShowRequestModal(false);
        setShowConfirmModal(true);
    };

    const confirmSubmitRequest = async () => {
        try {
            const res = await fetch('/api/request/subject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject_code: requestSubject,
                    description: requestReason
                })
            });
            const result = await res.json();
            
            if (res.ok) {
                triggerToast("Request submitted successfully!", "success");
                setShowConfirmModal(false);
                setRequestSubject('');
                setRequestReason('');
            } else {
                triggerToast(result.error || "Failed to submit request", "danger");
            }
        } catch (error) {
            console.error(error);
            triggerToast("An error occurred. Please try again.", "danger");
        }
    };

    const cancelConfirmation = () => {
        setShowConfirmModal(false);
        setShowRequestModal(true);
    };

    return (
        <div className="create-appointment-form-bg">
            <ToastContainer position="top-end" className="p-3" style={{ zIndex: 3000, position: 'fixed' }}>
                <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide bg={toastVariant}>
                    <Toast.Body className="text-white">{toastMessage}</Toast.Body>
                </Toast>
            </ToastContainer>

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
                    <div className="subject-header-row">
                        <label className="form-label custom-border-label static-label">Subject Code to Avail Tutoring</label>
                        <button 
                            className="cant-find-course-link"
                            onClick={() => setShowRequestModal(true)}
                        >
                            Can't find your course?
                        </button>
                    </div>
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

            <ModalComponent 
                show={showRequestModal}
                onHide={() => setShowRequestModal(false)}
                title="Request a New Subject"
                body={
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label className="custom-form-label">Subject Code / Name</Form.Label>
                            <Form.Control 
                                type="text" 
                                placeholder="e.g. CSC 101" 
                                value={requestSubject} 
                                onChange={(e) => setRequestSubject(e.target.value)}
                                className="custom-form-input"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="custom-form-label">Reason (Optional)</Form.Label>
                            <Form.Control 
                                as="textarea" 
                                rows={3} 
                                placeholder="Why do you need this subject?" 
                                value={requestReason} 
                                onChange={(e) => setRequestReason(e.target.value)}
                                className="custom-form-input"
                            />
                        </Form.Group>
                    </Form>
                }
                rightButtons={[
                    { text: "Next", onClick: handleInitialSubmit, className: "custom-btn-primary" }
                ]}
                leftButtons={[
                    { text: "Cancel", variant: "secondary", onClick: () => setShowRequestModal(false), className: "custom-btn-secondary" }
                ]}
                spaceBetweenGroups={true}
            />

            <ModalComponent 
                show={showConfirmModal}
                onHide={cancelConfirmation}
                title="Confirm Request"
                body={
                    <div className="custom-confirm-body">
                        <p>Are you sure you want to submit this request?</p>
                        <div className="custom-summary-box p-3 bg-light rounded">
                            <p><strong>Subject:</strong> {requestSubject}</p>
                            {requestReason && <p><strong>Reason:</strong> {requestReason}</p>}
                        </div>
                    </div>
                }
                rightButtons={[
                    { text: "Confirm Submit", onClick: confirmSubmitRequest, className: "custom-btn-success" }
                ]}
                leftButtons={[
                    { text: "Back", variant: "secondary", onClick: cancelConfirmation, className: "custom-btn-secondary" }
                ]}
                spaceBetweenGroups={true}
            />
        </div>
    );
}