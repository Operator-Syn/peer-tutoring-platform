import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
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


  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchStudentInfo = async () => {
      if (!studentId || studentId.trim().length === 0) {
        setFirstName('');
        setLastName('');
        setStudentNotFound(false);
        return;
      }

      setLoadingStudent(true);
      setStudentNotFound(false);
      setError(null);

      try {
        const response = await fetch(`/api/tutor-applications/student/${studentId.trim()}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setFirstName(data.student.first_name || '');
          setLastName(data.student.last_name || '');
          setStudentNotFound(false);
        } else {
          setFirstName('');
          setLastName('');
          setStudentNotFound(true);
        }
      } catch (err) {
        console.error('Error fetching student info:', err);
        setFirstName('');
        setLastName('');
        setStudentNotFound(true);
      } finally {
        setLoadingStudent(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchStudentInfo();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [studentId]);

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      setError(null)
      const response = await fetch(`/api/tutor-applications/courses`);
      const data = await response.json();

      if (response.ok) {
        setAvailableCourses(data.courses);
      } else {
        setError('Failed to load courses');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error(err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleCourseToggle = (courseCode) => {
    setSelectedCourses(prev => {
      if (prev.includes(courseCode)) {
        return prev.filter(code => code !== courseCode);
      } else {
        return [...prev, courseCode];
      }
    });
  };

  const removeCourse = (courseCode) => {
    setSelectedCourses(prev => prev.filter(code => code !== courseCode));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (studentNotFound) {
      setError('Please enter a valid Student ID');
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);
    
    const formData = new FormData();
    formData.append("student_id", studentId);
    selectedCourses.forEach(course => formData.append("courses", course));
    
    const fileInput = document.getElementById("corFile");
    if (fileInput.files.length > 0) {
      formData.append("corFile", fileInput.files[0]);
    }

    try {
      const response = await fetch(`/api/tutor-applications/tutor-applications`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        setSuccess(data);
        setStudentId("");
        setFirstName("");
        setLastName("");
        setSelectedCourses([]);
        fileInput.value = "";
        setStudentNotFound(false);
      } else {
        setError(data.error || "Failed to submit application");
      }
    } catch (err) {
      console.error(err);
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="application-container">
      <div className="application-wrapper">
        
        {success && (
          <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
            <h5 className="alert-heading">Application Submitted Successfully! </h5>
            <hr />
            <div className="success-details">
              <p><strong>Application ID:</strong> {success.application_id}</p>
              <p><strong>Message:</strong> {success.message}</p>
              {success.student_id && <p><strong>Student ID:</strong> {success.student_id}</p>}

              {success.courses && success.courses.length > 0 && (
                <>
                  <p><strong>Courses:</strong></p>
                  <ul>
                    {success.courses.map((course, idx) => (
                      <li key={course.course_code || idx}>
                        {course && course.course_code
                          ? `${course.course_code} - ${course.course_name || ''}`
                          : (typeof course === 'string' ? course : JSON.stringify(course))}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <p><strong>Status:</strong> <span className="badge bg-warning text-dark">PENDING</span></p>
            </div>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setSuccess(null)}
              aria-label="Close"
            ></button>
          </div>
        )}

        {error && (
          <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
            <strong>Error:</strong> {error}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setError(null)}
              aria-label="Close"
            ></button>
          </div>
        )}

        <div className="form-card">
          <h2 className="form-title">Application Form</h2>
          
          {loadingCourses && (
            <div className="alert alert-info">
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Loading courses...
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-content">
              <div className="form-left">

                <div className="form-group">
                  <label className="form-label-custom">Student ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter student ID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    disabled={loading}
                    required
                  />
                  {loadingStudent && (
                    <small className="text-muted">
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      Fetching student information...
                    </small>
                  )}
                  {studentNotFound && studentId && !loadingStudent && (
                    <small className="text-danger">
                      Student ID not found in the system
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label-custom">First Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Auto-filled from Student ID"
                    value={firstName}
                    readOnly
                    disabled
                    style={{ 
                      backgroundColor: '#f8f9fa', 
                      cursor: 'not-allowed',
                      color: firstName ? '#495057' : '#6c757d'
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label-custom">Last Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Auto-filled from Student ID"
                    value={lastName}
                    readOnly
                    disabled
                    style={{ 
                      backgroundColor: '#f8f9fa', 
                      cursor: 'not-allowed',
                      color: lastName ? '#495057' : '#6c757d'
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label-custom">Subject Code</label>
                  <div className="dropdown-wrapper">
                    <select 
                      className="form-select-custom"
                      onChange={(e) => {
                        if (e.target.value && !selectedCourses.includes(e.target.value)) {
                          handleCourseToggle(e.target.value);
                        }
                        e.target.value = '';
                      }}
                      disabled={loading || loadingCourses}
                    >
                      <option value="">
                        {loadingCourses ? 'Loading...' : 
                         availableCourses.length === 0 ? 'No courses available' : 
                         'Select Subject Code'}
                      </option>
                      {availableCourses.map(course => (
                        <option 
                          key={course.course_code} 
                          value={course.course_code}
                          disabled={selectedCourses.includes(course.course_code)}
                        >
                          {course.course_code} - {course.course_name}
                        </option>
                      ))}
                    </select>
                    <span className="dropdown-icon">▼</span>
                  </div>
                  {availableCourses.length > 0 && (
                    <small className="text-muted">
                      {availableCourses.length} courses available
                    </small>
                  )}
                </div>

                {selectedCourses.length > 0 && (
                  <div className="selected-courses mb-3">
                    <label className="form-label-custom">Selected Courses:</label>
                    <div className="d-flex flex-wrap gap-2">
                      {selectedCourses.map(courseCode => {
                        const course = availableCourses.find(c => c.course_code === courseCode);
                        return (
                          <span key={courseCode} className="course-tag">
                            {course?.course_code || courseCode}
                            <button
                              type="button"
                              className="course-tag-close"
                              onClick={() => removeCourse(courseCode)}
                              disabled={loading}
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="file-upload">
                  <label htmlFor="corFile" className="form-label-custom">
                    Certificate of Registration (COR) *
                  </label>
                  <div className="dropzone">
                    <input 
                      type="file" 
                      className="form-input" 
                      id="corFile" 
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                    />
                  </div>
                  <small className="text-muted">Accepted formats: PDF, JPG, PNG (Max 5MB)</small>
                </div>

              </div>
            </div>

            <div className="submit-wrapper">
              <button 
                type="submit" 
                className="submit-button"
                disabled={loading || loadingCourses || loadingStudent || selectedCourses.length === 0 || studentNotFound || !firstName || !lastName}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit
                    <span className="submit-arrow">→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TutorApplicationForm;