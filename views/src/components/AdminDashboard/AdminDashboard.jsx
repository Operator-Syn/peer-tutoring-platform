import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './AdminDashboard.css';
import BasicCard from '../HomePageCard/HomePageCard';

const AdminDashboard = () => {
  const [statistics, setStatistics] = useState({
    total_applications: 0,
    pending: 0,
    total_tutors: 0,
    total_tutees: 0,
    total_courses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [processingId, setProcessingId] = useState(null);

  const API_BASE_URL = 'http://127.0.0.1:5000/api/tutor-applications';

  useEffect(() => {
    fetchData();
  }, []);

    useEffect(() => {
    applyFiltersAndSort();
  }, [applications, searchQuery, sortBy]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [appsResponse, statsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/applications`),
        fetch(`${API_BASE_URL}/admin/statistics`)
      ]);

      if (!appsResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const appsData = await appsResponse.json();
      const statsData = await statsResponse.json();

      console.log('Applications:', appsData);
      console.log('Statistics:', statsData);

      if (appsData.applications && Array.isArray(appsData.applications)) {
        setApplications(appsData.applications);
      }

      if (statsData.statistics) {
        setStatistics(statsData.statistics);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Using mock data for display.');
      setApplications(getMockApplications());
      setStatistics(getMockStatistics());
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...applications];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        app.student_id?.toLowerCase().includes(query) ||
        app.student_name?.toLowerCase().includes(query) ||
        app.college?.toLowerCase().includes(query) ||
        (app.courses && app.courses.some(c => c.toLowerCase().includes(query)))
      );
    }

    switch (sortBy) {
      case 'date_desc':
        filtered.sort((a, b) => new Date(b.date_submitted) - new Date(a.date_submitted));
        break;
      case 'date_asc':
        filtered.sort((a, b) => new Date(a.date_submitted) - new Date(b.date_submitted));
        break;
      case 'name_asc':
        filtered.sort((a, b) => (a.student_name || a.student_id).localeCompare(b.student_name || b.student_id));
        break;
      case 'name_desc':
        filtered.sort((a, b) => (b.student_name || b.student_id).localeCompare(a.student_name || a.student_id));
        break;
      default:
        break;
    }

    setFilteredApplications(filtered);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const statsCards = [
    { key: "total_tutors", title: statistics.total_tutors || 0, description: "Number of Tutors", style: { backgroundColor: "#fff" } },
    { key: "total_applications", title: statistics.total_applications || 0, description: "Number of Applications", style: { backgroundColor: "#fff" } },
    { key: "total_tutees", title: statistics.total_tutees || 0, description: "Number of Tutees", style: { backgroundColor: "#fff" } },
    { key: "total_courses", title: statistics.total_courses || 0, description: "Total Courses", style: { backgroundColor: "#fff" } },
    { key: "active_sessions", title: statistics.active_sessions || 0, description: "Active Sessions", style: { backgroundColor: "#fff" } },
  ];

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading-state">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-circle">
              <i className="bi bi-mortarboard-fill"></i>
            </div>
          </div>
          <nav className="header-nav">
            <a href="/" className="nav-link">Home</a>
            <a href="/about" className="nav-link">About</a>
            <a href="/events" className="nav-link">Events</a>
            <a href="/messages" className="nav-link">Messages</a>
            <a href="/reports" className="nav-link">Reports</a>
          </nav>
          <div className="user-section">
            <div className="user-avatar">
              <i className="bi bi-person-circle"></i>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="page-title">
          <h1>Admin Dashboard</h1>
        </div>

        {error && (
          <div className="alert alert-warning alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
          </div>
        )}

          <div className="controls-section">
          <div className="sort-dropdown">
            <select
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date_desc">Sort by: Newest First</option>
              <option value="date_asc">Sort by: Oldest First</option>
              <option value="name_asc">Sort by: Name (A-Z)</option>
              <option value="name_desc">Sort by: Name (Z-A)</option>
            </select>
          </div>

          <div className="search-box">
            <input
              type="text"
              className="form-control"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="search-btn">
              <i className="bi bi-search"></i>
            </button>
          </div>
        </div>

        <div className="applications-list">
          {filteredApplications.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-inbox fs-1 text-muted"></i>
              <p className="text-muted mt-3">No applications found</p>
            </div>
          ) : (
            filteredApplications.map((app) => (
              <div key={app.application_id} className="application-card">
                <div className="card-header-row">
                  <span className="header-label">College</span>
                  <span className="header-label">Name</span>
                  <span className="header-label">Gender</span>
                  <span className="header-label">School year</span>
                  <span className="header-label">Documents</span>
                </div>

                <div className="card-content-row">
                  <div className="avatar-section">
                    <div className="avatar-circle">
                      <i className="bi bi-person-fill"></i>
                    </div>
                    <span className="college-text">{app.college || 'CCS'}</span>
                  </div>

                  <div className="name-section">
                    <span className="name-text">{app.student_name || app.student_id}</span>
                  </div>

                  <div className="gender-section">
                    <span className="gender-text">{app.gender || 'Male'}</span>
                  </div>

                  <div className="year-section">
                    <span className="year-text">{app.school_year || '3rd year'}</span>
                  </div>

                  <div className="documents-section">
                    {app.cor_filename && (
                      <div className="document-icon" title={app.cor_filename}>
                        <i className="bi bi-file-earmark-text-fill"></i>
                      </div>
                    )}
                  </div>

                  <div className="actions-section">
                    <button
                      className="btn btn-accept"
                      disabled={processingId === app.application_id || app.status === 'APPROVED'}
                    >
                      {processingId === app.application_id ? (
                        <span className="spinner-border spinner-border-sm"></span>
                      ) : (
                        'Accept'
                      )}
                    </button>
                    <button
                      className="btn btn-decline"
                      disabled={processingId === app.application_id || app.status === 'REJECTED'}
                    >
                      Decline
                    </button>
                  </div>
                </div>

                {app.courses && app.courses.length > 0 && (
                  <div className="courses-section">
                    <strong className="courses-label">Courses:</strong>
                    <div className="courses-tags">
                      {app.courses.map((course, idx) => (
                        <span key={idx} className="course-tag">
                          {course}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {app.status && app.status !== 'PENDING' && (
                  <div className="status-badge-container">
                    <span className={`status-badge status-${app.status.toLowerCase()}`}>
                      {app.status}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}  
        </div>

        <div className="statistics-grid">
          {statsCards.map(card => (
            <BasicCard
              key={card.key}
              title={String(card.title)}
              description={card.description}
              style={{ width: "240px", height: "140px", ...card.style }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// mock data for testing
const getMockApplications = () => [
  {
    application_id: 1,
    student_id: 'STU001',
    student_name: 'Jazrel Xandrei Quinlob',
    college: 'CCS',
    gender: 'Male',
    school_year: '3rd year',
    date_submitted: '2025-01-15T10:30:00',
    status: 'PENDING',
    cor_filename: 'jazrel_cor.pdf',
    cor_filepath: '/uploads/cor/STU001_jazrel_cor.pdf',
    courses: ['CS101', 'CS102', 'MAT101']
  },
  {
    application_id: 2,
    student_id: 'STU002',
    student_name: 'John-Ronan Biera',
    college: 'CCS',
    gender: 'Male',
    school_year: '3rd year',
    date_submitted: '2025-01-14T14:20:00',
    status: 'PENDING',
    cor_filename: 'jazrel_cor.pdf',
    cor_filepath: '/uploads/cor/STU002_ronan_cor.pdf',
    courses: ['CSC151', 'MAT51']
  },
  {
    application_id: 3,
    student_id: 'STU003',
    student_name: 'Neil Anthony Balbutin',
    college: 'CCS',
    gender: 'Male',
    school_year: '3rd year',
    date_submitted: '2025-01-13T09:15:00',
    status: 'APPROVED',
    cor_filename: 'jarzel_cor.pdf',
    cor_filepath: '/uploads/cor/STU003_neil_cor.pdf',
    courses: ['MAT61', 'STT101']
  }
];

const getMockStatistics = () => ({
  total_applications: 67,
  total_tutors: 10,
  total_tutees: 69,
  total_courses: 15,
  active_sessions: 24
});

export default AdminDashboard;