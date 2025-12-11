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
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [processingId, setProcessingId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showCorModal, setShowCorModal] = useState(false);
  const [selectedCorFile, setSelectedCorFile] = useState(null);



  useEffect(() => {
    fetchData();
  }, []);

    useEffect(() => {
    applyFiltersAndSort();
  }, [applications, searchQuery, sortBy, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [appsResponse, statsResponse] = await Promise.all([
        fetch(`/api/tutor-applications/admin/applications`),
        fetch(`/api/tutor-applications/admin/statistics`)
      ]);

      if (!appsResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const appsData = await appsResponse.json();
      const statsData = await statsResponse.json();

      if (appsData.applications && Array.isArray(appsData.applications)) {
        setApplications(appsData.applications);
      } else {
        setApplications([]);
      }

      if (statsData.statistics) {
        setStatistics(statsData.statistics);
      } else {
        setStatistics({
          total_applications: 0,
          pending: 0,
          total_tutors: 0,
          total_tutees: 0,
          total_courses: 0,
          active_sessions: 0
        });
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data from server.');
      setApplications([]);
      setStatistics({
        total_applications: 0,
        pending: 0,
        total_tutors: 0,
        total_tutees: 0,
        total_courses: 0,
        active_sessions: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = (applicationId, newStatus) => {
    const app = applications.find(a => a.application_id === applicationId);
    if (!app) return;

    setSelectedApplication(app);
    setConfirmAction(newStatus);
    setShowConfirm(true);
  };

  const confirmActionHandler = async (applicationId, action) => {
  try {
    setProcessingId(applicationId);

    const endpoint =
      action === 'APPROVED'
        ? `/api/tutor-applications/admin/applications/${applicationId}/approve`
        : `/api/tutor-applications/admin/applications/${applicationId}/reject`;

    console.log("Sending request to:", endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const data = await response.json();
    console.log("Response data:", data);

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to update status');
    }

    // Update local list
    setApplications(prev =>
      prev.map(app =>
        app.application_id === applicationId
          ? { ...app, status: data.data.status }
          : app
      )
    );

    setShowConfirm(false);
    setSelectedApplication(null);
    setConfirmAction(null);
    fetchData();

    alert(`Application ${action === 'APPROVED' ? 'approved' : 'rejected'} successfully.`);
  } catch (err) {
    console.error('Error updating application:', err);
    alert(err.message);
  } finally {
    setProcessingId(null);
  }
};

  const handleShowCor = (corFilename) => {
    setSelectedCorFile(`/uploads/cor/${corFilename}`);
    setShowCorModal(true);
  };

  const applyFiltersAndSort = () => {
    let filtered = [...applications];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

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
      case 'status_pending':
        filtered.sort((a, b) => {
          if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
          if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
          return new Date(b.date_submitted) - new Date(a.date_submitted);
        });
        break;
      case 'status_approved':
        filtered.sort((a, b) => {
          if (a.status === 'APPROVED' && b.status !== 'APPROVED') return -1;
          if (a.status !== 'APPROVED' && b.status === 'APPROVED') return 1;
          return new Date(b.date_submitted) - new Date(a.date_submitted);
        });
        break;
      case 'status_rejected':
        filtered.sort((a, b) => {
          if (a.status === 'REJECTED' && b.status !== 'REJECTED') return -1;
          if (a.status !== 'REJECTED' && b.status === 'REJECTED') return 1;
          return new Date(b.date_submitted) - new Date(a.date_submitted);
        });
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

  const statusCounts = {
    all: applications.length,
    PENDING: applications.filter(app => app.status === 'PENDING').length,
    APPROVED: applications.filter(app => app.status === 'APPROVED').length,
    REJECTED: applications.filter(app => app.status === 'REJECTED').length
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
    <div className={`admin-container ${showCorModal ? 'modal-open-custom' : ''}`}>
      <header className="admin-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-circle">
              <i className="bi bi-mortarboard-fill"></i>
            </div>
          </div>
          <nav className="header-nav">
            <a href="/" className="custom-nav-link">Home</a>
            <a href="/about" className="custom-nav-link">About</a>
            <a href="/events" className="custom-nav-link">Events</a>
            <a href="/messages" className="custom-nav-link">Messages</a>
            <a href="/reports" className="custom-nav-link">Reports</a>
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
          <div className="alert alert-warning alert-dismissible fade show custom-alert-style" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
          </div>
        )}

        {/* Status Filter Tabs */}
        <div className="status-filter-tabs mb-3">
          <button
            className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All <span className="count-badge">{statusCounts.all}</span>
          </button>
          <button
            className={`filter-tab ${statusFilter === 'PENDING' ? 'active' : ''}`}
            onClick={() => setStatusFilter('PENDING')}
          >
            Pending <span className="count-badge badge-warning">{statusCounts.PENDING}</span>
          </button>
          <button
            className={`filter-tab ${statusFilter === 'APPROVED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('APPROVED')}
          >
            Approved <span className="count-badge badge-success">{statusCounts.APPROVED}</span>
          </button>
          <button
            className={`filter-tab ${statusFilter === 'REJECTED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('REJECTED')}
          >
            Rejected <span className="count-badge badge-danger">{statusCounts.REJECTED}</span>
          </button>
        </div>

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
              <option value="status_pending">Sort by: Pending First</option>
              <option value="status_approved">Sort by: Approved First</option>
              <option value="status_rejected">Sort by: Rejected First</option>
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
              <p className="text-muted mt-3">
                {statusFilter !== 'all' 
                  ? `No ${statusFilter.toLowerCase()} applications found`
                  : 'No applications found'}
              </p>
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
                    {app.cor_filename ? (
                      <button
                        type="button"
                        className="btn btn-link p-0 document-icon"
                        onClick={() => handleShowCor(app.cor_filename)}
                        title={app.cor_filename}
                      >
                        <i className="bi bi-file-earmark-text-fill fs-4"></i>
                      </button>
                    ) : (
                      <div className="document-icon disabled" title="No COR uploaded">
                        <i className="bi bi-file-earmark-x fs-4"></i>
                      </div>
                    )}
                  </div>
                  
                  <div className="actions-section">
                    <button
                      className="btn btn-accept"
                      onClick={() => handleUpdateStatus(app.application_id, 'APPROVED')}
                      disabled={processingId === app.application_id || app.status === 'REJECTED' || app.status === 'APPROVED'}
                    >
                      {processingId === app.application_id ? (
                        <span className="spinner-border spinner-border-sm"></span>
                      ) : (
                        'Accept'
                      )}
                    </button>
                    <button
                      className="btn btn-decline"
                      disabled={processingId === app.application_id || app.status === 'REJECTED' || app.status === 'APPROVED'}
                      onClick={() => handleUpdateStatus(app.application_id, 'REJECTED')}
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
      
      {showConfirm && selectedApplication && (
        <div className="modal fade show" style={{ display: 'block' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px' }}>
              <div className="modal-header bg-primary text-white" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                <h5 className="modal-title">
                  {confirmAction === 'APPROVED' ? 'Approve Application' : 'Reject Application'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowConfirm(false)}></button>
              </div>

              <div className="modal-body text-center p-4">
                <p className="fs-5 text-muted mb-4">
                  Are you sure you want to 
                  <strong> {confirmAction === 'APPROVED' ? 'approve' : 'reject'} </strong>
                  this tutor application?
                </p>

                <div className="alert alert-light text-start border-0" style={{ background: '#f8f9fa' }}>
                  <strong>{selectedApplication.student_name || selectedApplication.student_id}</strong><br />
                  Program: {selectedApplication.program || 'N/A'}<br />
                  Courses: {selectedApplication.courses?.join(', ') || 'None'}
                </div>
              </div>

              <div className="modal-footer border-0 d-flex justify-content-center gap-3 pb-4">
                <button
                  className="btn btn-secondary px-4"
                  onClick={() => setShowConfirm(false)}
                >
                  Cancel
                </button>

                <button
                  className={`btn px-4 ${confirmAction === 'APPROVED' ? 'btn-success' : 'btn-danger'}`}
                  onClick={() => confirmActionHandler(selectedApplication.application_id, confirmAction)}
                  disabled={processingId === selectedApplication.application_id}
                >
                  {processingId === selectedApplication.application_id ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    confirmAction === 'APPROVED' ? 'Approve' : 'Reject'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCorModal && (
        <>
          <div
            className="modal fade show"
            style={{
              display: 'block',
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
            }}
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="modal-dialog modal-dialog-centered"
              role="document"
              style={{
                maxWidth: '800px',
                width: '800px',
                height: '600px',
              }}
            >
              <div
                className="modal-content border-0 shadow-lg"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '10px',
                  backgroundColor: '#1a1a1a',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                <div
                  className="modal-body d-flex align-items-center justify-content-center p-0"
                  style={{
                    flex: 1,
                    backgroundColor: '#000',
                  }}
                >
                  {selectedCorFile ? (
                    selectedCorFile.toLowerCase().endsWith('.pdf') ? (
                      <iframe
                        src={selectedCorFile}
                        title="COR PDF"
                        style={{
                          width: '100%',
                          height: '100%',
                          border: 'none',
                          backgroundColor: '#1a1a1a',
                        }}
                      ></iframe>
                    ) : (
                      <img
                        src={selectedCorFile}
                        alt="COR Document"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                          display: 'block',
                          margin: '0 auto',
                        }}
                      />
                    )
                  ) : (
                    <div className="text-center text-light">No COR available</div>
                  )}
                </div>

                <div
                  className="py-3 text-center border-0"
                  style={{
                    background: '#1a1a1a',
                  }}
                >
                  <button
                    className="btn btn-light px-4"
                    onClick={() => setShowCorModal(false)}
                    style={{
                      fontWeight: '500',
                      borderRadius: '8px',
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;