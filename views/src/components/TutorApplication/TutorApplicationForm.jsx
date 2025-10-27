import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const TutorApplicationForm = () => {
  const [studentId, setStudentId] = useState('');
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const API_BASE_URL = 'http://localhost:5000/api';

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const response = await fetch(`${API_BASE_URL}/courses`);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/tutor-applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          courses: selectedCourses
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data);
        setStudentId('');
        setSelectedCourses([]);
      } else {
        setError(data.error || 'Failed to submit application');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container tutor-application-container">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card application-card">
            <div className="card-header application-card-header">
              <h3>Tutor Application Form</h3>
            </div>
            <div className="card-body application-card-body">
              
              {success && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                  <h5 className="alert-heading">Application Submitted Successfully! </h5>
                  <hr />
                  <div className="success-details">
                    <p><strong>Application ID:</strong> {success.application_id}</p>
                    <p><strong>Student:</strong> {success.student.name}</p>
                    <p><strong>Status:</strong> <span className="badge bg-warning text-dark">{success.status}</span></p>
                    <p><strong>Courses Applied For:</strong></p>
                    <ul>
                      {success.courses.map(course => (
                        <li key={course.course_code}>
                          {course.course_code} - {course.course_name}
                        </li>
                      ))}
                    </ul>
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
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  <strong>Error:</strong> {error}
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setError(null)}
                    aria-label="Close"
                  ></button>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                
                <div className="mb-3">
                  <label htmlFor="studentId" className="form-label">
                    Student ID <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="studentId"
                    placeholder="e.g., 2023-1234"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    disabled={loading}
                  />
                  <div className="form-text">
                    Enter your student ID as registered in the system
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Courses You Can Teach <span className="required">*</span>
                  </label>
                  
                  {loadingCourses ? (
                    <div className="loading-container">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading courses...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="course-selection-box">
                      {availableCourses.length === 0 ? (
                        <div className="empty-state">
                          <p className="text-muted mb-0">No courses available</p>
                        </div>
                      ) : (
                        availableCourses.map(course => (
                          <div className="form-check" key={course.course_code}>
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`course-${course.course_code}`}
                              checked={selectedCourses.includes(course.course_code)}
                              onChange={() => handleCourseToggle(course.course_code)}
                              disabled={loading}
                            />
                            <label 
                              className="form-check-label" 
                              htmlFor={`course-${course.course_code}`}
                            >
                              <strong>{course.course_code}</strong> - {course.course_name}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  
                  {selectedCourses.length > 0 && (
                    <div className="course-counter">
                      <p className="course-counter-text">
                         {selectedCourses.length} course(s) selected
                      </p>
                    </div>
                  )}
                </div>

                <div className="btn-group-custom">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading || loadingCourses}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Submitting...
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                  
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setStudentId('');
                      setSelectedCourses([]);
                      setError(null);
                      setSuccess(null);
                    }}
                    disabled={loading}
                  >
                    Reset
                  </button>
                </div>
              </form>

            </div>
          </div>

          </div>
        </div>
      </div>
  );
};

export default TutorApplicationForm;