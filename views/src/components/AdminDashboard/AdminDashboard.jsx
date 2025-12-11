import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './AdminDashboard.css';
import BasicCard from '../HomePageCard/HomePageCard';
import { Modal, Button, Form, Toast, ToastContainer } from 'react-bootstrap';

const AdminDashboard = () => {
  const [statistics, setStatistics] = useState({
    total_applications: 0, pending: 0, total_tutors: 0, total_tutees: 0, total_courses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeTab, setActiveTab] = useState('applications');

  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [appeals, setAppeals] = useState([]);
  
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredAppeals, setFilteredAppeals] = useState([]);

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  
  const [appCollegeFilter, setAppCollegeFilter] = useState('all');
  const [appYearFilter, setAppYearFilter] = useState('all');
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const [showActionModal, setShowActionModal] = useState(false);
  const [actionData, setActionData] = useState({ type: '', id: null, title: '', noteRequired: false, targetStatus: '', files: [] });
  const [actionNote, setActionNote] = useState('');
  const [showCorModal, setShowCorModal] = useState(false);
  const [selectedCorFile, setSelectedCorFile] = useState(null);
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  
  const [appealsLoading, setAppealsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'appeals') fetchAppeals();
    
    setStatusFilter('all');
    setSearchQuery('');
    setSortBy(activeTab === 'users' ? 'name_asc' : 'date_desc');
    setAppCollegeFilter('all');
    setAppYearFilter('all');
    setUserRoleFilter('all');
    setCurrentPage(1);
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsResponse, statsResponse] = await Promise.all([
        fetch(`/api/tutor-applications/admin/applications`),
        fetch(`/api/tutor-applications/admin/statistics`)
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
    let data = [];
    let setData = null;

    if (activeTab === 'applications') { data = [...applications]; setData = setFilteredApplications; }
    else if (activeTab === 'users') { data = [...users]; setData = setFilteredUsers; }
    else if (activeTab === 'appeals') { data = [...appeals]; setData = setFilteredAppeals; }

    if (statusFilter !== 'all') {
        data = data.filter(item => item.status === statusFilter);
    }

    if (activeTab === 'applications') {
        if (appCollegeFilter !== 'all') data = data.filter(app => (app.program || '').toUpperCase() === appCollegeFilter);
        if (appYearFilter !== 'all') data = data.filter(app => (app.school_year || '').toString().includes(appYearFilter));
    }
    
    if (activeTab === 'users') {
        if (userRoleFilter !== 'all') data = data.filter(u => (u.role || '').toUpperCase() === userRoleFilter);
    }

    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        data = data.filter(item => {
            const name = (item.student_name || item.first_name + ' ' + item.last_name || '').toLowerCase();
            const id = (item.student_id || item.email || item.id_number || '').toLowerCase();
            return name.includes(query) || id.includes(query);
        });
    }

    data.sort((a, b) => {
        const dateA = new Date(a.date_submitted || a.last_login || 0);
        const dateB = new Date(b.date_submitted || b.last_login || 0);
        const nameA = (a.student_name || a.first_name || '').toLowerCase();
        const nameB = (b.student_name || b.first_name || '').toLowerCase();

        if (sortBy === 'date_desc') return dateB - dateA;
        if (sortBy === 'date_asc') return dateA - dateB;
        if (sortBy === 'name_asc') return nameA.localeCompare(nameB);
        if (sortBy === 'name_desc') return nameB.localeCompare(nameA);

        if (sortBy === 'college_asc') return (a.program || '').localeCompare(b.program || '');
        if (sortBy === 'college_desc') return (b.program || '').localeCompare(a.program || '');
        if (sortBy === 'year_asc') return parseInt(a.school_year || 0) - parseInt(b.school_year || 0);
        if (sortBy === 'year_desc') return parseInt(b.school_year || 0) - parseInt(a.school_year || 0);

        if (sortBy === 'role_asc') return (a.role || '').localeCompare(b.role || '');
        if (sortBy === 'role_desc') return (b.role || '').localeCompare(a.role || '');

        return 0;
    });

    if(setData) setData(data);
    setCurrentPage(1); 
  }, [activeTab, applications, users, appeals, statusFilter, searchQuery, sortBy, appCollegeFilter, appYearFilter, userRoleFilter]);

  const getPaginatedData = (data) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  const renderPagination = (totalItems) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalItems === 0) return null;

    return (
        <div className="pagination-container">
            <span className="page-info">Page {currentPage} of {totalPages || 1}</span>
            <div className="d-flex align-items-center gap-2">
                <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Previous</button>
                <button className="pagination-btn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Next</button>
            </div>
            <div className="d-flex align-items-center gap-2 ms-3">
                <span className="small text-muted">Rows:</span>
                <select className="rows-per-page-select" value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                    <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                </select>
            </div>
        </div>
    );
  };

  const handleUpdateStatus = (appId, newStatus) => {
    const app = applications.find(a => a.application_id === appId);
    if (!app) return;
    setSelectedApplication(app);
    setConfirmAction(newStatus);
    setShowConfirm(true);
  };

  const confirmActionHandler = async (appId, action) => {
    try {
      setProcessingId(appId);
      const endpoint = action === 'APPROVED' ? 'approve' : 'reject';
      const res = await fetch(`/api/tutor-applications/admin/applications/${appId}/${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({})
      });
      if (res.ok) { fetchData(); setShowConfirm(false); }
    } catch (err) { console.error(err); } 
    finally { setProcessingId(null); }
  };

  const openActionModal = (type, item, targetStatus) => {
    let title = "", noteRequired = false, files = [], selectedId = null;

    if (type === 'USER') {
        selectedId = item.google_id;
        const name = item.first_name ? `${item.first_name} ${item.last_name}` : item.email;
        title = `${targetStatus === 'ACTIVE' ? 'Activate' : targetStatus} User: ${name}`;
        noteRequired = ['BANNED', 'PROBATION'].includes(targetStatus);
    } else if (type === 'APPEAL') {
        selectedId = item.appeal_id;
        title = `${targetStatus === 'APPROVE' ? 'Approve' : 'Reject'} Appeal`;
        files = item.files || [];
    }

    setActionData({ type, id: selectedId, targetStatus, title, noteRequired, files });
    setActionNote('');
    setShowActionModal(true);
  };

  const submitAction = async () => {
    if (actionData.noteRequired && !actionNote.trim()) {
        setToastMessage("A reason is required."); setShowToast(true); return;
    }
    try {
        if (actionData.type === 'USER') {
            await fetch("/api/tutor-applications/admin/users/status", {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ google_id: actionData.id, status: actionData.targetStatus, note: actionData.noteRequired ? actionNote : "Account Reactivated" })
            });
            fetchUsers();
        } else if (actionData.type === 'APPEAL') {
            await fetch(`/api/appeals/resolve/${actionData.id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: actionData.targetStatus })
            });
            fetchAppeals();
        }
        setShowActionModal(false);
    } catch (err) { console.error(err); alert("Action failed."); }
  };

  const handleShowCor = (url, isAppeal = false) => {
    const path = url.startsWith('http') ? url : (isAppeal ? `/uploads/appeals/${url}` : `/uploads/cor/${url}`);
    setSelectedCorFile(path);
    setShowCorModal(true);
  };

  const formatStatusLabel = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  const getCounts = (tab) => {
      let data = tab === 'applications' ? applications : (tab === 'users' ? users : appeals);
      const counts = { all: data.length };
      data.forEach(item => { counts[item.status] = (counts[item.status] || 0) + 1; });
      return counts;
  };
  const counts = getCounts(activeTab);

  if (loading) return <div className="admin-container"><p className="p-5 text-center">Loading...</p></div>;

  return (
    <div className={`admin-container ${showCorModal ? 'modal-open-custom' : ''}`}>
      <header className="admin-header">
        <div className="header-content">
          <div className="logo-section"><div className="logo-circle"><i className="bi bi-mortarboard-fill"></i></div></div>
          <nav className="header-nav">
            {['Home','About','Events','Messages','Reports'].map(l => <a key={l} href={`/${l.toLowerCase()}`} className="custom-nav-link">{l}</a>)}
          </nav>
          <div className="user-section"><div className="user-avatar"><i className="bi bi-person-circle"></i></div></div>
        </div>
      </header>

      <ToastContainer position="top-end" className="p-3" style={{zIndex: 3000}}>
        <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide bg="danger">
            <Toast.Body className="text-white">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>

      <div className="dashboard-content">
        <div className="page-title"><h1>Admin Dashboard</h1></div>
        {error && <div className="alert alert-warning alert-dismissible fade show custom-alert-style">{error}<button className="btn-close" onClick={()=>setError(null)}></button></div>}

        <div className="statistics-grid-top">
          {[{k:"total_tutors",t:statistics.total_tutors,d:"Tutors"}, {k:"total_applications",t:statistics.total_applications,d:"Applications"}, {k:"total_tutees",t:statistics.total_tutees,d:"Tutees"}, {k:"total_courses",t:statistics.total_courses,d:"Courses"}, {k:"active_sessions",t:0,d:"Sessions"}].map(c => (
            <BasicCard key={c.k} title={String(c.t)} description={c.d} />
          ))}
        </div>

        <div className="admin-tabs-container">
            <button className={`admin-tab-btn ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>Tutor Applications</button>
            <button className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>User Management</button>
            <button className={`admin-tab-btn ${activeTab === 'appeals' ? 'active' : ''}`} onClick={() => setActiveTab('appeals')}>Appeals</button>
        </div>

        <div className="status-filter-tabs">
             <button className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>All <span className="count-badge ms-2">{counts.all}</span></button>
             {(activeTab === 'applications' ? ['PENDING','APPROVED','REJECTED'] : activeTab === 'users' ? ['ACTIVE','BANNED','PROBATION'] : ['PENDING','APPROVED','REJECTED']).map(s => (
                 <button key={s} className={`filter-tab ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>{formatStatusLabel(s)} <span className="count-badge ms-2">{counts[s]||0}</span></button>
             ))}
        </div>

        <div className="controls-section">
            <div className="sort-dropdown">
                <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="date_desc">Newest First</option>
                    <option value="date_asc">Oldest First</option>
                    <option value="name_asc">Name (A-Z)</option>
                    <option value="name_desc">Name (Z-A)</option>
                    
                    {activeTab === 'applications' && <><option value="college_asc">College (A-Z)</option><option value="college_desc">College (Z-A)</option><option value="year_asc">Year (Low-High)</option><option value="year_desc">Year (High-Low)</option></>}
                    {activeTab === 'users' && <><option value="role_asc">Role (A-Z)</option><option value="role_desc">Role (Z-A)</option></>}
                </select>
            </div>
            
            {activeTab === 'applications' && (
                <>
                <select className="form-select filter-dropdown" value={appCollegeFilter} onChange={(e) => setAppCollegeFilter(e.target.value)}>
                    <option value="all">All Colleges</option><option value="CCS">CCS</option><option value="COE">COE</option><option value="CAS">CAS</option><option value="CBA">CBA</option><option value="CON">CON</option>
                </select>
                <select className="form-select filter-dropdown" value={appYearFilter} onChange={(e) => setAppYearFilter(e.target.value)}>
                    <option value="all">All Years</option><option value="1">1st Year</option><option value="2">2nd Year</option><option value="3">3rd Year</option><option value="4">4th Year</option>
                </select>
                </>
            )}

            {activeTab === 'users' && (
                <select className="form-select filter-dropdown" value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}>
                    <option value="all">All Roles</option>
                    <option value="TUTEE">Tutee</option>
                    <option value="TUTOR">Tutor</option>
                </select>
            )}

            <div className="search-box">
                <input type="text" className="form-control" placeholder={`Search ${activeTab}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <button className="search-btn"><i className="bi bi-search"></i></button>
            </div>
        </div>

        {activeTab === 'applications' && (
            <>
            <div className="applications-list">
                {filteredApplications.length === 0 ? <div className="empty-state">No applications found</div> : getPaginatedData(filteredApplications).map(app => (
                    <div key={app.application_id} className="application-card">
                        <div className="card-header-row"><span className="header-label">College</span><span className="header-label">Name</span><span className="header-label">Gender</span><span className="header-label">School year</span><span className="header-label">Documents</span><span className="header-label">Actions</span></div>
                        <div className="card-content-row">
                            <div className="avatar-section"><div className="avatar-circle"><i className="bi bi-person-fill"></i></div><span className="college-text">{app.program || 'CCS'}</span></div>
                            <span className="name-text">{app.student_name}</span><span className="gender-text">N/A</span><span className="year-text">{app.school_year || 'N/A'}</span>
                            <div className="documents-section">{app.cor_filename ? <button className="document-icon" onClick={() => handleShowCor(app.cor_filename, false)}><i className="bi bi-file-earmark-text-fill fs-4"></i></button> : <div className="document-icon disabled"><i className="bi bi-file-earmark-x fs-4"></i></div>}</div>
                            <div className="actions-section">
                                <button className="btn-accept me-2" onClick={() => handleUpdateStatus(app.application_id, 'APPROVED')} disabled={app.status !== 'PENDING'}>Accept</button>
                                <button className="btn-decline" onClick={() => handleUpdateStatus(app.application_id, 'REJECT')} disabled={app.status !== 'PENDING'}>Decline</button>
                            </div>
                        </div>
                        {app.status !== 'PENDING' && <div className="status-badge-container"><span className={`status-badge status-${app.status.toLowerCase()}`}>{app.status}</span></div>}
                    </div>
                ))}
            </div>
            {renderPagination(filteredApplications.length)}
            </>
        )}

        {activeTab === 'users' && (
            <div className="user-management-container">
                <div className="user-table-wrapper">
                    <table className="user-table">
                        <thead><tr><th className="col-user">User</th><th className="col-role">Role</th><th className="col-status">Status</th><th className="col-reports">Reports</th><th className="col-action">Actions</th></tr></thead>
                        <tbody>
                            {getPaginatedData(filteredUsers).map(user => (
                                <tr key={user.google_id}>
                                    <td><div className="fw-bold">{user.first_name} {user.last_name}</div><div className="text-muted small">{user.email}</div></td>
                                    <td><span className="badge bg-secondary">{user.role}</span></td>
                                    <td><span className={`status-badge status-${user.status?.toLowerCase()}`}>{user.status}</span>{user.status_note && <div className="status-note-text">"{user.status_note}"</div>}</td>
                                    <td>{user.pending_reports > 0 ? <span className="text-danger fw-bold">{user.pending_reports} 🚩</span> : <span className="text-muted">0</span>}</td>
                                    <td><div className="action-buttons-group">
                                        {user.status !== 'ACTIVE' && <button className="btn-action btn-activate" onClick={() => openActionModal('USER', user, 'ACTIVE')}>Activate</button>}
                                        {user.status !== 'PROBATION' && <button className="btn-action btn-probation" onClick={() => openActionModal('USER', user, 'PROBATION')}>Probation</button>}
                                        {user.status !== 'BANNED' && <button className="btn-action btn-ban" onClick={() => openActionModal('USER', user, 'BANNED')}>Ban</button>}
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {renderPagination(filteredUsers.length)}
            </div>
        )}

        {activeTab === 'appeals' && (
            <div className="user-management-container">
                <div className="user-table-wrapper">
                    <table className="user-table">
                        <thead><tr><th className="col-user">User</th><th className="col-msg">Message</th><th className="col-evidence">Evidence</th><th className="col-status">Status</th><th className="col-action">Actions</th></tr></thead>
                        <tbody>
                            {getPaginatedData(filteredAppeals).map(appeal => (
                                <tr key={appeal.appeal_id}>
                                    <td><div className="fw-bold">{appeal.first_name} {appeal.last_name}</div><div className="text-muted small">{appeal.id_number}</div></td>
                                    <td className="appeal-text-cell"><div className="appeal-message-content">{appeal.appeal_text}</div><div className="appeal-date">{appeal.date_submitted}</div></td>
                                    <td>{appeal.files?.length > 0 ? appeal.files.map((f, i) => <button key={i} className="btn btn-outline-secondary evidence-btn me-1" onClick={()=>handleShowCor(f, true)}>File {i+1}</button>) : <span className="text-muted small">None</span>}</td>
                                    <td><span className={`status-badge status-${appeal.status.toLowerCase()}`}>{appeal.status}</span></td>
                                    <td>{appeal.status === 'PENDING' && <div className="action-buttons-group">
                                        <button className="btn-action btn-activate" onClick={() => openActionModal('APPEAL', appeal, 'APPROVE')}>Approve</button>
                                        <button className="btn-action btn-ban" onClick={() => openActionModal('APPEAL', appeal, 'REJECT')}>Reject</button>
                                    </div>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {renderPagination(filteredAppeals.length)}
            </div>
        )}
      </div>

      <Modal show={showActionModal} onHide={() => setShowActionModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>{actionData.title}</Modal.Title></Modal.Header>
        <Modal.Body>
            <p>Are you sure you want to proceed?</p>
            {actionData.type === 'APPEAL' && actionData.files && actionData.files.length > 0 && <div className="mb-3 p-2 border rounded bg-light"><strong>Evidence:</strong> {actionData.files.map((f, i) => <Button key={i} variant="link" size="sm" onClick={()=>handleShowCor(f, true)}>File {i+1}</Button>)}</div>}
            {actionData.noteRequired && <Form.Group><Form.Label>Reason / Note:</Form.Label><Form.Control as="textarea" rows={3} value={actionNote} onChange={(e) => setActionNote(e.target.value)} placeholder="Required..." /></Form.Group>}
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowActionModal(false)}>Cancel</Button>
            <Button variant={actionData.targetStatus.includes('REJECT') || actionData.targetStatus.includes('BAN') ? 'danger' : 'success'} onClick={submitAction}>Confirm</Button>
        </Modal.Footer>
      </Modal>

      {showConfirm && selectedApplication && (
        <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
          <Modal.Header closeButton><Modal.Title>Application Action</Modal.Title></Modal.Header>
          <Modal.Body><p>Confirm {confirmAction} for {selectedApplication.student_name}?</p></Modal.Body>
          <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowConfirm(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => confirmActionHandler(selectedApplication.application_id, confirmAction)}>Confirm</Button>
          </Modal.Footer>
        </Modal>
      )}

      {showCorModal && (
        <div className="modal fade show custom-dark-modal">
            <div className="modal-dialog modal-dialog-centered custom-large-modal">
                <div className="modal-content custom-dark-content">
                    <div className="modal-body p-0 custom-dark-body">
                        {selectedCorFile ? (selectedCorFile.toLowerCase().endsWith('.pdf') ? <iframe src={selectedCorFile} className="cor-frame" title="Doc"></iframe> : <img src={selectedCorFile} className="cor-image" alt="Doc" />) : <div className="text-white p-5">No File</div>}
                    </div>
                    <div className="custom-dark-footer"><button className="btn btn-light" onClick={() => setShowCorModal(false)}>Close</button></div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;