import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './AdminDashboard.css';
import BasicCard from '../HomePageCard/HomePageCard';
import { Modal, Button, Form } from 'react-bootstrap';

const AdminDashboard = () => {
  const [statistics, setStatistics] = useState({
    total_applications: 0, pending: 0, total_tutors: 0, total_tutees: 0, total_courses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('applications');
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [appStatusFilter, setAppStatusFilter] = useState('all');
  const [appSearch, setAppSearch] = useState('');
  const [appSort, setAppSort] = useState('date_desc');
  const [processingId, setProcessingId] = useState(null);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [appeals, setAppeals] = useState([]);
  const [filteredAppeals, setFilteredAppeals] = useState([]);
  const [appealSearch, setAppealSearch] = useState('');
  const [appealStatusFilter, setAppealStatusFilter] = useState('all');
  const [appealSort, setAppealSort] = useState('date_desc');
  const [appealsLoading, setAppealsLoading] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionData, setActionData] = useState({ type: '', id: null, title: '', noteRequired: false, targetStatus: '' });
  const [actionNote, setActionNote] = useState('');
  
  const [showCorModal, setShowCorModal] = useState(false);
  const [selectedCorFile, setSelectedCorFile] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'appeals') fetchAppeals();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsResponse, statsResponse] = await Promise.all([
        fetch(`/admin/applications`),
        fetch(`/admin/statistics`)
      ]);
      const appsData = await appsResponse.json();
      const statsData = await statsResponse.json();
      setApplications(appsData.applications || []);
      setStatistics(statsData.statistics || {});
    } catch (err) {
      console.error(err);
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/tutor-applications/admin/users");
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch(err) { console.error(err); }
  };

  const fetchAppeals = async () => {
    try {
      setAppealsLoading(true);
      const res = await fetch("/api/appeals/all");
      const data = await res.json();
      if (data.success) setAppeals(data.appeals);
    } catch(err) { console.error(err); } 
    finally { setAppealsLoading(false); }
  };

  useEffect(() => {
    let res = [...applications];
    
    // Filter
    if (appStatusFilter !== 'all') res = res.filter(a => a.status === appStatusFilter);
    if (appSearch) res = res.filter(a => 
      a.student_name?.toLowerCase().includes(appSearch.toLowerCase()) || 
      a.student_id?.toLowerCase().includes(appSearch.toLowerCase())
    );

    // Sort
    res.sort((a, b) => {
      if (appSort === 'date_desc') return new Date(b.date_submitted) - new Date(a.date_submitted);
      if (appSort === 'date_asc') return new Date(a.date_submitted) - new Date(b.date_submitted);
      if (appSort === 'name_asc') return a.student_name.localeCompare(b.student_name);
      if (appSort === 'name_desc') return b.student_name.localeCompare(a.student_name);
      return 0;
    });

    setFilteredApplications(res);
  }, [applications, appStatusFilter, appSearch, appSort]);

  useEffect(() => {
    let res = [...users];

    // Filter
    if (userRoleFilter !== 'all') res = res.filter(u => u.role === userRoleFilter);
    if (userSearch) res = res.filter(u => 
        (u.first_name + ' ' + u.last_name).toLowerCase().includes(userSearch.toLowerCase()) || 
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    );

    // Default Sort (Name Ascending)
    res.sort((a, b) => {
      const nameA = (a.first_name + ' ' + a.last_name).toLowerCase();
      const nameB = (b.first_name + ' ' + b.last_name).toLowerCase();
      return nameA.localeCompare(nameB);
    });

    setFilteredUsers(res);
  }, [users, userRoleFilter, userSearch]);

  useEffect(() => {
    let res = [...appeals];

    // Filter
    if (appealStatusFilter !== 'all') res = res.filter(a => a.status === appealStatusFilter);
    if (appealSearch) res = res.filter(a => 
        (a.first_name + ' ' + a.last_name).toLowerCase().includes(appealSearch.toLowerCase())
    );

    // Sort
    res.sort((a, b) => {
      if (appealSort === 'date_desc') return new Date(b.date_submitted) - new Date(a.date_submitted);
      if (appealSort === 'date_asc') return new Date(a.date_submitted) - new Date(b.date_submitted);
      return 0;
    });

    setFilteredAppeals(res);
  }, [appeals, appealStatusFilter, appealSearch, appealSort]);


  const openActionModal = (type, item, targetStatus) => {
    let title = "";
    let noteRequired = false;

    if (type === 'APPLICATION') {
        title = `${targetStatus === 'APPROVED' ? 'Approve' : 'Reject'} Application for ${item.student_name}`;
    } else if (type === 'USER') {
        title = `${targetStatus === 'ACTIVE' ? 'Activate' : targetStatus === 'BANNED' ? 'Ban' : 'Restrict'} User: ${item.first_name}`;
        noteRequired = (targetStatus === 'BANNED' || targetStatus === 'PROBATION');
    } else if (type === 'APPEAL') {
        title = `${targetStatus === 'APPROVE' ? 'Approve' : 'Reject'} Appeal`;
    }

    setActionData({ type, id: item.application_id || item.google_id || item.appeal_id, targetStatus, title, noteRequired });
    setActionNote('');
    setShowActionModal(true);
  };

  const submitAction = async () => {
    if (actionData.noteRequired && !actionNote.trim()) {
        alert("Please provide a reason.");
        return;
    }

    try {
        if (actionData.type === 'APPLICATION') {
            setProcessingId(actionData.id);
            const endpoint = actionData.targetStatus === 'APPROVED' ? 'approve' : 'reject';
            await fetch(`/api/tutor-applications/admin/applications/${actionData.id}/${endpoint}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({})
            });
            fetchData();
        } 
        else if (actionData.type === 'USER') {
            await fetch("/api/tutor-applications/admin/users/status", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    google_id: actionData.id, 
                    status: actionData.targetStatus, 
                    note: actionData.noteRequired ? actionNote : "Account Reactivated" 
                })
            });
            fetchUsers();
        } 
        else if (actionData.type === 'APPEAL') {
            await fetch(`/api/appeals/resolve/${actionData.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: actionData.targetStatus })
            });
            fetchAppeals();
        }

        setShowActionModal(false);
    } catch (err) {
        console.error(err);
        alert("Action failed.");
    } finally {
        setProcessingId(null);
    }
  };

  const handleShowCor = (filename, isAppeal = false) => {
    const path = isAppeal ? `/uploads/appeals/${filename}` : `/uploads/cor/${filename}`;
    setSelectedCorFile(path);
    setShowCorModal(true);
  };

  const statsCards = [
    { key: "total_tutors", title: statistics.total_tutors || 0, description: "Number of Tutors" },
    { key: "total_applications", title: statistics.total_applications || 0, description: "Number of Applications" },
    { key: "total_tutees", title: statistics.total_tutees || 0, description: "Number of Tutees" },
    { key: "total_courses", title: statistics.total_courses || 0, description: "Total Courses" },
    { key: "active_sessions", title: statistics.active_sessions || 0, description: "Active Sessions" },
  ];

  const appCounts = {
    all: applications.length,
    PENDING: applications.filter(a => a.status === 'PENDING').length,
    APPROVED: applications.filter(a => a.status === 'APPROVED').length,
    REJECTED: applications.filter(a => a.status === 'REJECTED').length
  };
  
  const userCounts = {
      all: users.length,
      ACTIVE: users.filter(u => u.status === 'ACTIVE').length,
      BANNED: users.filter(u => u.status === 'BANNED').length,
      PROBATION: users.filter(u => u.status === 'PROBATION').length
  };

  const appealCounts = {
      all: appeals.length,
      PENDING: appeals.filter(a => a.status === 'PENDING').length,
      APPROVED: appeals.filter(a => a.status === 'APPROVED').length,
      REJECTED: appeals.filter(a => a.status === 'REJECTED').length
  };

  if (loading) return <div className="admin-container"><p className="p-5 text-center">Loading Dashboard...</p></div>;

  return (
    <div className={`admin-container ${showCorModal ? 'modal-open-custom' : ''}`}>
      <header className="admin-header">
         <div className="header-content">
          <div className="logo-section"><div className="logo-circle"><i className="bi bi-mortarboard-fill"></i></div></div>
          <nav className="header-nav">
            <a href="/" className="custom-nav-link">Home</a>
            <a href="/about" className="custom-nav-link">About</a>
            <a href="/events" className="custom-nav-link">Events</a>
            <a href="/messages" className="custom-nav-link">Messages</a>
            <a href="/reports" className="custom-nav-link">Reports</a>
          </nav>
          <div className="user-section"><div className="user-avatar"><i className="bi bi-person-circle"></i></div></div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="page-title"><h1>Admin Dashboard</h1></div>
        
        {error && (
          <div className="alert alert-warning alert-dismissible fade show custom-alert-style" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
          </div>
        )}

        <div className="statistics-grid-top">
          {statsCards.map(card => (
            <BasicCard key={card.key} title={String(card.title)} description={card.description} />
          ))}
        </div>

        <div className="admin-tabs-container">
            <button className={`admin-tab-btn ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>Tutor Applications</button>
            <button className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>User Management</button>
            <button className={`admin-tab-btn ${activeTab === 'appeals' ? 'active' : ''}`} onClick={() => setActiveTab('appeals')}>Appeals</button>
        </div>

        {activeTab === 'applications' && (
            <>
                <div className="status-filter-tabs mb-3">
                  {['all', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
                      <button key={status} className={`filter-tab ${appStatusFilter === status ? 'active' : ''}`} onClick={() => setAppStatusFilter(status)}>
                        {status.charAt(0).toUpperCase() + status.slice(1)} <span className="count-badge ms-2">{appCounts[status]}</span>
                      </button>
                  ))}
                </div>

                <div className="controls-section">
                  <div className="sort-dropdown">
                    <select className="form-select" value={appSort} onChange={(e) => setAppSort(e.target.value)}>
                      <option value="date_desc">Sort by: Newest First</option>
                      <option value="date_asc">Sort by: Oldest First</option>
                      <option value="name_asc">Sort by: Name (A-Z)</option>
                      <option value="name_desc">Sort by: Name (Z-A)</option>
                    </select>
                  </div>
                  <div className="search-box">
                    <input type="text" className="form-control" placeholder="Search applications..." value={appSearch} onChange={(e) => setAppSearch(e.target.value)} />
                    <button className="search-btn"><i className="bi bi-search"></i></button>
                  </div>
                </div>

                <div className="applications-list">
                  {filteredApplications.length === 0 ? (
                    <div className="empty-state"><i className="bi bi-inbox fs-1 text-muted"></i><p className="text-muted mt-3">No applications found</p></div>
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
                                <span className="college-text">{app.program || 'CCS'}</span>
                            </div>
                            <div className="name-section"><span className="name-text">{app.student_name}</span></div>
                            <div className="gender-section"><span className="gender-text">N/A</span></div>
                            <div className="year-section"><span className="year-text">N/A</span></div>
                            <div className="documents-section">
                                {app.cor_filename ? (
                                    <button className="btn btn-link p-0 document-icon" onClick={() => handleShowCor(app.cor_filename, false)}>
                                        <i className="bi bi-file-earmark-text-fill fs-4"></i>
                                    </button>
                                ) : (<div className="document-icon disabled"><i className="bi bi-file-earmark-x fs-4"></i></div>)}
                            </div>
                            <div className="actions-section">
                                <button className="btn btn-accept" onClick={() => openActionModal('APPLICATION', app, 'APPROVED')} 
                                    disabled={processingId === app.application_id || app.status !== 'PENDING'}>
                                    {processingId === app.application_id ? <span className="spinner-border spinner-border-sm"></span> : 'Accept'}
                                </button>
                                <button className="btn btn-decline" onClick={() => openActionModal('APPLICATION', app, 'REJECTED')}
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
        )}

        {activeTab === 'users' && (
            <div className="user-management-container">
                 <div className="status-filter-tabs mb-3">
                  {['all', 'ACTIVE', 'BANNED', 'PROBATION'].map(status => (
                      <button key={status} className={`filter-tab ${userStatusFilter === status ? 'active' : ''}`} onClick={() => setUserStatusFilter(status)}>
                        {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()} 
                        <span className="count-badge ms-2">{userCounts[status]}</span>
                      </button>
                  ))}
                </div>

                <div className="controls-section">
                    <div className="sort-dropdown">
                        <select className="form-select role-filter-select" value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}>
                            <option value="all">All Roles</option>
                            <option value="TUTEE">Tutee</option>
                            <option value="TUTOR">Tutor</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                    <div className="search-box">
                        <input type="text" className="form-control search-input-user" placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                        <button className="search-btn"><i className="bi bi-search"></i></button>
                    </div>
                </div>

                <div className="user-table-wrapper">
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Reports</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.google_id}>
                                    <td>
                                        <div className="fw-bold">{user.first_name} {user.last_name}</div>
                                        <div className="text-muted small">{user.email}</div>
                                    </td>
                                    <td><span className="badge bg-secondary">{user.role}</span></td>
                                    
                                    <td>
                                        <span 
                                            className={`status-badge status-${user.status?.toLowerCase() || 'active'} ${user.status_note ? 'has-note' : ''}`}
                                            title={user.status_note || "No notes"} 
                                        >
                                            {user.status || 'ACTIVE'}
                                        </span>
                                        {user.status_note && (
                                            <div className="text-muted status-note-text">
                                                "{user.status_note}"
                                            </div>
                                        )}
                                    </td>

                                    <td>
                                        {user.pending_reports > 0 ? 
                                            <span className="text-danger fw-bold">{user.pending_reports} 🚩</span> : 
                                            <span className="text-muted">0</span>
                                        }
                                    </td>
                                    <td>
                                        <div className="action-buttons-group">
                                            {user.status !== 'ACTIVE' && (
                                                <button className="btn-action btn-activate" onClick={() => openActionModal('USER', user, 'ACTIVE')}>Activate</button>
                                            )}
                                            {user.status !== 'PROBATION' && (
                                                <button className="btn-action btn-probation" onClick={() => openActionModal('USER', user, 'PROBATION')}>Probation</button>
                                            )}
                                            {user.status !== 'BANNED' && (
                                                <button className="btn-action btn-ban" onClick={() => openActionModal('USER', user, 'BANNED')}>Ban</button>
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
        
        {activeTab === 'appeals' && (
            <div className="user-management-container">
                 <div className="status-filter-tabs mb-3">
                  {['all', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
                      <button key={status} className={`filter-tab ${appealStatusFilter === status ? 'active' : ''}`} onClick={() => setAppealStatusFilter(status)}>
                        {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()} 
                        <span className="count-badge ms-2">{appealCounts[status]}</span>
                      </button>
                  ))}
                </div>

                <div className="controls-section">
                  <div className="sort-dropdown">
                    <select className="form-select" value={appealSort} onChange={(e) => setAppealSort(e.target.value)}>
                      <option value="date_desc">Sort by: Newest First</option>
                      <option value="date_asc">Sort by: Oldest First</option>
                    </select>
                  </div>
                  <div className="search-box">
                    <input type="text" className="form-control search-input-appeal" placeholder="Search appeals..." value={appealSearch} onChange={(e) => setAppealSearch(e.target.value)} />
                    <button className="search-btn"><i className="bi bi-search"></i></button>
                  </div>
                </div>

                <div className="user-table-wrapper">
                    {appealsLoading ? <p className="text-center py-5">Loading Appeals...</p> : (
                        <table className="user-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Appeal Message</th>
                                    <th>Evidence</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAppeals.map((appeal) => (
                                    <tr key={appeal.appeal_id}>
                                        <td>
                                            <div className="fw-bold">{appeal.first_name} {appeal.last_name}</div>
                                            <div className="text-muted small">{appeal.id_number}</div>
                                        </td>
                                        <td className="appeal-text-cell">
                                            <div className="appeal-message-content">{appeal.appeal_text}</div>
                                            <div className="appeal-date">{appeal.date_submitted}</div>
                                        </td>
                                        <td>
                                            {appeal.files && appeal.files.length > 0 ? (
                                                <div className="d-flex flex-wrap gap-1">
                                                    {appeal.files.map((file, idx) => (
                                                        <button key={idx} className="btn btn-outline-secondary evidence-btn" onClick={() => handleShowCor(file, true)}>
                                                            File {idx + 1}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="no-evidence-text">None</span>
                                            )}
                                        </td>
                                        <td><span className={`status-badge status-${appeal.status.toLowerCase()}`}>{appeal.status}</span></td>
                                        <td>
                                            {appeal.status === 'PENDING' && (
                                                <div className="action-buttons-group">
                                                    <button className="btn-action btn-activate" onClick={() => openActionModal('APPEAL', appeal, 'APPROVE')}>Approve</button>
                                                    <button className="btn-action btn-ban" onClick={() => openActionModal('APPEAL', appeal, 'REJECT')}>Reject</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        )}
      </div>

      <Modal show={showActionModal} onHide={() => setShowActionModal(false)} centered>
        <Modal.Header closeButton>
            <Modal.Title>{actionData.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            {actionData.type === 'USER' && actionData.targetStatus === 'ACTIVE' && (
                <p>Are you sure you want to reactivate this user account? They will regain access immediately.</p>
            )}
            
            {actionData.type === 'APPEAL' && (
                <p>Are you sure you want to <strong>{actionData.targetStatus}</strong> this appeal? {actionData.targetStatus === 'APPROVE' ? 'The user will be automatically unbanned.' : ''}</p>
            )}

            {actionData.type === 'APPLICATION' && (
                <p>Are you sure you want to <strong>{actionData.targetStatus}</strong> this Tutor Application?</p>
            )}

            {actionData.noteRequired && (
                <Form.Group>
                    <Form.Label>Reason / Note:</Form.Label>
                    <Form.Control 
                        as="textarea" 
                        rows={3} 
                        value={actionNote} 
                        onChange={(e) => setActionNote(e.target.value)} 
                        placeholder="Enter the reason for this action (Required)..."
                    />
                </Form.Group>
            )}
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowActionModal(false)}>Cancel</Button>
            <Button 
                variant={actionData.targetStatus === 'REJECTED' || actionData.targetStatus === 'BANNED' || actionData.targetStatus === 'REJECT' ? 'danger' : 'success'} 
                onClick={submitAction}
            >
                Confirm
            </Button>
        </Modal.Footer>
      </Modal>

      {showCorModal && (
        <div className="modal fade show custom-dark-modal">
          <div className="modal-dialog modal-dialog-centered custom-large-modal">
            <div className="modal-content custom-dark-content">
              <div className="modal-body p-0 custom-dark-body">
                {selectedCorFile ? (
                    selectedCorFile.toLowerCase().endsWith('.pdf') ? (
                        <iframe src={selectedCorFile} title="Document Preview" className="cor-frame"></iframe>
                    ) : (
                        <img src={selectedCorFile} alt="Document Preview" className="cor-image" />
                    )
                ) : (
                    <div className="text-center text-light p-5">No Document available</div>
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