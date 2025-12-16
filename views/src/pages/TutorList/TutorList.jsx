import './TutorList.css';
import loadingIcon from '../../assets/loading.svg';

import { use, useEffect, useState } from "react";
import BasicButton from '../../components/BasicButton/BasicButton.jsx';
import ModalComponent from '../../components/modalComponent/ModalComponent.jsx'; 
import Select from 'react-select';
import { Form, Card, Button, Toast, ToastContainer } from 'react-bootstrap'; 
import { useNavigate } from "react-router-dom";
import { MSU_COURSES, COLLEGES } from "../../data/MSUCourses.js";

const customSelectStyles = {
    control: (provided, state) => ({
        ...provided,
        borderRadius: '8px',
        borderColor: state.isFocused ? '#5865f2' : '#ced4da',
        boxShadow: state.isFocused ? '0 0 0 3px rgba(88, 101, 242, 0.15)' : 'none',
        '&:hover': { borderColor: '#5865f2' }
    }),
    menu: (provided) => ({ ...provided, zIndex: 9999 })
};

const availabilityOptions = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
];

const collegeOptions = COLLEGES.map(col => ({ value: col.code, label: col.name }));

export default function TutorList() {
    const [page, setPage] = useState(1);
    const [maxPages, setMaxPages] = useState(1);
    const [tutors, setTutors] = useState([]);
    const [courseOptions, setCourseOptions] = useState([]);
    const [courseSearch, setCourseSearch] = useState('');
    const [availabilitySearch, setAvailabilitySearch] = useState('');
    const [nameSearch, setNameSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [existingCourses, setExistingCourses] = useState([]);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedCollege, setSelectedCollege] = useState(null);
    const [selectedCourseOption, setSelectedCourseOption] = useState(null);
    const [requestSubject, setRequestSubject] = useState('');
    const [requestName, setRequestName] = useState('');
    const [requestReason, setRequestReason] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success');

    useEffect(() => {
        if (!page) return;
        fetch(`/api/tutor-list/all?page=${page ? page : 1}${courseSearch ? `&course=${encodeURIComponent(courseSearch.value)}` : ''}&availability=${availabilitySearch ? encodeURIComponent(availabilitySearch.value) : ''}${nameSearch ? `&name=${encodeURIComponent(nameSearch)}` : ''}`)
            .then(res => res.json())
            .then(data => {
                setTutors(Array.isArray(data.tutors) ? data.tutors : []);
                setMaxPages(data.max_pages);
            })
            .catch(error => console.error("Error fetching tutors:", error))
            .finally(() => setLoading(false));
        setLoading(true);
    }, [page, courseSearch, availabilitySearch, nameSearch]);

    useEffect(() => {
        if (!page) {
            setLoading(true);
        }
    }, [page]);

    const fetchCourses = (search = '') => {
        fetch(`/api/tutor-list/courses?search=${encodeURIComponent(search)}`)
        .then(res => res.json())
        .then(data => {
            setCourseOptions(
            (data.courses || []).map(c => ({ value: c, label: c }))
            );
        });
    };

    const triggerToast = (message, variant = 'success') => {
        setToastMessage(message);
        setToastVariant(variant);
        setShowToast(true);
    };

    const getFilteredCourseOptions = () => {
        if (!selectedCollege) return [];
        return MSU_COURSES
            .filter(c => c.college === selectedCollege.value)
            .map(c => ({ 
                value: c.code, 
                label: `${c.code} - ${c.name}`, 
                fullData: c 
            }));
    };

    const handleInitialSubmit = () => {
        if (!selectedCourseOption) {
            triggerToast("Please select a valid course.", "danger");
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
                    subject_name: requestName,
                    description: requestReason
                })
            });
            const data = await res.json();
            
            if (res.ok) {
                triggerToast("Request submitted successfully!", "success");
                setShowConfirmModal(false);
                resetRequestForm();
            } else {
                triggerToast(data.error || "Failed to submit request", "danger");
            }
        } catch (error) {
            console.error(error);
            triggerToast("An error occurred. Please try again.", "danger");
        }
    };

    const resetRequestForm = () => {
        setSelectedCollege(null);
        setSelectedCourseOption(null);
        setRequestSubject('');
        setRequestName('');
        setRequestReason('');
    };

    return (
        <div className="tutor-list align-items-center">
            <ToastContainer position="top-end" className="p-3" style={{ zIndex: 3000, position: 'fixed' }}>
                <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide bg={toastVariant}>
                    <Toast.Body className="text-white">{toastMessage}</Toast.Body>
                </Toast>
            </ToastContainer>

            <h1 style={{marginTop: "5rem", fontSize: "3rem", color: "#616DBE", fontWeight: "bold"}}>Tutors</h1>

            <div className='tutor-list-search d-flex gap-3 mb-3 flex-wrap justify-content-center'>
                <div className='d-flex gap-3 justify-content-center'>
                    <div className='p-0' style={{width: "11rem", minWidth: "140px"}}>
                        <Select options={courseOptions} isSearchable isClearable placeholder="Course" onInputChange={e => {fetchCourses(e);}} onChange={e => {setCourseSearch(e);setPage(1);}} />
                    </div>
                    <div className='p-0' style={{width: "11rem", minWidth: "140px"}}>
                        <Select options={availabilityOptions} isClearable isSearchable={false} placeholder="Availability" onChange={e => {setAvailabilitySearch(e);setPage(1);}} />
                    </div>
                </div>

                <div className='tutor-list-search-bar p-0' style={{width: "100%", minWidth: "17rem", maxWidth: "20rem"}}>
                    <Form>
                        <Form.Control type="search" placeholder="Search Tutors" className="me-2" aria-label="Search" onChange={e => {setNameSearch(e.target.value); setPage(1);}} />
                    </Form>
                </div>
                
                <BasicButton 
                    style={{height: '38px', minWidth: 'fit-content', padding: '0 1rem', fontSize: '0.9rem'}}
                    onClick={() => setShowRequestModal(true)}
                >
                    Request Subject
                </BasicButton>
            </div>

            <div className='tutor-card-grid' style={{minHeight: "33.8rem"}}>
                {(loading) && (
                    <div className="loading-overlay">
                        <img src={loadingIcon} alt="Loading..." />
                    </div>
                )}
                {tutors.map((tutor, idx) => (
                    <TutorCard key={idx} {...tutor} />
                ))}
            </div>

            <div className="d-flex align-items-center justify-content-center gap-2 mt-3">
                <Button variant="outline-primary" onClick={() => setPage(prev => Math.max(1, Number(prev) - 1))}>
                    &lt;
                </Button>
                <span>
                    <Form.Control value={page} onChange={e => {
                            const val = e.target.value;
                            if (val === "" || (/^\d+$/.test(val) && Number(val) >= 1 && Number(val) <= maxPages)) {
                                setPage(val === "" ? "" : Number(val));
                            }
                        }} 
                        style={{ width: "60px", display: "inline-block", textAlign: "center" }} />
                    {" "} of {maxPages}
                </span>
                <Button variant="outline-primary" onClick={() => setPage(prev => Math.min(maxPages, Number(prev) + 1))}>
                    &gt;
                </Button>
            </div>

            <ModalComponent 
                show={showRequestModal}
                onHide={() => {
                    setShowRequestModal(false);
                    resetRequestForm();
                }}
                title="Request a New Course"
                body={
                    <Form className="subject-request-form">
                        <Form.Group className="mb-3">
                            <Form.Label className="custom-form-label">College</Form.Label>
                            <Select
                                options={collegeOptions}
                                value={selectedCollege}
                                onChange={(option) => {
                                    setSelectedCollege(option);
                                    setSelectedCourseOption(null);
                                    setRequestSubject("");
                                    setRequestName("");
                                }}
                                placeholder="-- Select College --"
                                styles={customSelectStyles}
                                isClearable
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="custom-form-label">Select Course</Form.Label>
                            <Select
                                options={getFilteredCourseOptions()}
                                value={selectedCourseOption}
                                isDisabled={!selectedCollege}
                                onChange={(option) => {
                                    setSelectedCourseOption(option);
                                    if (option) {
                                        setRequestSubject(option.value);
                                        setRequestName(option.fullData.name);
                                    } else {
                                        setRequestSubject("");
                                        setRequestName("");
                                    }
                                }}
                                placeholder={selectedCollege ? "Type to search..." : "Select College First"}
                                styles={customSelectStyles}
                                isClearable
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="custom-form-label">Course Name</Form.Label>
                            <Form.Control 
                                type="text" 
                                value={requestName} 
                                readOnly 
                                className="custom-form-input"
                                style={{ backgroundColor: '#f8f9fa' }}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="custom-form-label">Reason (Optional)</Form.Label>
                            <Form.Control 
                                as="textarea" 
                                rows={3} 
                                value={requestReason} 
                                onChange={(e) => setRequestReason(e.target.value)} 
                                className="custom-form-input textarea-input"
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
                onHide={() => setShowConfirmModal(false)}
                title="Confirm Request"
                body={
                    <div className="custom-confirm-body">
                        <p>Are you sure you want to submit this request?</p>
                        <div className="custom-summary-box">
                            <p><strong>Code:</strong> {requestSubject}</p>
                            <p><strong>Name:</strong> {requestName}</p>
                            {requestReason && <p><strong>Reason:</strong> {requestReason}</p>}
                        </div>
                    </div>
                }
                rightButtons={[
                    { text: "Confirm Submit", onClick: confirmSubmitRequest, className: "custom-btn-success" }
                ]}
                leftButtons={[
                    { text: "Back", variant: "secondary", onClick: () => setShowConfirmModal(false), className: "custom-btn-secondary" }
                ]}
                spaceBetweenGroups={true}
            />
        </div>
    );
}

