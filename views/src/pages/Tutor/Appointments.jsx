import { useEffect, useMemo, useState } from "react";
import "./appointments.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRoleRedirect } from "../../hooks/useRoleRedirect";

function Appointments() {
  useRoleRedirect("TUTOR");

  // --- CDN CONSTANTS (same style as your teammate) ---
  const APPOINTMENT_SUBMITTED_URL =
    "https://wedygbolktkdbpxxrlcr.supabase.co/storage/v1/object/public/assets/appointment-submitted.png";
  const SCHEDULE_OWL_URL =
    "https://wedygbolktkdbpxxrlcr.supabase.co/storage/v1/object/public/assets/schedule-owl.png";
  const APPROVING_OWL_URL =
    "https://wedygbolktkdbpxxrlcr.supabase.co/storage/v1/object/public/assets/approving-owl.png";
  const SAD_OWL_URL =
    "https://wedygbolktkdbpxxrlcr.supabase.co/storage/v1/object/public/assets/sad-owl.png";
  const CROPPED_WAITING_URL =
    "https://wedygbolktkdbpxxrlcr.supabase.co/storage/v1/object/public/assets/cropped-waiting.png";

  const [rows, setRows] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);

  const [tutorId, setTutorId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [allRows, setAllRows] = useState([]);

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // "accept" | "decline" | "finish"
  const [pendingAppId, setPendingAppId] = useState(null);

  const [activePage, setActivePage] = useState("appointments");
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | BOOKED | COMPLETED | CANCELLED

  const toastOpts = {
    position: "top-right",
    autoClose: 2500,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  };

  const isPastAppointment = (appointmentDate) => {
    if (!appointmentDate) return false;
    const today = new Date();
    const appt = new Date(appointmentDate);
    appt.setHours(23, 59, 59, 999);
    return appt < today;
  };

  const refreshPending = async (id) => {
    const resPending = await fetch(`/api/requests/pending/${id}`, {
      credentials: "include",
    });
    const pendingData = await resPending.json().catch(() => []);
    setRows(pendingData);
    setAllRows(pendingData);
  };

  const refreshAppointments = async (id) => {
    const resAppointments = await fetch(
      `/api/requests/appointments/${id}?status=BOOKED,COMPLETED,CANCELLED`,
      { credentials: "include" }
    );
    const appointmentsData = await resAppointments.json().catch(() => []);
    setAppointments(appointmentsData);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const resUser = await fetch("/api/auth/get_user", {
          credentials: "include",
        });
        if (!resUser.ok) {
          toast.error("Session expired. Redirecting to login...", toastOpts);
          window.location.href = "/api/auth/login";
          return;
        }

        const loggedInUser = await resUser.json();
        const googleId = loggedInUser.sub;

        const resTutees = await fetch("/api/tutee/all", {
          credentials: "include",
        });
        if (!resTutees.ok) {
          toast.error("Failed to load tutee list.", toastOpts);
          return;
        }
        const tutees = await resTutees.json();
        const currentTutee = tutees.find((t) => t.google_id === googleId);

        if (!currentTutee) {
          toast.error("Tutee account not found.", toastOpts);
          return;
        }

        const tuteeId = currentTutee.id_number;

        const resTutors = await fetch("/api/tutor/all", {
          credentials: "include",
        });
        if (!resTutors.ok) {
          toast.error("Failed to load tutor list.", toastOpts);
          return;
        }
        const tutors = await resTutors.json();
        const currentTutor = tutors.find((t) => t.tutor_id === tuteeId);

        if (!currentTutor) {
          toast.info("You are not registered as a tutor.", toastOpts);
          return;
        }

        setTutorId(currentTutor.tutor_id);

        await refreshPending(currentTutor.tutor_id);
        await refreshAppointments(currentTutor.tutor_id);
      } catch (err) {
        console.error("Error fetching appointments:", err);
        toast.error("Network error while loading data.", toastOpts);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return setRows(allRows);

    const filtered = allRows.filter((row) =>
      [
        row.name,
        row.tutee_id,
        row.course_code,
        row.program_code,
        row.status,
        row.appointment_date,
        row.day_of_week,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query))
    );

    setRows(filtered);
  };

  const openConfirm = (appointment_id, action) => {
    setPendingAppId(appointment_id);
    setPendingAction(action);
    setShowConfirm(true);
  };

  const handleConfirmYes = async () => {
    if (!pendingAppId || !pendingAction) {
      setShowConfirm(false);
      return;
    }

    if (pendingAction === "finish") {
      await finishAppointmentConfirmed(pendingAppId);
    } else {
      await handleAction(pendingAppId, pendingAction);
    }

    setShowConfirm(false);
    setPendingAppId(null);
    setPendingAction(null);
  };

