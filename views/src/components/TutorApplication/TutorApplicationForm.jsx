import React, { useState, useEffect } from 'react';
import './TutorApplicationForm.css';

const TutorApplicationForm = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [studentNotFound, setStudentNotFound] = useState(false);

  useEffect(() => { fetchCourses(); }, []);

  useEffect(() => {
    const fetchStudentInfo = async () => {
      if (!studentId || studentId.trim().length === 0) {
        setFirstName(''); setLastName(''); setStudentNotFound(false); return;
      }
      setLoadingStudent(true); setStudentNotFound(false); setError(null);
      try {
        const response = await fetch(`/api/tutor-applications/student/${studentId.trim()}`);
        const data = await response.json();
        if (response.ok && data.success) {
          setFirstName(data.student.first_name || '');
          setLastName(data.student.last_name || '');
        } else {
          setFirstName(''); setLastName(''); setStudentNotFound(true);
        }
      } catch (err) {
        setFirstName(''); setLastName(''); setStudentNotFound(true);
      } finally {
        setLoadingStudent(false);
      }
    };
    const timeoutId = setTimeout(fetchStudentInfo, 500);
    return () => clearTimeout(timeoutId);
  }, [studentId]);

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true); setError(null);
      const response = await fetch(`/api/tutor-applications/courses`);
      const data = await response.json();
      if (response.ok) setAvailableCourses(data.courses);
      else setError('Failed to load courses');
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleCourseToggle = (courseCode) => {
    setSelectedCourses(prev => prev.includes(courseCode) ? prev.filter(c => c !== courseCode) : [...prev, courseCode]);
  };

  const removeCourse = (courseCode) => {
    setSelectedCourses(prev => prev.filter(c => c !== courseCode));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (studentNotFound) { setError('Please enter a valid Student ID'); return; }
    
    setLoading(true); setError(null); setSuccess(null);
    const formData = new FormData();
    formData.append("student_id", studentId);
    selectedCourses.forEach(c => formData.append("courses", c));
    const fileInput = document.getElementById("corFile");
    if (fileInput.files.length > 0) formData.append("corFile", fileInput.files[0]);

    try {
      const response = await fetch(`/api/tutor-applications/tutor-applications`, { method: "POST", body: formData });
      const data = await response.json();
      if (response.ok) {
        setSuccess(data);
        setStudentId(""); setFirstName(""); setLastName(""); setSelectedCourses([]); fileInput.value = "";
      } else {
        setError(data.error || "Failed to submit");
      }
    } catch (err) {
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  if (loadingCourses) {
    return (
      <div className="tutor-app-container">
        <div className="tutor-loading-page">
          <div className="tutor-app-spinner tutor-spinner-large"></div>
          <p>Loading Application Form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tutor-app-container">
      <div className="tutor-app-wrapper">
        {success && (
          <div className="tutor-app-alert tutor-app-alert-success">
            <div className="tutor-app-alert-header">
                <h5 className="tutor-app-alert-heading">Application Submitted Successfully! ✓</h5>
                <button type="button" className="tutor-app-btn-close" onClick={() => setSuccess(null)}>×</button>
            </div>
            <hr className="tutor-app-alert-hr"/>
            <div className="tutor-app-success-details">
              <p><strong>Application ID:</strong> {success.application_id}</p>
              <p><strong>Message:</strong> {success.message}</p>
              {success.courses && success.courses.length > 0 && (
                <>
                  <p><strong>Courses:</strong></p>
                  <ul>
                    {success.courses.map((course, idx) => (
                      <li key={idx}>{course.course_code ? `${course.course_code} - ${course.course_name}` : course}</li>
                    ))}
                  </ul>
                </>
              )}
              <p><strong>Status:</strong> <span className="tutor-app-badge-pending">PENDING</span></p>
            </div>
          </div>
        )}

        {error && (
          <div className="tutor-app-alert tutor-app-alert-danger">
            <strong>Error:</strong> {error}
            <button type="button" className="tutor-app-btn-close" onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className="tutor-app-form-card">
          <h2 className="tutor-app-title">Application Form</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="tutor-app-grid">
              <div className="tutor-app-col">
                <div className="tutor-app-group">
                  <label className="tutor-app-label">Student ID</label>
                  <input
                    type="text"
                    className="tutor-app-input"
                    placeholder="Enter student ID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    disabled={loading}
                    required
                  />
                  {loadingStudent && <small className="tutor-app-text-muted">Fetching student information...</small>}
                  {studentNotFound && !loadingStudent && <small className="tutor-app-text-danger">Student ID not found in the system</small>}
                </div>

                <div className="tutor-app-group">
                  <label className="tutor-app-label">First Name</label>
                  <input
                    type="text"
                    className="tutor-app-input tutor-app-readonly"
                    placeholder="Auto-filled from Student ID"
                    value={firstName}
                    readOnly
                    disabled
                  />
                </div>

                <div className="tutor-app-group">
                  <label className="tutor-app-label">Last Name</label>
                  <input
                    type="text"
                    className="tutor-app-input tutor-app-readonly"
                    placeholder="Auto-filled from Student ID"
                    value={lastName}
                    readOnly
                    disabled
                  />
                </div>

                <div className="tutor-app-group">
                  <label className="tutor-app-label">Subject Code</label>
                  <div className="tutor-app-dropdown-wrapper">
                    <select 
                      className="tutor-app-select"
                      onChange={(e) => {
                        if (e.target.value && !selectedCourses.includes(e.target.value)) handleCourseToggle(e.target.value);
                        e.target.value = '';
                      }}
                      disabled={loading || loadingCourses}
                    >
                      <option value="">{availableCourses.length === 0 ? 'No courses available' : 'Select Subject Code'}</option>
                      {availableCourses.map(course => (
                        <option key={course.course_code} value={course.course_code} disabled={selectedCourses.includes(course.course_code)}>
                          {course.course_code} - {course.course_name}
                        </option>
                      ))}
                    </select>
                    <span className="tutor-app-dropdown-icon">▼</span>
                  </div>
                </div>

                {selectedCourses.length > 0 && (
                  <div className="tutor-app-selected-courses mb-3">
                    <label className="tutor-app-label">Selected Courses:</label>
                    <div className="tutor-app-tags-container">
                      {selectedCourses.map(courseCode => (
                        <span key={courseCode} className="tutor-app-tag">
                          {courseCode}
                          <button type="button" className="tutor-app-tag-close" onClick={() => removeCourse(courseCode)} disabled={loading}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="tutor-app-group">
                  <label htmlFor="corFile" className="tutor-app-label">Certificate of Registration (COR) *</label>
                  <input type="file" className="tutor-app-file-input" id="corFile" accept=".jpg,.jpeg,.png" required />
                  <small className="tutor-app-text-muted">Accepted formats: JPG, PNG (Max 5MB)</small>
                </div>
              </div>
            </div>

            <div className="tutor-app-submit-wrapper">
              <button type="submit" className="tutor-app-submit-btn" disabled={loading || studentNotFound || !firstName}>
                {loading ? <><span className="tutor-app-spinner"></span> Submitting...</> : <>Submit <span className="tutor-app-submit-arrow">→</span></>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TutorApplicationForm;