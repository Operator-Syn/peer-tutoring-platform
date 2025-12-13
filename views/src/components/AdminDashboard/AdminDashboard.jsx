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


  const formatStatusLabel = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  const handleShowCor = (url, isAppeal = false) => {
    const path = url.startsWith('http') ? url : (isAppeal || activeTab === 'appeals' ? `/uploads/appeals/${url}` : `/uploads/cor/${url}`);
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
    if (res.success) setShowActionModal(false);
    else { setToastMessage(res.message || "Action failed"); setShowToast(true); }
  };

  const renderPagination = () => (
    <div className="admin-pagination-wrapper">
        <span className="admin-page-info">Page {pagination.current_page} of {pagination.total_pages}</span>
        <div className="admin-pagination-controls">
            <button className="admin-btn-page" disabled={pagination.current_page === 1} onClick={() => filters.setPage(p => Math.max(1, p - 1))}>Previous</button>
            <button className="admin-btn-page" disabled={pagination.current_page >= pagination.total_pages} onClick={() => filters.setPage(p => p + 1)}>Next</button>
        </div>
        <div className="admin-rows-wrapper">
            <span className="admin-small-text">Rows:</span>
            <select className="admin-select-rows" value={filters.limit} onChange={(e) => filters.setLimit(Number(e.target.value))}>
                <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
            </select>
        </div>
    </div>
  );

  return (
    <div className={`admin-container ${showCorModal ? 'modal-open-custom' : ''}`}>
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="logo-section"><div className="logo-circle"><i className="bi bi-mortarboard-fill"></i></div></div>
          <nav className="header-nav">
            {['Home','About','Events','Messages','Reports'].map(l => <a key={l} href={`/${l.toLowerCase()}`} className="custom-nav-link">{l}</a>)}
          </nav>
          <div className="user-section"><div className="user-avatar"><i className="bi bi-person-circle"></i></div></div>
        </div>
      </header>

      <ToastContainer position="top-end" className="p-3" style={{zIndex: 3000, position: 'fixed'}}>
        <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide bg="danger">
            <Toast.Body className="text-white">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>

      <div className="admin-content">
        <div className="admin-page-title"><h1>Admin Dashboard</h1></div>
        {error && <div className="admin-alert-error">{error}</div>}

        <div className="admin-stats-grid">
          {[{k:"total_tutors",t:stats.total_tutors,d:"Tutors"}, {k:"total_applications",t:stats.total_applications,d:"Applications"}, {k:"total_tutees",t:stats.total_tutees,d:"Tutees"}, {k:"total_courses",t:stats.total_courses,d:"Courses"}, {k:"active_sessions",t:0,d:"Sessions"}].map(c => (
            <BasicCard key={c.k} title={String(c.t || 0)} description={c.d} />
          ))}
        </div>

        <div className="admin-tabs">
            <button className={`admin-tab-btn ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>Tutor Applications</button>
            <button className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>User Management</button>
            <button className={`admin-tab-btn ${activeTab === 'appeals' ? 'active' : ''}`} onClick={() => setActiveTab('appeals')}>Appeals</button>
        </div>

        <div className="admin-filters-row">
             <button className={`admin-pill ${filters.status === 'all' ? 'active' : ''}`} onClick={() => filters.setStatus('all')}>All</button>
             {['PENDING','APPROVED','REJECTED','ACTIVE','BANNED','PROBATION'].filter(s => {
                 if (activeTab === 'users') return ['ACTIVE','BANNED','PROBATION'].includes(s);
                 return ['PENDING','APPROVED','REJECTED'].includes(s);
             }).map(s => (
                 <button key={s} className={`admin-pill ${filters.status === s ? 'active' : ''}`} onClick={() => filters.setStatus(s)}>{formatStatusLabel(s)}</button>
             ))}
        </div>

        <div className="admin-controls-row">
            <div className="admin-controls-left">
                <div className="admin-sort-dropdown">
                    <select className="admin-form-select admin-sort" value={filters.sort} onChange={(e) => filters.setSort(e.target.value)}>
                        <option value="date_desc">Newest First</option>
                        <option value="date_asc">Oldest First</option>
                        {activeTab !== 'appeals' && <><option value="name_asc">Name (A-Z)</option><option value="name_desc">Name (Z-A)</option></>}
                        {activeTab === 'applications' && <><option value="college_asc">College (A-Z)</option><option value="college_desc">College (Z-A)</option><option value="year_asc">Year (Low-High)</option><option value="year_desc">Year (High-Low)</option></>}
                        {activeTab === 'users' && <><option value="role_asc">Role (A-Z)</option><option value="role_desc">Role (Z-A)</option></>}
                    </select>
                </div>
                
                {activeTab === 'applications' && (
                    <>
                    <select className="admin-form-select admin-filter-dropdown" value={filters.year} onChange={(e) => filters.setYear(e.target.value)}>
                        <option value="all">All Years</option><option value="1">1st Year</option><option value="2">2nd Year</option><option value="3">3rd Year</option><option value="4">4th Year</option>
                    </select>
                    </>
                )}

                {activeTab === 'users' && (
                    <select className="admin-form-select admin-filter-dropdown" value={filters.role} onChange={(e) => filters.setRole(e.target.value)}>
                        <option value="all">All Roles</option><option value="TUTEE">Tutee</option><option value="TUTOR">Tutor</option>
                    </select>
                )}
            </div>

            <div className="admin-search-wrapper">
                <input type="text" className="admin-form-input" placeholder={`Search ${activeTab}...`} value={filters.search} onChange={(e) => filters.setSearch(e.target.value)} />
                <button className="admin-btn-search"><i className="bi bi-search"></i></button>
            </div>
        </div>

        {loading ? (
            <div className="admin-loading-container">
                <div className="admin-spinner"></div>
                <p>Loading Data...</p>
            </div>
        ) : (
            <>
                {activeTab === 'applications' && (
                    <div className="admin-card-list">
                        {data.length === 0 ? <div className="admin-empty">No applications found</div> : data.map(app => (
                            <div key={app.application_id} className="admin-app-card">
                                <div className="admin-card-row header">
                                    <span>College</span><span>Name</span><span>Gender</span><span>School Year</span><span>Documents</span><span>Actions</span>
                                </div>
                                <div className="admin-card-row body">
                                    <div className="admin-flex-align"><div className="admin-avatar"><i className="bi bi-person-fill"></i></div><span className="admin-bold">{app.program || 'CCS'}</span></div>
                                    <span className="admin-text-main">{app.student_name}</span>
                                    <span className="admin-text-sub">N/A</span>
                                    <span className="admin-text-sub">{app.school_year || 'N/A'}</span>
                                    <div>{app.cor_filename ? <button className="admin-btn-icon" onClick={() => handleShowCor(app.cor_filename)}><i className="bi bi-file-text"></i></button> : <div className="admin-btn-icon disabled"><i className="bi bi-file-x"></i></div>}</div>
                                    <div className="admin-flex-align">
                                        <button className="admin-btn-accept" onClick={() => openActionModal('APP', app, 'APPROVED')} disabled={app.status !== 'PENDING'}>Accept</button>
                                        <button className="admin-btn-decline" onClick={() => openActionModal('APP', app, 'REJECTED')} disabled={app.status !== 'PENDING'}>Decline</button>
                                    </div>
                                </div>
                                {app.status !== 'PENDING' && <div className="admin-badge-absolute"><span className={`admin-status-badge ${app.status.toLowerCase()}`}>{app.status}</span></div>}
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="admin-table-box">
                        <table className="admin-table">
                            <thead><tr><th className="col-user">User</th><th className="col-role">Role</th><th className="col-status">Status</th><th className="col-reports">Reports</th><th className="col-actions">Actions</th></tr></thead>
                            <tbody>
                                {data.map(user => (
                                    <tr key={user.google_id}>
                                        <td><div className="admin-bold">{user.first_name} {user.last_name}</div><div className="admin-sub">{user.email}</div></td>
                                        <td><span className="admin-role-badge">{user.role}</span></td>
                                        <td><span className={`admin-status-badge ${user.status?.toLowerCase()}`}>{user.status}</span>{user.status_note && <div className="admin-note">"{user.status_note}"</div>}</td>
                                        <td>{user.pending_reports > 0 ? <span className="admin-danger">{user.pending_reports}</span> : "0"}</td>
                                        <td><div className="admin-flex-end">
                                            {user.status !== 'ACTIVE' && <button className="admin-btn-green" onClick={() => openActionModal('USER', user, 'ACTIVE')}>Activate</button>}
                                            {user.status !== 'PROBATION' && <button className="admin-btn-orange" onClick={() => openActionModal('USER', user, 'PROBATION')}>Probation</button>}
                                            {user.status !== 'BANNED' && <button className="admin-btn-red" onClick={() => openActionModal('USER', user, 'BANNED')}>Ban</button>}
                                        </div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'appeals' && (
                    <div className="admin-table-box">
                        <table className="admin-table">
                            <thead><tr><th className="col-user">User</th><th className="col-msg">Message</th><th className="col-file">Evidence</th><th className="col-status">Status</th><th className="col-actions">Actions</th></tr></thead>
                            <tbody>
                                {data.map(appeal => (
                                    <tr key={appeal.appeal_id}>
                                        <td><div className="admin-bold">{appeal.first_name} {appeal.last_name}</div><div className="admin-sub">{appeal.id_number}</div></td>
                                        <td><div className="admin-msg-box">{appeal.appeal_text}</div><div className="admin-date">{appeal.date_submitted}</div></td>
                                        <td>
                                            <div className="admin-flex-wrap">
                                                {appeal.files && appeal.files.length > 0 ? appeal.files.map((f, i) => (
                                                    <button key={i} className="admin-btn-icon" onClick={() => handleShowCor(f, true)}><i className="bi bi-file-text"></i></button>
                                                )) : <span className="admin-sub">None</span>}
                                            </div>
                                        </td>
                                        <td><span className={`admin-status-badge ${appeal.status.toLowerCase()}`}>{appeal.status}</span></td>
                                        <td>{appeal.status === 'PENDING' && <div className="admin-flex-end">
                                            <button className="admin-btn-green" onClick={() => openActionModal('APPEAL', appeal, 'APPROVE')}>Approve</button>
                                            <button className="admin-btn-red" onClick={() => openActionModal('APPEAL', appeal, 'REJECT')}>Reject</button>
                                        </div>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
            {actionData.type === 'APPEAL' && actionData.files && actionData.files.length > 0 && (
                <div className="admin-modal-files">
                    <strong>Attached Evidence:</strong>
                    <div className="admin-flex-wrap mt-2">
                        {actionData.files.map((file, idx) => (
                            <Button key={idx} variant="outline-primary" size="sm" onClick={() => handleShowCor(file, true)}>File {idx + 1}</Button>
                        ))}
                    </div>
                </div>
            )}
            {actionData.noteRequired && <Form.Group><Form.Label>Reason / Note:</Form.Label><Form.Control as="textarea" rows={3} value={actionNote} onChange={(e) => setActionNote(e.target.value)} /></Form.Group>}
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