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

  return (
    <div className="tutor-app-container">
      <div className="tutor-app-card">
        {success && (
          <div className="tutor-alert tutor-alert-success">
            <h5>Application Submitted! ✓</h5>
            <p><strong>Status:</strong> PENDING</p>
            <button className="tutor-close-btn" onClick={() => setSuccess(null)}>×</button>
          </div>
        )}
        {error && (
          <div className="tutor-alert tutor-alert-danger">
            <strong>Error:</strong> {error}
            <button className="tutor-close-btn" onClick={() => setError(null)}>×</button>
          </div>
        )}

        <h2 className="tutor-form-title">Tutor Application</h2>

        <form onSubmit={handleSubmit} className="tutor-form-layout">
          <div className="tutor-form-group">
            <label>Student ID</label>
            <input type="text" className="tutor-input" value={studentId} onChange={e => setStudentId(e.target.value)} required />
            {loadingStudent && <small className="tutor-helper-text">Checking ID...</small>}
            {studentNotFound && !loadingStudent && <small className="tutor-error-text">Student not found</small>}
          </div>

          <div className="tutor-row">
            <div className="tutor-form-group">
              <label>First Name</label>
              <input type="text" className="tutor-input read-only" value={firstName} readOnly disabled />
            </div>
            <div className="tutor-form-group">
              <label>Last Name</label>
              <input type="text" className="tutor-input read-only" value={lastName} readOnly disabled />
            </div>
          </div>

          <div className="tutor-form-group">
            <label>Subject Code</label>
            <div className="tutor-select-wrapper">
              <select className="tutor-select" onChange={e => { handleCourseToggle(e.target.value); e.target.value = ''; }}>
                <option value="">{loadingCourses ? 'Loading...' : 'Select Subject'}</option>
                {availableCourses.map(c => <option key={c.course_code} value={c.course_code} disabled={selectedCourses.includes(c.course_code)}>{c.course_code} - {c.course_name}</option>)}
              </select>
            </div>
          </div>

          {selectedCourses.length > 0 && (
            <div className="tutor-tags-container">
              {selectedCourses.map(c => (
                <span key={c} className="tutor-tag">{c} <button type="button" onClick={() => handleCourseToggle(c)}>×</button></span>
              ))}
            </div>
          )}

          <div className="tutor-form-group">
            <label>Upload COR (Image only)</label>
            <input type="file" id="corFile" className="tutor-file-input" accept=".jpg,.jpeg,.png" required />
          </div>

          <button type="submit" className="tutor-submit-btn" disabled={loading || studentNotFound || !firstName}>
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TutorApplicationForm;