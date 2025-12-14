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
  const [actionData, setActionData] = useState({ type: '', id: null, title: '', noteRequired: false, targetStatus: '', files: [], finalCode: '', details: null });
  const [actionNote, setActionNote] = useState('');
  const [showCorModal, setShowCorModal] = useState(false);
  const [selectedCorFile, setSelectedCorFile] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [reportList, setReportList] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);

  const formatStatusLabel = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  const fetchAndShowReports = async (userId) => {
    const res = await fetch(`/api/admin/users/${userId}/reports`);
    const data = await res.json();
    if (data.success) {
        setReportList(data.reports);
        setShowReportModal(true);
    }
};

  const handleShowCor = (url, isAppeal = false) => {
    const path = url.startsWith('http') ? url : (isAppeal || activeTab === 'appeals' ? `/uploads/appeals/${url}` : `/uploads/cor/${url}`);
    setSelectedCorFile(path);
    setShowCorModal(true);
  };

  const openActionModal = (actionType, item, targetStatus) => {
    let title = "", noteRequired = false, id = null, files = [], finalCode = "", details = null;
    
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
    } else if (actionType === 'REQUEST') {
        id = item.request_id;
        if (targetStatus === 'VIEW') {
            title = `Request Details: ${item.subject_code}`;
            details = item; 
        } else {
            title = `${targetStatus === 'APPROVE' ? 'Approve' : 'Reject'} Subject Request`;
            finalCode = item.subject_code; 
        }
    }
    
    setActionData({ type: actionType, id, title, noteRequired, targetStatus, files, finalCode, details });
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
    } else if (actionData.type === 'REQUEST') {
        apiAction = 'RESOLVE_REQUEST';
        payload = { 
            action: actionData.targetStatus === 'APPROVE' ? 'APPROVE' : 'REJECT',
            final_code: actionData.finalCode 
        };
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
            <button className={`admin-tab-btn ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>Subject Requests</button>
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
                        {activeTab !== 'appeals' && activeTab !== 'requests' && <><option value="name_asc">Name (A-Z)</option><option value="name_desc">Name (Z-A)</option></>}
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
                                        {app.status === 'PENDING' ? (
                                            <>
                                                <button className="admin-btn-accept" onClick={() => openActionModal('APP', app, 'APPROVED')}>Accept</button>
                                                <button className="admin-btn-decline" onClick={() => openActionModal('APP', app, 'REJECT')}>Decline</button>
                                            </>
                                        ) : (
                                            <span className="admin-text-muted">Processed</span>
                                        )}
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
                                        <td>
                                            {user.pending_reports > 0 ? (
                                                <button 
                                                    className="btn btn-sm btn-outline-danger" 
                                                    onClick={() => fetchAndShowReports(user.google_id)}
                                                >
                                                    {user.pending_reports} Pending
                                                </button>
                                            ) : "0"}
                                        </td>
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

                {activeTab === 'requests' && (
                    <div className="admin-table-box">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th className="col-req-user">Requester</th>
                                    <th className="col-req-role">Role</th>
                                    <th className="col-req-subj">Subject</th>
                                    <th className="col-req-status-date">Status / Date</th>
                                    <th className="col-req-actions">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map(req => (
                                    <tr key={req.request_id}>
                                        <td>
                                            <div className="admin-bold">{req.first_name} {req.last_name}</div>
                                            <div className="admin-sub">{req.requester_id}</div>
                                        </td>
                                        <td><span className="admin-role-badge">{req.role}</span></td>
                                        <td><div className="admin-bold">{req.subject_code}</div></td>
                                        <td>
                                            <span className={`admin-status-badge ${req.status.toLowerCase()}`}>{req.status}</span>
                                            <div className="admin-text-muted mt-1" style={{fontSize: '0.8rem'}}>{req.created_at}</div>
                                        </td>
                                        <td>
                                            <div className="admin-flex-end">
                                                <button className="admin-btn-icon" title="View Details" onClick={() => openActionModal('REQUEST', req, 'VIEW')} style={{marginRight: '10px'}}><i className="bi bi-eye"></i></button>
                                                {req.status === 'PENDING' && (
                                                    <>
                                                        <button className="admin-btn-accept" onClick={() => openActionModal('REQUEST', req, 'APPROVE')}>Accept</button>
                                                        <button className="admin-btn-decline" onClick={() => openActionModal('REQUEST', req, 'REJECT')}>Decline</button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
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
            {actionData.targetStatus === 'VIEW' && actionData.details && (
                <div className="admin-details-view">
                    <p><strong>Subject Code:</strong> {actionData.details.subject_code}</p>
                    <p><strong>Reason/Description:</strong></p>
                    <div className="p-2 bg-light rounded mb-2">{actionData.details.description || "No description provided."}</div>
                    <p className="mb-0"><small className="text-muted">Requested by {actionData.details.first_name} {actionData.details.last_name} ({actionData.details.requester_id}) on {actionData.details.created_at}</small></p>
                </div>
            )}

            {actionData.targetStatus !== 'VIEW' && <p>Are you sure you want to proceed?</p>}
            
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
            
            {actionData.type === 'REQUEST' && actionData.targetStatus === 'APPROVE' && (
                <Form.Group className="mb-3">
                    <Form.Label className="admin-fw-bold">Confirm Course Code:</Form.Label>
                    <Form.Control 
                        type="text" 
                        value={actionData.finalCode} 
                        onChange={(e) => setActionData({...actionData, finalCode: e.target.value})}
                        placeholder="e.g. MATH 101"
                    />
                    <Form.Text className="text-muted">
                        Edit this to correct the format before adding to the database. Separate multiple subjects with a comma.
                    </Form.Text>
                </Form.Group>
            )}

            {actionData.noteRequired && <Form.Group><Form.Label>Reason / Note:</Form.Label><Form.Control as="textarea" rows={3} value={actionNote} onChange={(e) => setActionNote(e.target.value)} /></Form.Group>}
        </Modal.Body>
        <Modal.Footer>
            {actionData.targetStatus === 'VIEW' ? (
                 <Button variant="secondary" onClick={() => setShowActionModal(false)}>Close</Button>
            ) : (
                <>
                    <Button variant="secondary" onClick={() => setShowActionModal(false)}>Cancel</Button>
                    <Button variant={actionData.targetStatus.includes('REJECT') || actionData.targetStatus.includes('BAN') ? 'danger' : 'success'} onClick={submitAction}>Confirm</Button>
                </>
            )}
        </Modal.Footer>
      </Modal>

      <Modal show={showReportModal} onHide={() => setShowReportModal(false)} size="lg" centered>
            <Modal.Header closeButton><Modal.Title>User Reports</Modal.Title></Modal.Header>
            <Modal.Body>
                {reportList.length === 0 ? <p>No reports found.</p> : (
                    <div className="list-group">
                        {reportList.map(r => (
                            <div key={r.report_id} className="list-group-item">
                                <div className="d-flex justify-content-between">
                                    <h5 className="mb-1">{r.type}</h5>
                                    <small>{r.date_submitted}</small>
                                </div>
                                <p className="mb-1">{r.description}</p>
                                <small className="text-muted">Reporter: {r.reporter_id}</small>
                            </div>
                        ))}
                    </div>
                )}
            </Modal.Body>
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