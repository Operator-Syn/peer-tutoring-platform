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

  const removeCourse = (courseCode) => {
    setSelectedCourses(prev => prev.filter(code => code !== courseCode));
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
    <div className="application-container">
      <div className="application-wrapper">
        
        {success && (
          <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
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
          
          <form onSubmit={handleSubmit}>
            <div className="form-content">
              <div className="form-left">

                <div className="form-group">
                  <label className="form-label-custom">First Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label-custom">Last Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label-custom">Student ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter student ID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    disabled={loading}
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
                      <option value="">Subject Code</option>
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
                </div>

                <div className="file-upload">
                  <label for="corFile" className="form-label-custom">Certificate of Registration (COR)</label>
                  <div class="dropzone">
                    <input type="file" className="form-input" id="corFile" accept=".pdf,.jpg,.png" />
                  </div>
                </div>

                {selectedCourses.length > 0 && (
                  <div className="selected-courses">
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
                )}

              </div>
            </div>

            <div className="submit-wrapper">
              <button 
                type="submit" 
                className="submit-button"
                disabled={loading || loadingCourses}
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