function TutorCard({tutorName="Tutor Name", courses, tutorId}) {
    const navigate = useNavigate();

    return (
        <Card className="column tutor-card-a" style={{ width: '18rem', padding: "1rem", gap: "1rem", height: "fit-content", minHeight: "166.24px" }}>
            <Card.Body className="d-flex tutor-info-1" style={{padding: "0"}}>
                <Card.Img variant="top" src="https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg" style={{width: "58px", height: "58px", padding: "0"}}/>
                <div className="column m-auto">
                    <Card.Title className='tutor-card-a-name text-center'>{tutorName}</Card.Title>
                    <Card.Text className='text-center'>Tutor</Card.Text>
                </div>
            </Card.Body>
            <Card.Body className="row tutor-info-2-preview gap-2" style={{padding: "0rem", margin: "0", maxWidth: "254px", overflowX: "auto"}}>
                {courses.slice(0,3).map((course, idx) => (
                    <CourseTag key={idx} courseCode={course} />
                ))}
                {courses.length > 3 && <CourseTag courseCode={'...'} />}
            </Card.Body>
            <Card.Body className="row tutor-info-2 gap-2" style={{padding: "0rem", margin: "0", maxWidth: "254px", overflowX: "auto"}}>
                {courses.map((course, idx) => (
                    <CourseTag key={idx} courseCode={course} />
                ))}
            </Card.Body>
            <BasicButton style={{fontSize: "0.8rem", borderRadius: "4px", width: "fit-content", height: "auto", minWidth: 0, padding: "0.175rem 0.75rem", marginLeft: "auto"}} onClick={() => { navigate(`/tutor/${tutorId}`) }}> 
                View Profile 
            </BasicButton>
        </Card>
    );
}

function CourseTag({ courseCode }) {
    return (
        <div className="course-tag-list">
            <p style={{margin: "0px", fontSize: "0.7rem"}}>{courseCode}</p>
        </div>
    );
}