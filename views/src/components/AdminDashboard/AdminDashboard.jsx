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
  const [activeTab, setActiveTab] = useState('applications'); 
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [applications, searchQuery, sortBy, statusFilter]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [appsResponse, statsResponse] = await Promise.all([
        fetch(`/admin/applications`),
        fetch(`/admin/statistics`)
      ]);

      if (!appsResponse.ok || !statsResponse.ok) throw new Error('Failed to fetch data');

      const appsData = await appsResponse.json();
      const statsData = await statsResponse.json();

      setApplications(appsData.applications || []);
      setStatistics(statsData.statistics || {});
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data from server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/tutor-applications/admin/users");
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch users.");
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
      const endpoint = action === 'APPROVED'
        ? `/admin/applications/${applicationId}/approve`
        : `/admin/applications/${applicationId}/reject`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Failed to update status');

      setApplications(prev =>
        prev.map(app => app.application_id === applicationId ? { ...app, status: data.data.status } : app)
      );

      setShowConfirm(false);
      setSelectedApplication(null);
      setConfirmAction(null);
      fetchData();
      alert(`Application ${action === 'APPROVED' ? 'approved' : 'rejected'} successfully.`);
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const changeUserStatus = async (google_id, newStatus) => {
    if(!window.confirm(`Are you sure you want to set this user to ${newStatus}?`)) return;
    
    try {
        const res = await fetch("/api/tutor-applications/admin/users/status", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ google_id, status: newStatus })
        });
        if(res.ok) fetchUsers(); 
    } catch(err) {
        console.error(err);
    }
  };

  const handleShowCor = (corFilename) => {
    setSelectedCorFile(`/uploads/cor/${corFilename}`);
    setShowCorModal(true);
  };

  const applyFiltersAndSort = () => {
    let filtered = [...applications];
    if (statusFilter !== 'all') filtered = filtered.filter(app => app.status === statusFilter);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        app.student_id?.toLowerCase().includes(query) ||
        app.student_name?.toLowerCase().includes(query) ||
        app.college?.toLowerCase().includes(query) ||
        (app.courses && app.courses.some(c => c.toLowerCase().includes(query)))
      );
    }
    setFilteredApplications(filtered);
  };

  const statusCounts = {
    all: applications.length,
    PENDING: applications.filter(app => app.status === 'PENDING').length,
    APPROVED: applications.filter(app => app.status === 'APPROVED').length,
    REJECTED: applications.filter(app => app.status === 'REJECTED').length
  };

  const statsCards = [
    { key: "total_tutors", title: statistics.total_tutors || 0, description: "Number of Tutors" },
    { key: "total_applications", title: statistics.total_applications || 0, description: "Number of Applications" },
    { key: "total_tutees", title: statistics.total_tutees || 0, description: "Number of Tutees" },
    { key: "total_courses", title: statistics.total_courses || 0, description: "Total Courses" },
    { key: "active_sessions", title: statistics.active_sessions || 0, description: "Active Sessions" },
  ];

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading-state">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading</span>
          </div>
          <p className="mt-3">Loading dashboard</p>
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

        <div className="statistics-grid-top">
          {statsCards.map(card => (
            <BasicCard
              key={card.key}
              title={String(card.title)}
              description={card.description}
              style={{ width: "100%", height: "120px", backgroundColor: "#fff" }}
            />
          ))}
        </div>

        <div className="admin-tabs-container">
            <button 
                className={`admin-tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
                onClick={() => setActiveTab('applications')}
            >
                Tutor Applications
            </button>
            <button 
                className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
            >
                User Management
            </button>
        </div>

        {activeTab === 'applications' ? (
            <>
                <div className="status-filter-tabs mb-3">
                  <button className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>
                    All <span className="count-badge">{statusCounts.all}</span>
                  </button>
                  <button className={`filter-tab ${statusFilter === 'PENDING' ? 'active' : ''}`} onClick={() => setStatusFilter('PENDING')}>
                    Pending <span className="count-badge badge-warning">{statusCounts.PENDING}</span>
                  </button>
                  <button className={`filter-tab ${statusFilter === 'APPROVED' ? 'active' : ''}`} onClick={() => setStatusFilter('APPROVED')}>
                    Approved <span className="count-badge badge-success">{statusCounts.APPROVED}</span>
                  </button>
                  <button className={`filter-tab ${statusFilter === 'REJECTED' ? 'active' : ''}`} onClick={() => setStatusFilter('REJECTED')}>
                    Rejected <span className="count-badge badge-danger">{statusCounts.REJECTED}</span>
                  </button>
                </div>

                <div className="controls-section">
                  <div className="sort-dropdown">
                    <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
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
                    <input type="text" className="form-control" placeholder="Search applications..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    <button className="search-btn"><i className="bi bi-search"></i></button>
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
                                <div className="avatar-circle"><i className="bi bi-person-fill"></i></div>
                                <span className="college-text">{app.college || 'CCS'}</span>
                            </div>
                            <div className="name-section"><span className="name-text">{app.student_name || app.student_id}</span></div>
                            <div className="gender-section"><span className="gender-text">{app.gender || 'Male'}</span></div>
                            <div className="year-section"><span className="year-text">{app.school_year || '3rd year'}</span></div>
                            <div className="documents-section">
                                {app.cor_filename ? (
                                <button type="button" className="btn btn-link p-0 document-icon" onClick={() => handleShowCor(app.cor_filename)}>
                                    <i className="bi bi-file-earmark-text-fill fs-4"></i>
                                </button>
                                ) : (
                                <div className="document-icon disabled"><i className="bi bi-file-earmark-x fs-4"></i></div>
                                )}
                            </div>
                            <div className="actions-section">
                                <button className="btn btn-accept" onClick={() => handleUpdateStatus(app.application_id, 'APPROVED')} 
                                    disabled={processingId === app.application_id || app.status !== 'PENDING'}>
                                    {processingId === app.application_id ? <span className="spinner-border spinner-border-sm"></span> : 'Accept'}
                                </button>
                                <button className="btn btn-decline" onClick={() => handleUpdateStatus(app.application_id, 'REJECTED')}
                                    disabled={processingId === app.application_id || app.status !== 'PENDING'}>
                                    Decline
                                </button>
                            </div>
                        </div>
                        {app.status && app.status !== 'PENDING' && (
                            <div className="status-badge-container">
                                <span className={`status-badge status-${app.status.toLowerCase()}`}>{app.status}</span>
                            </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
            </>
        ) : (
            <div className="user-management-container">
                <div className="user-table-wrapper">
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Pending Reports</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.google_id}>
                                    <td>
                                        <div className="fw-bold">{user.first_name} {user.last_name}</div>
                                        <div className="text-muted small">{user.email}</div>
                                    </td>
                                    <td><span className="badge bg-secondary">{user.role}</span></td>
                                    <td>
                                        <span className={`status-badge status-${user.status?.toLowerCase() || 'active'}`}>
                                            {user.status || 'ACTIVE'}
                                        </span>
                                    </td>
                                    <td>
                                        {user.pending_reports > 0 ? 
                                            <span className="text-danger fw-bold">{user.pending_reports} </span> : 
                                            <span className="text-muted">None</span>
                                        }
                                    </td>
                                    <td>
                                        <div className="action-buttons-group">
                                            {user.status !== 'ACTIVE' && (
                                                <button className="btn-action btn-active" onClick={() => changeUserStatus(user.google_id, 'ACTIVE')}>Active</button>
                                            )}
                                            {user.status !== 'PROBATION' && (
                                                <button className="btn-action btn-probation" onClick={() => changeUserStatus(user.google_id, 'PROBATION')}>Probation</button>
                                            )}
                                            {user.status !== 'BANNED' && (
                                                <button className="btn-action btn-ban" onClick={() => changeUserStatus(user.google_id, 'BANNED')}>Ban</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>
      
      {showConfirm && selectedApplication && (
        <div className="modal fade show custom-modal-overlay">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content custom-modal-content">
              <div className="modal-header bg-primary text-white custom-modal-header">
                <h5 className="modal-title">{confirmAction === 'APPROVED' ? 'Approve Application' : 'Reject Application'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowConfirm(false)}></button>
              </div>
              <div className="modal-body text-center p-4">
                <p className="fs-5 text-muted mb-4">Are you sure you want to <strong>{confirmAction === 'APPROVED' ? 'approve' : 'reject'}</strong> this application?</p>
                <div className="alert alert-light text-start border-0 custom-alert-bg">
                  <strong>{selectedApplication.student_name}</strong><br />
                  Program: {selectedApplication.program || 'N/A'}
                </div>
              </div>
              <div className="modal-footer border-0 d-flex justify-content-center gap-3 pb-4">
                <button className="btn btn-secondary px-4" onClick={() => setShowConfirm(false)}>Cancel</button>
                <button className={`btn px-4 ${confirmAction === 'APPROVED' ? 'btn-success' : 'btn-danger'}`} onClick={() => confirmActionHandler(selectedApplication.application_id, confirmAction)}>
                  {confirmAction === 'APPROVED' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCorModal && (
        <div className="modal fade show custom-dark-modal">
          <div className="modal-dialog modal-dialog-centered custom-large-modal">
            <div className="modal-content custom-dark-content">
              <div className="modal-body p-0 custom-dark-body">
                {selectedCorFile ? (
                    selectedCorFile.toLowerCase().endsWith('.pdf') ? (
                        <iframe src={selectedCorFile} title="COR PDF" className="cor-frame"></iframe>
                    ) : (
                        <img src={selectedCorFile} alt="COR Document" className="cor-image" />
                    )
                ) : (
                    <div className="text-center text-light p-5">No COR available</div>
                )}
              </div>
              <div className="custom-dark-footer">
                <button className="btn btn-light px-4" onClick={() => setShowCorModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;