import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './AdminDashboard.css';
import BasicCard from '../HomePageCard/HomePageCard';
import { Modal, Button, Form, Toast, ToastContainer } from 'react-bootstrap';
import { useAdminDashboardData } from '../../hooks/useAdminDashboardData';

const AdminDashboard = () => {
  const { 
    activeTab, setActiveTab, 
    data, stats, loading, error, 
    filters, pagination, actions 
  } = useAdminDashboardData();

  const [showActionModal, setShowActionModal] = useState(false);
  const [actionData, setActionData] = useState({ type: '', id: null, title: '', noteRequired: false, targetStatus: '', files: [] });
  const [actionNote, setActionNote] = useState('');
  const [showCorModal, setShowCorModal] = useState(false);
  const [selectedCorFile, setSelectedCorFile] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Counts Helper
  const getCounts = (tab) => {
    return {}; 
  };
  
  const formatStatusLabel = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  const handleShowCor = (url) => {
    const path = url.startsWith('http') ? url : (activeTab === 'appeals' ? `/uploads/appeals/${url}` : `/uploads/cor/${url}`);
    setSelectedCorFile(path);
    setShowCorModal(true);
  };

  const openActionModal = (actionType, item, targetStatus) => {
    let title = "", noteRequired = false, id = null, files = [];
    
    if (actionType === 'USER') {
        id = item.google_id;
        const name = item.first_name ? `${item.first_name} ${item.last_name}` : item.email;
        title = `${targetStatus === 'ACTIVE' ? 'Activate' : targetStatus} User: ${name}`;
        noteRequired = ['BANNED', 'PROBATION'].includes(targetStatus);
    } else if (actionType === 'APPEAL') {
        id = item.appeal_id;
        title = `${targetStatus === 'APPROVE' ? 'Approve' : 'Reject'} Appeal`;
        files = item.files || [];
    } else if (actionType === 'APP') {
        id = item.application_id;
        title = `${targetStatus === 'APPROVED' ? 'Approve' : 'Reject'} Application`;
    }

    setActionData({ type: actionType, id, title, noteRequired, targetStatus, files });
    setActionNote('');
    setShowActionModal(true);
  };

  const submitAction = async () => {
    if (actionData.noteRequired && !actionNote.trim()) {
        setToastMessage("A reason is required.");
        setShowToast(true);
        return;
    }

    let apiAction = '';
    let payload = {};

    if (actionData.type === 'USER') {
        apiAction = 'UPDATE_USER_STATUS';
        payload = { status: actionData.targetStatus, note: actionNote };
    } else if (actionData.type === 'APPEAL') {
        apiAction = 'RESOLVE_APPEAL';
        payload = { action: actionData.targetStatus === 'APPROVE' ? 'APPROVE' : 'REJECT' };
    } else if (actionData.type === 'APP') {
        apiAction = actionData.targetStatus === 'APPROVED' ? 'APPROVE_APP' : 'REJECT_APP';
    }

    const res = await actions.handleAction(apiAction, actionData.id, payload);
    if (res.success) {
        setShowActionModal(false);
    } else { 
        setToastMessage(res.message || "Action failed"); 
        setShowToast(true); 
    }
  };

  const renderPagination = () => (
    <div className="pagination-container">
        <span className="page-info">Page {pagination.current_page} of {pagination.total_pages}</span>
        <div className="d-flex align-items-center gap-2">
            <button className="pagination-btn" disabled={pagination.current_page === 1} onClick={() => filters.setPage(p => Math.max(1, p - 1))}>Previous</button>
            <button className="pagination-btn" disabled={pagination.current_page >= pagination.total_pages} onClick={() => filters.setPage(p => p + 1)}>Next</button>
        </div>
        <div className="d-flex align-items-center gap-2 ms-3">
            <span className="small text-muted">Rows:</span>
            <select className="rows-per-page-select" value={filters.limit} onChange={(e) => filters.setLimit(Number(e.target.value))}>
                <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
            </select>
        </div>
    </div>
  );

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
        {error && <div className="alert alert-warning">{error}</div>}

        <div className="statistics-grid-top">
          {[{k:"total_tutors",t:stats.total_tutors,d:"Tutors"}, {k:"total_applications",t:stats.total_applications,d:"Applications"}, {k:"total_tutees",t:stats.total_tutees,d:"Tutees"}, {k:"total_courses",t:stats.total_courses,d:"Courses"}, {k:"active_sessions",t:0,d:"Sessions"}].map(c => (
            <BasicCard key={c.k} title={String(c.t || 0)} description={c.d} />
          ))}
        </div>

        <div className="admin-tabs-container">
            <button className={`admin-tab-btn ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>Tutor Applications</button>
            <button className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>User Management</button>
            <button className={`admin-tab-btn ${activeTab === 'appeals' ? 'active' : ''}`} onClick={() => setActiveTab('appeals')}>Appeals</button>
        </div>

        <div className="status-filter-tabs">
             <button className={`filter-tab ${filters.status === 'all' ? 'active' : ''}`} onClick={() => filters.setStatus('all')}>All</button>
             {(activeTab === 'applications' ? ['PENDING','APPROVED','REJECTED'] : activeTab === 'users' ? ['ACTIVE','BANNED','PROBATION'] : ['PENDING','APPROVED','REJECTED']).map(s => (
                 <button key={s} className={`filter-tab ${filters.status === s ? 'active' : ''}`} onClick={() => filters.setStatus(s)}>{formatStatusLabel(s)}</button>
             ))}
        </div>

        <div className="controls-section">
            <div className="sort-dropdown">
                <select className="form-select" value={filters.sort} onChange={(e) => filters.setSort(e.target.value)}>
                    <option value="date_desc">Newest First</option>
                    <option value="date_asc">Oldest First</option>
                    {activeTab !== 'appeals' && <option value="name_asc">Name (A-Z)</option>}
                    {activeTab !== 'appeals' && <option value="name_desc">Name (Z-A)</option>}
                    
                    {activeTab === 'applications' && <><option value="college_asc">College (A-Z)</option><option value="college_desc">College (Z-A)</option><option value="year_asc">Year (Low-High)</option><option value="year_desc">Year (High-Low)</option></>}
                    {activeTab === 'users' && <><option value="role_asc">Role (A-Z)</option><option value="role_desc">Role (Z-A)</option></>}
                </select>
            </div>
            
            {activeTab === 'applications' && (
                <>
                <select className="form-select filter-dropdown" value={filters.college} onChange={(e) => filters.setCollege(e.target.value)}>
                    <option value="all">All Colleges</option><option value="CCS">CCS</option><option value="COE">COE</option><option value="CAS">CAS</option><option value="CBA">CBA</option><option value="CON">CON</option>
                </select>
                <select className="form-select filter-dropdown" value={filters.year} onChange={(e) => filters.setYear(e.target.value)}>
                    <option value="all">All Years</option><option value="1">1st Year</option><option value="2">2nd Year</option><option value="3">3rd Year</option><option value="4">4th Year</option>
                </select>
                </>
            )}

            {activeTab === 'users' && (
                <select className="form-select filter-dropdown" value={filters.role} onChange={(e) => filters.setRole(e.target.value)}>
                    <option value="all">All Roles</option>
                    <option value="TUTEE">Tutee</option>
                    <option value="TUTOR">Tutor</option>
                    <option value="ADMIN">Admin</option>
                </select>
            )}

            <div className="search-box">
                <input type="text" className="form-control" placeholder={`Search ${activeTab}...`} value={filters.search} onChange={(e) => filters.setSearch(e.target.value)} />
                <button className="search-btn"><i className="bi bi-search"></i></button>
            </div>
        </div>

        {loading ? <p className="text-center p-5">Loading...</p> : (
            <>
            {activeTab === 'applications' && (
                <div className="applications-list">
                    {data.length === 0 ? <div className="empty-state">No applications found</div> : data.map(app => (
                        <div key={app.application_id} className="application-card">
                            <div className="card-header-row"><span className="header-label">College</span><span className="header-label">Name</span><span className="header-label">Gender</span><span className="header-label">School year</span><span className="header-label">Documents</span><span className="header-label">Actions</span></div>
                            <div className="card-content-row">
                                <div className="avatar-section"><div className="avatar-circle"><i className="bi bi-person-fill"></i></div><span className="college-text">{app.program || 'CCS'}</span></div>
                                <span className="name-text">{app.student_name}</span><span className="gender-text">N/A</span><span className="year-text">{app.school_year || 'N/A'}</span>
                                <div className="documents-section">{app.cor_filename ? <button className="document-icon" onClick={() => handleShowCor(app.cor_filename)}><i className="bi bi-file-earmark-text-fill fs-4"></i></button> : <div className="document-icon disabled"><i className="bi bi-file-earmark-x fs-4"></i></div>}</div>
                                <div className="actions-section">
                                    <button className="btn-accept me-2" onClick={() => openActionModal('APP', app, 'APPROVED')} disabled={app.status !== 'PENDING'}>Accept</button>
                                    <button className="btn-decline" onClick={() => openActionModal('APP', app, 'REJECTED')} disabled={app.status !== 'PENDING'}>Decline</button>
                                </div>
                            </div>
                            {app.status !== 'PENDING' && <div className="status-badge-container"><span className={`status-badge status-${app.status.toLowerCase()}`}>{app.status}</span></div>}
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'users' && (
                <div className="user-management-container">
                    <div className="user-table-wrapper">
                        <table className="user-table">
                            <thead><tr><th className="col-user">User</th><th className="col-role">Role</th><th className="col-status">Status</th><th className="col-reports">Reports</th><th className="col-action">Actions</th></tr></thead>
                            <tbody>
                                {data.map(user => (
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
                </div>
            )}

            {activeTab === 'appeals' && (
                <div className="user-management-container">
                    <div className="user-table-wrapper">
                        <table className="user-table">
                            <thead><tr><th className="col-user">User</th><th className="col-msg">Message</th><th className="col-evidence">Evidence</th><th className="col-status">Status</th><th className="col-action">Actions</th></tr></thead>
                            <tbody>
                                {data.map(appeal => (
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
                </div>
            )}

            {renderPagination()}
            </>
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