const handleAction = async (appointment_id, action) => {
  if (!tutorId) return;

  try {
    const res = await fetch(
      `/api/requests/update-status-and-log/${appointment_id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
        credentials: "include",
      }
    );

    const body = await res.json().catch(() => ({}));

    if (res.status === 409) {
      toast.error(
        body?.error || "This appointment schedule is already taken. Please choose another slot.",
        toastOpts
      );
      await refreshPending(tutorId);
      await refreshAppointments(tutorId);
      return;
    }


    if (!res.ok) {
      toast.error(body?.error || `Failed to ${action} appointment`, toastOpts);
      return;
    }


    if (action === "accept") {
      toast.success("Request accepted!", toastOpts);

      if (body.auto_cancelled > 0) {
        toast.info(
          `⚠️ ${body.auto_cancelled} other request(s) with the same schedule were automatically cancelled.`,
          toastOpts
        );
      }
    } else {
      toast.success("Request declined.", toastOpts);
    }

    await refreshPending(tutorId);
    await refreshAppointments(tutorId);
  } catch (err) {
    console.error(err);
    toast.error("Network error. Please try again.", toastOpts);
  }
};


  const finishAppointmentConfirmed = async (appointmentId) => {
    if (!appointmentId) {
      toast.error("Missing appointment ID.", toastOpts);
      return;
    }

    try {
      const res = await fetch(`/api/requests/appointments/finish/${appointmentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to finish appointment.", toastOpts);
        return;
      }

      toast.success("Appointment marked as COMPLETED. Rating is now available.", toastOpts);

      if (tutorId) await refreshAppointments(tutorId);
    } catch (err) {
      console.error("Error finishing appointment:", err);
      toast.error("Network error while finishing appointment.", toastOpts);
    }
  };

  const statusRank = (s) => {
    const st = (s || "").toUpperCase();
    if (st === "BOOKED") return 0;
    if (st === "COMPLETED") return 1;
    if (st === "CANCELLED") return 2;
    return 99;
  };

  const filteredAppointments = useMemo(() => {
    const list = Array.isArray(appointments) ? [...appointments] : [];

    const byFilter =
      statusFilter === "ALL"
        ? list
        : list.filter((a) => (a.status || "").toUpperCase() === statusFilter);

    byFilter.sort((a, b) => {
      const r = statusRank(a.status) - statusRank(b.status);
      if (r !== 0) return r;

      const da = new Date(a.appointment_date || "1970-01-01").getTime();
      const db = new Date(b.appointment_date || "1970-01-01").getTime();
      if (da !== db) return da - db;

      return String(a.start_time || "").localeCompare(String(b.start_time || ""));
    });

    return byFilter;
  }, [appointments, statusFilter]);

  // ✅ map status -> image url
  const getCardImageUrl = (status) => {
    const st = String(status || "").toUpperCase();
    if (st === "BOOKED") return APPROVING_OWL_URL;
    if (st === "COMPLETED") return SCHEDULE_OWL_URL;
    if (st === "CANCELLED") return SAD_OWL_URL;
    return APPOINTMENT_SUBMITTED_URL;
  };

  const renderCards = (list) => (
    <div className="appointments-scroll d-flex flex-wrap justify-content-center">
      {list.map((app) => {
        const past = isPastAppointment(app.appointment_date);
        const status = (app.status || "").toUpperCase();

        return (
          <div
            className="card appointment-card"
            key={`${status}-${app.appointment_id}`}
            onClick={() => setSelectedApp(app)}
          >
            <img
              className="card-img-top"
              src={getCardImageUrl(status)}
              alt="Appointment"
              style={{ objectFit: "cover", height: "220px" }}
              onError={(e) => {
                // fallback if the supabase file name is wrong
                e.currentTarget.src = CROPPED_WAITING_URL;
              }}
            />

            <div className="card-body">
              <h5 className="card-title">Subject Code: {app.course_code}</h5>

              <p className="card-text">
                Tutee:{" "}
                {`${app.first_name || ""} ${app.middle_name || ""} ${app.last_name || ""}`.trim() ||
                  "N/A"}
              </p>

              <div className="card px-2 px-sm-3 px-md-1 border-0 shadow-none">
                <div className="card-body text-end">
                  <p className="card-text mb-1">{app.appointment_date}</p>
                  <p className="card-text">
                    {app.start_time} - {app.end_time}
                  </p>
                </div>
              </div>
            </div>

            <div className="card-footer d-flex justify-content-between align-items-center">
              <small className="text-muted">
                Status: <strong>{status}</strong>
              </small>

              {status === "BOOKED" && past && (
                <button
                  className="btn btn-sm btn-outline-success"
                  onClick={(e) => {
                    e.stopPropagation();
                    openConfirm(app.appointment_id, "finish");
                  }}
                >
                  Mark as done
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  if (loading) {
    return (
      <div className="appointments-page-wrapper">
        <ToastContainer newestOnTop limit={2} theme="light" />
        <div className="appointments-loading">
          <div className="appointments-loading-box">
            <div className="spinner-border" role="status" />
            <span className="ms-2">Loading your appointments...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="appointments-page-wrapper">
      <ToastContainer newestOnTop limit={2} theme="light" />

      {activePage === "appointments" && (
        <button type="button" className="page-arrow page-arrow-right" onClick={() => setActivePage("requests")}>
          ›
        </button>
      )}
      {activePage === "requests" && (
        <button type="button" className="page-arrow page-arrow-left" onClick={() => setActivePage("appointments")}>
          ‹
        </button>
      )}

      <div className={`appointments-slider ${activePage === "requests" ? "show-requests" : "show-appointments"}`}>
        {/* PAGE 1: APPOINTMENTS */}
        <div className="appointments-panel">
          <div
            className="container d-flex flex-column align-items-start justify-content-start py-4"
            style={{
              minHeight: "700px",
              marginTop: "140px",
              backgroundColor: "#F8F9FF",
              borderRadius: "5px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div className="w-100 px-0 d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
              <div className="text-start fw-bold display-5 mb-0 request-title">Appointments</div>

              <div
                className="d-flex align-items-center w-100"
                style={{
                  maxWidth: "360px",
                  padding: "8px 12px",
                  borderRadius: "14px",
                  border: "1px solid rgba(73, 86, 173, 0.25)",
                  background: "rgba(248, 249, 255, 0.9)",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
                  gap: "10px",
                }}
              >
                <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#4956AD", whiteSpace: "nowrap" }}>
                  Filter:
                </span>

                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    borderRadius: "12px",
                    border: "1px solid rgba(73, 86, 173, 0.25)",
                    backgroundColor: "#fff",
                    fontWeight: 600,
                    color: "#4956AD",
                    padding: "10px 14px",
                  }}
                >
                  <option value="ALL">All</option>
                  <option value="BOOKED">Booked</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="appointments-wrapper container my-2" style={{ backgroundColor: "transparent" }}>
              {filteredAppointments.length === 0 ? (
                <p className="no-appointments" style={{ marginTop: "140px" }}>
                  No appointments available.
                </p>
              ) : (
                renderCards(filteredAppointments)
              )}
            </div>
          </div>
        </div>

        {/* PAGE 2: REQUESTS */}
        <div className="appointments-panel">
          {/* keep your existing Requests panel here (unchanged) */}
          <div className="container d-flex flex-column align-items-start requests py-4" style={{ minHeight: "700px", marginTop: "140px" }}>
            <div className="w-80 px-3 px-md-5">
              <div className="text-start fw-bold display-5 mb-4 request-title">Appointment Request</div>
            </div>

            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-3 mb-3 gap-3 w-100" style={{ marginBottom: "200px" }}>
              <div className="d-flex justify-content-center w-100 px-3 px-md-5" style={{ marginBottom: "1rem", marginTop: "-30px" }}>
                <div className="d-flex w-100" style={{ maxWidth: "700px", marginLeft: "auto" }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search appointments..."
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      height: "60px",
                      fontSize: "1.1rem",
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                      borderTopLeftRadius: 40,
                      borderBottomLeftRadius: 40,
                      outline: "none",
                    }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearch();
                    }}
                  />
                  <button
                    className="btn btn-success"
                    style={{
                      fontSize: "1.1rem",
                      padding: "12px 45px",
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      borderTopRightRadius: 40,
                      borderBottomRightRadius: 40,
                      backgroundColor: "#4956AD",
                      border: "none",
                    }}
                    onClick={handleSearch}
                  >
                    Enter
                  </button>
                </div>
              </div>
            </div>

            {/* show pending rows (unchanged) */}
            <div className="appointments-scroll" style={{ position: "relative", maxHeight: "60vh", overflowY: "auto", overflowX: "hidden", width: "100%", paddingRight: "9rem", marginTop: "2rem", marginBottom: "2rem", boxSizing: "border-box" }}>
              {rows.length === 0 ? (
                <div className="text-center py-5" style={{ color: "#4956AD", fontWeight: "500", fontSize: "1rem", backgroundColor: "#F8F9FF", borderRadius: "12px", padding: "2rem 3rem", margin: "1rem auto", maxWidth: "600px", width: "100%", transform: "translateX(5rem)" }}>
                  Sorry, no tutoring request.
                </div>
              ) : (
                rows.map((row) => (
                  <div key={row.appointment_id} className="alert custom-alert d-flex flex-column flex-md-row align-items-center justify-content-between mt-4 last-box p-3" style={{ marginTop: "2rem", marginLeft: "5rem", marginRight: "5rem", marginBottom: "5rem", border: "2px solid #4956AD", position: "relative" }}>
                    {/* keep your existing pending card content here */}
                    <div className="info-section flex-grow-1">
                      <div className="mb-1">
                        <span className="d-block small text-muted">Name</span>
                        <span className="d-block small fw-semibold">{row.name}</span>
                      </div>
                      <div className="mb-1">
                        <span className="d-block small text-muted">ID Number</span>
                        <span className="d-block small fw-semibold">{row.tutee_id}</span>
                      </div>
                    </div>

                    <div className="datetime-section">
                      <div className="mb-1">
                        <span className="d-block small text-muted">Date</span>
                        <span className="d-block small fw-semibold">{row.appointment_date}</span>
                      </div>
                      <div className="mb-1">
                        <span className="d-block small text-muted">Day of Week</span>
                        <span className="d-block small fw-semibold">{row.day_of_week}</span>
                      </div>
                      <div className="mb-1">
                        <span className="d-block small text-muted">Preferred Time</span>
                        <span className="d-block small fw-semibold">
                          {row.start_time} - {row.end_time}
                        </span>
                      </div>
                    </div>

                    <div className="d-flex gap-4 action-buttons" style={{ marginTop: "1.5rem", marginLeft: "auto" }}>
                      <button className="btn fw-semibold" style={{ backgroundColor: "#F8F9FF", color: "#4956AD", border: "2px solid #4956AD", fontSize: "1.1rem", padding: "14px 40px", borderRadius: "6px" }} onClick={() => openConfirm(row.appointment_id, "decline")}>
                        Decline
                      </button>

                      <button className="btn fw-semibold" style={{ backgroundColor: "#4956AD", color: "white", border: "none", fontSize: "1.1rem", padding: "14px 40px", borderRadius: "6px" }} onClick={() => openConfirm(row.appointment_id, "accept")}>
                        Accept
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="confirm-overlay" onClick={() => setShowConfirm(false)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <h5>Confirm Action</h5>
            <p>
              {pendingAction === "accept"
                ? "Are you sure you want to accept this request?"
                : pendingAction === "decline"
                ? "Are you sure you want to decline this request?"
                : "Mark this session as finished? The tutee will then be able to rate it."}
            </p>

            <div className="d-flex justify-content-end gap-2 mt-3">
              <button className="btn my-no-btn" onClick={() => setShowConfirm(false)}>
                No
              </button>
              <button className="btn my-yes-btn" onClick={handleConfirmYes}>
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment details modal */}
      {selectedApp && (
        <div
          onClick={() => setSelectedApp(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="card"
            style={{
              width: "40rem",
              minHeight: "500px",
              padding: "1rem",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedApp(null)}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                border: "none",
                background: "transparent",
                fontSize: "1.5rem",
                cursor: "pointer",
              }}
            >
              &times;
            </button>

            <img
              className="card-img-top"
              src={getCardImageUrl(selectedApp?.status)}
              alt="Appointment"
              style={{ objectFit: "cover", height: "300px" }}
              onError={(e) => {
                e.currentTarget.src = CROPPED_WAITING_URL;
              }}
            />

            <div className="card-body">
              <p>
                <strong>Subject Code:</strong> {selectedApp?.course_code || "N/A"}
              </p>
              <p className="card-text">
                <strong>Tutee:</strong>{" "}
                {`${selectedApp?.first_name || ""} ${selectedApp?.middle_name || ""} ${selectedApp?.last_name || ""}`.trim() ||
                  "N/A"}
              </p>
              <p className="card-text">
                <strong>Time:</strong> {selectedApp?.start_time || "N/A"} -{" "}
                {selectedApp?.end_time || "N/A"}
              </p>
              <p className="card-text">
                <strong>Date:</strong> {selectedApp?.appointment_date || "N/A"}
              </p>
              <p className="card-text">
                <strong>Status:</strong> {(selectedApp?.status || "").toUpperCase() || "N/A"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Appointments;
