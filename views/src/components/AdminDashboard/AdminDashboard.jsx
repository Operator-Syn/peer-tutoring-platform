import React, { useState, useEffect } from 'react';
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

  const [courses, setCourses] = useState([]);
  const [requestData, setRequestData] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState('all'); 
  const [customPagination, setCustomPagination] = useState({
      current_page: 1, total_pages: 1, total_items: 0, items_per_page: 10
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  const [showActionModal, setShowActionModal] = useState(false);
  const [actionData, setActionData] = useState({ 
      type: '', id: null, title: '', noteRequired: false, targetStatus: '', 
      files: [], finalCode: '', finalName: '', details: null 
  });
  const [actionNote, setActionNote] = useState('');
  const [showCorModal, setShowCorModal] = useState(false);
  const [selectedCorFile, setSelectedCorFile] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [reportList, setReportList] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);

  const formatStatusLabel = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  const handleTabChange = (tab) => {
      setActiveTab(tab);
      filters.setPage(1); 
      setCustomPagination({ ...customPagination, current_page: 1 });
  };

  useEffect(() => {
      const fetchCustomData = async () => {
          if (activeTab === 'inventory') {
              try {
                  const query = `?page=${filters.page}&limit=${filters.limit}&search=${filters.search}&filter=${subjectFilter}`;
                  const res = await fetch(`/api/admin/courses${query}`);
                  const result = await res.json();
                  if (result.success) {
                      setCourses(result.data);
                      setCustomPagination(result.pagination);
                  }
              } catch(e) { console.error(e); }
          } 
          else if (activeTab === 'requests') {
              try {
                  const query = `?page=${filters.page}&limit=${filters.limit}&status=${filters.status !== 'all' ? filters.status : 'PENDING'}`;
                  const res = await fetch(`/api/admin/subject-requests${query}`);
                  const result = await res.json();
                  if (result.success) {
                      setRequestData(result.data);
                      setCustomPagination(result.pagination);
                  }
              } catch(e) { console.error(e); }
          }
      };

      fetchCustomData();
  }, [activeTab, filters.page, filters.search, filters.status, subjectFilter]);

  const handleDeleteClick = (code) => {
      setCourseToDelete(code);
      setShowDeleteModal(true);
  };

  const confirmDeleteCourse = async () => {
      if (!courseToDelete) return;
      try {
          const res = await fetch(`/api/admin/courses/${courseToDelete}`, { method: 'DELETE' });
          if(res.ok) {
              setToastMessage("Course deleted successfully"); 
              setShowToast(true);
              const query = `?page=${filters.page}&limit=${filters.limit}&search=${filters.search}&filter=${subjectFilter}`;
              const refresh = await fetch(`/api/admin/courses${query}`);
              const result = await refresh.json();
              if(result.success) setCourses(result.data);
          } else {
              setToastMessage("Failed to delete"); setShowToast(true);
          }
      } catch(e) { console.error(e); }
      setShowDeleteModal(false);
      setCourseToDelete(null);
  };

  const fetchAndShowReports = async (userId) => {
    const res = await fetch(`/api/admin/users/${userId}/reports`);
    const data = await res.json();
    if (data.success) { setReportList(data.reports); setShowReportModal(true); }
  };

  const handleShowCor = (url, isAppeal = false) => {
    const path = url.startsWith('http') ? url : (isAppeal || activeTab === 'appeals' ? `/uploads/appeals/${url}` : `/uploads/cor/${url}`);
    setSelectedCorFile(path); setShowCorModal(true);
  };

  const openActionModal = (actionType, item, targetStatus) => {
    let title = "", noteRequired = false, id = null, files = [], finalCode = "", finalName = "", details = null;
    if (actionType === 'USER') {
        id = item.google_id;
        const name = item.first_name ? `${item.first_name} ${item.last_name}` : item.email;
        title = `${targetStatus === 'ACTIVE' ? 'Activate' : targetStatus} User: ${name}`;
        noteRequired = ['BANNED', 'PROBATION'].includes(targetStatus);
    } else if (actionType === 'APPEAL') {
        id = item.appeal_id; title = `${targetStatus === 'APPROVE' ? 'Approve' : 'Reject'} Appeal`; files = item.files || [];
    } else if (actionType === 'APP') {
        id = item.application_id; title = `${targetStatus === 'APPROVED' ? 'Approve' : 'Reject'} Application`;
    } else if (actionType === 'REQUEST') {
        id = item.request_id;
        if (targetStatus === 'VIEW') { title = `Request Details: ${item.subject_code}`; details = item; } 
        else { title = `${targetStatus === 'APPROVE' ? 'Approve' : 'Reject'} Subject Request`; finalCode = item.subject_code; finalName = item.subject_name; }
    }
    setActionData({ type: actionType, id, title, noteRequired, targetStatus, files, finalCode, finalName, details });
    setActionNote(''); setShowActionModal(true);
  };

  const submitAction = async () => {
    let apiAction = ''; let payload = {};
    if (actionData.type === 'USER') { apiAction = 'UPDATE_USER_STATUS'; payload = { status: actionData.targetStatus, note: actionNote }; }
    else if (actionData.type === 'APPEAL') { apiAction = 'RESOLVE_APPEAL'; payload = { action: actionData.targetStatus === 'APPROVE' ? 'APPROVE' : 'REJECT' }; }
    else if (actionData.type === 'APP') { apiAction = actionData.targetStatus === 'APPROVED' ? 'APPROVE_APP' : 'REJECT_APP'; }
    else if (actionData.type === 'REQUEST') { apiAction = 'RESOLVE_REQUEST'; payload = { action: actionData.targetStatus === 'APPROVE' ? 'APPROVE' : 'REJECT', final_code: actionData.finalCode, final_name: actionData.finalName }; }
    
    const res = await actions.handleAction(apiAction, actionData.id, payload);
    if (res.success) { 
        setShowActionModal(false); 
        if (activeTab === 'requests') {
             const query = `?page=${filters.page}&limit=${filters.limit}&status=${filters.status !== 'all' ? filters.status : 'PENDING'}`;
             fetch(`/api/admin/subject-requests${query}`).then(r=>r.json()).then(d=>{if(d.success) setRequestData(d.data)});
        }
    }
    else { setToastMessage(res.message || "Action failed"); setShowToast(true); }
  };

  const renderPagination = () => {
    const currentPagination = (activeTab === 'inventory' || activeTab === 'requests') ? customPagination : pagination;
    return (
        <div className="admin-pagination-wrapper">
            <span className="admin-page-info">Page {currentPagination.current_page} of {currentPagination.total_pages}</span>
            <div className="admin-pagination-controls">
                <button className="admin-btn-page" disabled={currentPagination.current_page === 1} onClick={() => filters.setPage(p => Math.max(1, p - 1))}>Previous</button>
                <button className="admin-btn-page" disabled={currentPagination.current_page >= currentPagination.total_pages} onClick={() => filters.setPage(p => p + 1)}>Next</button>
            </div>
            <div className="admin-rows-wrapper">
                <span className="admin-small-text">Rows:</span>
                <select className="admin-select-rows" value={filters.limit} onChange={(e) => filters.setLimit(Number(e.target.value))}>
                    <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                </select>
            </div>
        </div>
    );
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="logo-section"><div className="logo-circle"><i className="bi bi-mortarboard-fill"></i></div></div>
          <nav className="header-nav">{['Home','About','Events','Messages','Reports'].map(l => <a key={l} href={`/${l.toLowerCase()}`} className="custom-nav-link">{l}</a>)}</nav>
          <div className="user-section"><div className="user-avatar"><i className="bi bi-person-circle"></i></div></div>
        </div>
      </header>

      <ToastContainer position="top-end" className="p-3 admin-toast-container">
        <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide bg="danger"><Toast.Body className="text-white">{toastMessage}</Toast.Body></Toast>
      </ToastContainer>

      <div className="admin-content">
        <div className="admin-page-title"><h1>Admin Dashboard</h1></div>
        
        <div className="admin-stats-grid">
          {[{k:"total_tutors",t:stats.total_tutors,d:"Tutors"}, {k:"total_applications",t:stats.total_applications,d:"Applications"}, {k:"total_tutees",t:stats.total_tutees,d:"Tutees"}, {k:"total_courses",t:stats.total_courses,d:"Courses"}, {k:"active_sessions",t:stats.active_sessions,d:"Sessions"}].map(c => (
            <BasicCard key={c.k} title={String(c.t || 0)} description={c.d} />
          ))}
        </div>

        <div className="admin-tabs">
            <button className={`admin-tab-btn ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => handleTabChange('applications')}>Tutor Applications</button>
            <button className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => handleTabChange('users')}>User Management</button>
            <button className={`admin-tab-btn ${activeTab === 'appeals' ? 'active' : ''}`} onClick={() => handleTabChange('appeals')}>Appeals</button>
            <button className={`admin-tab-btn ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => handleTabChange('requests')}>Subject Requests</button>
            <button className={`admin-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => handleTabChange('inventory')}>Subject Management</button>
        </div>

        <div className="admin-filters-row">
             <button className={`admin-pill ${filters.status === 'all' ? 'active' : ''}`} onClick={() => filters.setStatus('all')}>All</button>
             {['PENDING','APPROVED','REJECTED','ACTIVE','BANNED','PROBATION'].filter(s => {
                 if (activeTab === 'users') return ['ACTIVE','BANNED','PROBATION'].includes(s);
                 if (activeTab === 'inventory') return false; 
                 if (activeTab === 'requests') return ['PENDING','APPROVED','REJECTED'].includes(s);
                 return ['PENDING','APPROVED','REJECTED'].includes(s);
             }).map(s => (
                 <button key={s} className={`admin-pill ${filters.status === s ? 'active' : ''}`} onClick={() => filters.setStatus(s)}>{formatStatusLabel(s)}</button>
             ))}
        </div>

        <div className="admin-controls-row">
            <div className="admin-controls-left">
                {activeTab === 'users' && (
                    <>
                        <select className="admin-form-select admin-filter-dropdown" value={filters.role} onChange={(e) => filters.setRole(e.target.value)}>
                            <option value="all">All Roles</option><option value="TUTEE">Tutee</option><option value="TUTOR">Tutor</option>
                        </select>
                        <select className="admin-form-select admin-filter-dropdown" value={filters.reported} onChange={(e) => filters.setReported(e.target.value)}>
                            <option value="all">All Users</option><option value="yes">Reported Only</option><option value="no">No Reports</option>
                        </select>
                    </>
                )}
                {activeTab === 'inventory' && (
                    <select className="admin-form-select admin-filter-dropdown" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
                        <option value="all">All Subjects</option>
                        <option value="no_tutors">No Tutors</option>
                        <option value="with_tutors">Has Tutors</option>
                    </select>
                )}
                {activeTab !== 'inventory' && activeTab !== 'requests' && (
                    <div className="admin-sort-dropdown">
                        <select className="admin-form-select admin-sort" value={filters.sort} onChange={(e) => filters.setSort(e.target.value)}>
                            <option value="date_desc">Newest First</option>
                            <option value="date_asc">Oldest First</option>
                            {activeTab === 'applications' && <><option value="name_asc">Name (A-Z)</option><option value="college_asc">College (A-Z)</option></>}
                        </select>
                    </div>
                )}
                {activeTab === 'applications' && (
                    <select className="admin-form-select admin-filter-dropdown" value={filters.year} onChange={(e) => filters.setYear(e.target.value)}>
                        <option value="all">All Years</option><option value="1">1st</option><option value="2">2nd</option><option value="3">3rd</option><option value="4">4th</option>
                    </select>
                )}
            </div>
            <div className="admin-search-wrapper">
                <input type="text" className="admin-form-input" placeholder={`Search ${activeTab}...`} value={filters.search} onChange={(e) => filters.setSearch(e.target.value)} />
                <button className="admin-btn-search"><i className="bi bi-search"></i></button>
            </div>
        </div>

        {loading && activeTab !== 'inventory' && activeTab !== 'requests' ? (
            <div className="admin-loading-container"><div className="admin-spinner"></div><p>Loading Data...</p></div>
        ) : (
            <>
                {activeTab === 'requests' && (
                    <div className="admin-table-box">
                        <table className="admin-table">
                            <thead><tr><th>Requester</th><th>Requested Subject</th><th>Reason</th><th>Date</th><th style={{textAlign: 'right'}}>Actions</th></tr></thead>
                            <tbody>
                                {requestData.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center p-4">No requests found.</td></tr>
                                ) : (
                                    requestData.map(req => (
                                        <tr key={req.request_id}>
                                            <td>
                                                <div className="admin-bold">{req.first_name || 'Unknown'} {req.last_name || ''}</div>
                                                <div className="admin-sub">{req.requester_id || 'N/A'}</div>
                                            </td>
                                            <td>
                                                <div className="admin-bold">{req.subject_code || 'N/A'}</div>
                                                <div className="admin-text-muted">{req.subject_name || 'N/A'}</div>
                                            </td>
                                            <td><div className="admin-msg-box">{req.description || 'None'}</div></td>
                                            <td>{req.created_at || 'N/A'}</td>
                                            <td>
                                                <div className="admin-flex-end">
                                                    <button className="admin-btn-icon" title="View Details" onClick={() => openActionModal('REQUEST', req, 'VIEW')} style={{marginRight: '10px'}}><i className="bi bi-eye"></i></button>
                                                    {req.status === 'PENDING' && (
                                                        <>
                                                            <button className="admin-btn-accept" onClick={() => openActionModal('REQUEST', req, 'APPROVE')}>Accept</button>
                                                            <button className="admin-btn-decline" onClick={() => openActionModal('REQUEST', req, 'REJECT')}>Decline</button>
                                                        </>
                                                    )}
                                                    {req.status !== 'PENDING' && <span className={`admin-status-badge ${req.status.toLowerCase()}`}>{req.status}</span>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'inventory' && (
                    <div className="admin-table-box">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th style={{width: '25%'}}>Code</th>
                                    <th style={{width: '50%'}}>Course Name</th>
                                    <th style={{width: '15%'}}>Availability</th>
                                    <th style={{width: '10%', textAlign: 'right'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses.length === 0 ? (
                                    <tr><td colSpan="4" style={{textAlign: 'center', padding: '2rem'}}>No courses found</td></tr>
                                ) : (
                                    courses.map(c => (
                                        <tr key={c.course_code}>
                                            <td><span className="admin-bold">{c.course_code}</span></td>
                                            <td>{c.course_name}</td>
                                            <td>
                                                {parseInt(c.tutor_count || 0) === 0 ? 
                                                    <span className="admin-status-badge rejected" style={{fontSize:'0.7rem'}}>No Tutors</span> : 
                                                    <span className="admin-status-badge active" style={{fontSize:'0.7rem'}}>{c.tutor_count} Active Tutors</span>
                                                }
                                            </td>
                                            <td>
                                                <div className="admin-flex-end">
                                                    <button className="admin-btn-icon" style={{background: 'none', color: '#e53e3e'}} onClick={() => handleDeleteClick(c.course_code)}>
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab !== 'requests' && activeTab !== 'inventory' && (
                    <div className="admin-card-list">
                        {activeTab === 'applications' && data.map(app => (
                           <div key={app.application_id} className="admin-app-card">
                               <div className="admin-card-row header"><span>College</span><span>Name</span><span>Gender</span><span>Year</span><span>Doc</span><span>Action</span></div>
                               <div className="admin-card-row body">
                                   <span className="admin-bold">{app.program || 'N/A'}</span>
                                   <span className="admin-text-main">{app.student_name}</span>
                                   <span>N/A</span>
                                   <span>{app.school_year}</span>
                                   <button className="admin-btn-icon" onClick={() => handleShowCor(app.cor_filename)}><i className="bi bi-file-text"></i></button>
                                   <div className="admin-flex-align">
                                       {app.status === 'PENDING' ? <><button className="admin-btn-accept" onClick={() => openActionModal('APP', app, 'APPROVED')}>Accept</button><button className="admin-btn-decline" onClick={() => openActionModal('APP', app, 'REJECT')}>Decline</button></> : <span>{app.status}</span>}
                                   </div>
                               </div>
                           </div>
                       ))}
                       
                       {activeTab === 'users' && (
                            <div className="admin-table-box">
                                <table className="admin-table">
                                    <thead><tr><th className="col-user">User</th><th className="col-role">Role</th><th className="col-status">Status</th><th className="col-reports">Reports</th><th className="col-actions">Actions</th></tr></thead>
                                    <tbody>
                                        {[...data].sort((a, b) => (b.pending_reports || 0) - (a.pending_reports || 0)).map(user => (
                                            <tr key={user.google_id}>
                                                <td><div className="admin-bold">{user.first_name} {user.last_name}</div><div className="admin-sub">{user.email}</div></td>
                                                <td><span className="admin-role-badge">{user.role}</span></td>
                                                <td><span className={`admin-status-badge ${user.status?.toLowerCase()}`}>{user.status}</span></td>
                                                <td>{user.pending_reports > 0 ? <button className="btn btn-sm btn-outline-danger" onClick={() => fetchAndShowReports(user.google_id)}>{user.pending_reports} Pending</button> : "0"}</td>
                                                <td><div className="admin-flex-end">{user.status !== 'ACTIVE' && <button className="admin-btn-green" onClick={() => openActionModal('USER', user, 'ACTIVE')}>Activate</button>}{user.status !== 'BANNED' && <button className="admin-btn-red" onClick={() => openActionModal('USER', user, 'BANNED')}>Ban</button>}</div></td>
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
                                                <td><div className="admin-flex-wrap">{appeal.files && appeal.files.map((f, i) => <button key={i} className="admin-btn-icon" onClick={() => handleShowCor(f, true)}><i className="bi bi-file-text"></i></button>)}</div></td>
                                                <td><span className={`admin-status-badge ${appeal.status.toLowerCase()}`}>{appeal.status}</span></td>
                                                <td>{appeal.status === 'PENDING' && <div className="admin-flex-end"><button className="admin-btn-green" onClick={() => openActionModal('APPEAL', appeal, 'APPROVE')}>Approve</button><button className="admin-btn-red" onClick={() => openActionModal('APPEAL', appeal, 'REJECT')}>Reject</button></div>}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                       )}
                    </div>
                )}
                
                {renderPagination()}
            </>
        )}
      </div>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Delete Course</Modal.Title></Modal.Header>
        <Modal.Body>
            <p>Are you sure you want to delete the course <strong>{courseToDelete}</strong>?</p>
            <p className="text-muted small">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDeleteCourse}>Delete</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showActionModal} onHide={() => setShowActionModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>{actionData.title}</Modal.Title></Modal.Header>
        <Modal.Body>
            {actionData.targetStatus === 'VIEW' && actionData.details && (
                <div className="admin-details-view">
                    <p><strong>Subject Code:</strong> {actionData.details.subject_code}</p>
                    <p><strong>Course Name:</strong> {actionData.details.subject_name}</p>
                    <div className="p-2 bg-light rounded mb-2">{actionData.details.description || "No description provided."}</div>
                </div>
            )}
            {actionData.targetStatus !== 'VIEW' && <p>Are you sure you want to proceed?</p>}
            {actionData.type === 'REQUEST' && actionData.targetStatus === 'APPROVE' && (
                <>
                    <Form.Group className="mb-3"><Form.Label className="admin-fw-bold">Confirm Code:</Form.Label><Form.Control type="text" value={actionData.finalCode} onChange={(e) => setActionData({...actionData, finalCode: e.target.value})} /></Form.Group>
                    <Form.Group className="mb-3"><Form.Label className="admin-fw-bold">Confirm Name:</Form.Label><Form.Control type="text" value={actionData.finalName} onChange={(e) => setActionData({...actionData, finalName: e.target.value})} /></Form.Group>
                </>
            )}
            {actionData.noteRequired && <Form.Group><Form.Label>Reason / Note:</Form.Label><Form.Control as="textarea" rows={3} value={actionNote} onChange={(e) => setActionNote(e.target.value)} /></Form.Group>}
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowActionModal(false)}>Cancel</Button>
            {actionData.targetStatus !== 'VIEW' && <Button variant={actionData.targetStatus.includes('REJECT') || actionData.targetStatus.includes('BAN') ? 'danger' : 'success'} onClick={submitAction}>Confirm</Button>}
        </Modal.Footer>
      </Modal>

      <Modal show={showReportModal} onHide={() => setShowReportModal(false)} size="lg" centered>
            <Modal.Header closeButton><Modal.Title>User Reports</Modal.Title></Modal.Header>
            <Modal.Body>
                {reportList.length === 0 ? <p>No reports found.</p> : (
                    <div className="list-group">
                        {reportList.map(r => (
                            <div key={r.report_id} className="list-group-item">
                                <div className="d-flex justify-content-between"><h5 className="mb-1">{r.type}</h5><small>{r.date_submitted}</small></div>
                                <p className="mb-1">{r.description}</p><small className="text-muted">Reporter: {r.reporter_id}</small>
                            </div>
                        ))}
                    </div>
                )}
            </Modal.Body>
      </Modal>

      <Modal show={showCorModal} onHide={() => setShowCorModal(false)} size="xl" centered>
        <Modal.Header closeButton className="admin-doc-modal-header"><Modal.Title>Document Viewer</Modal.Title></Modal.Header>
        <Modal.Body className="admin-doc-modal-body">
          {selectedCorFile ? (selectedCorFile.toLowerCase().endsWith('.pdf') ? <iframe src={selectedCorFile} className="admin-doc-iframe" title="Doc"></iframe> : <img src={selectedCorFile} className="admin-doc-image" alt="Doc" />) : <div className="text-white p-5 text-center">No File</div>}
        </Modal.Body>
        <Modal.Footer className="admin-doc-modal-footer"><Button variant="light" onClick={() => setShowCorModal(false)}>Close</Button></Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminDashboard;