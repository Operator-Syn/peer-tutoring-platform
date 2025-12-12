import React, { useEffect, useState } from "react";
import "./appointments.css";
import placeholderImage from "../../assets/images/placeholders/placeholderImage.jpeg";

function Appointments() {
  const [rows, setRows] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [tutorId, setTutorId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [allRows, setAllRows] = useState([]);

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingAppId, setPendingAppId] = useState(null);

  const [activePage, setActivePage] = useState("appointments");
  const [loading, setLoading] = useState(true); // loading flag

  // helper: check if appointment date is in the past
  const isPastAppointment = (appointmentDate) => {
    if (!appointmentDate) return false;

    const today = new Date();
    const appt = new Date(appointmentDate);

    // treat whole day as valid; mark past only when day is strictly before today
    appt.setHours(23, 59, 59, 999);

    return appt < today;
  };

  useEffect(() => {
    async function fetchData() {
      try {
        // 1) get logged in user
        const resUser = await fetch("/api/auth/get_user", {
          credentials: "include",
        });
        if (!resUser.ok) {
          window.location.href = "/api/auth/login";
          return;
        }
        const loggedInUser = await resUser.json();
        const googleId = loggedInUser.sub;

        // 2) find tutee row
        const resTutees = await fetch("/api/tutee/all", {
          credentials: "include",
        });
        const tutees = await resTutees.json();
        const currentTutee = tutees.find((t) => t.google_id === googleId);
        if (!currentTutee) {
          setLoading(false);
          return;
        }
        const tuteeId = currentTutee.id_number;

        // 3) find tutor row
        const resTutors = await fetch("/api/tutor/all", {
          credentials: "include",
        });
        const tutors = await resTutors.json();
        const currentTutor = tutors.find((t) => t.tutor_id === tuteeId);
        if (!currentTutor) {
          setLoading(false);
          return;
        }
        setTutorId(currentTutor.tutor_id);

        // 4) pending requests
        const resPending = await fetch(
          `/api/requests/pending/${currentTutor.tutor_id}`,
          { credentials: "include" }
        );
        const pendingData = await resPending.json();
        setRows(pendingData);
        setAllRows(pendingData);

        // 5) booked appointments
        const resAppointments = await fetch(
          `/api/requests/appointments/${currentTutor.tutor_id}`,
          { credentials: "include" }
        );
        const appointmentsData = await resAppointments.json();
        setAppointments(appointmentsData);
      } catch (err) {
        console.error("Error fetching appointments:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
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
        .some((field) => field.toLowerCase().includes(query))
    );

    setRows(filtered);
  };

  const openConfirm = (appointment_id, action) => {
    setPendingAppId(appointment_id);
    setPendingAction(action);
    setShowConfirm(true);
  };

  const handleConfirmYes = async () => {
    await handleAction(pendingAppId, pendingAction);
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
        }
      );

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        alert(body?.error || `Failed to ${action} appointment (${res.status})`);
        return;
      }

      // remove from pending list
      setRows((prev) =>
        prev.filter((r) => r.appointment_id !== appointment_id)
      );
      setAllRows((prev) =>
        prev.filter((r) => r.appointment_id !== appointment_id)
      );

      // refresh appointments list
      const resAppointments = await fetch(
        `/api/requests/appointments/${tutorId}`,
        { credentials: "include" }
      );
      const appointmentsData = await resAppointments.json();
      setAppointments(appointmentsData);
    } catch (err) {
      console.error(err);
      alert("Network error. Check console.");
    }
  };

  // call /api/requests/appointments/finish/<appointment_id>
  const handleFinishAppointment = async (appointmentId) => {
    if (!appointmentId) {
      alert("Missing appointment ID.");
      return;
    }

    const ok = window.confirm(
      "Mark this session as finished? The tutee will then be able to rate it."
    );
    if (!ok) return;

    try {
      const res = await fetch(
        `/api/requests/appointments/finish/${appointmentId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Failed to finish appointment.");
        return;
      }

      // remove from appointments list in UI
      setAppointments((prev) =>
        prev.filter((a) => a.appointment_id !== appointmentId)
      );

      alert("Appointment marked as COMPLETED and added to session_rating.");
    } catch (err) {
      console.error("Error finishing appointment:", err);
      alert("Network error while finishing appointment.");
    }
  };

  // While loading, show loading UI instead of rendering the whole layout empty
  if (loading) {
    return (
      <div className="appointments-page-wrapper">
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
      {/* arrows */}
      {activePage === "appointments" && (
        <button
          type="button"
          className="page-arrow page-arrow-right"
          onClick={() => setActivePage("requests")}
        >
          ›
        </button>
      )}
      {activePage === "requests" && (
        <button
          type="button"
          className="page-arrow page-arrow-left"
          onClick={() => setActivePage("appointments")}
        >
          ‹
        </button>
      )}

      {/* sliding strip */}
      <div
        className={`appointments-slider ${
          activePage === "requests" ? "show-requests" : "show-appointments"
        }`}
      >
        {/* ===== PAGE 1: APPOINTMENTS ===== */}
        <div className="appointments-panel">
          <div
            className="container d-flex flex-column align-items-start justify-content-center py-4"
            style={{
              minHeight: "600px",
              marginTop: "140px",
              backgroundColor: "#F8F9FF",
              borderRadius: "5px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div className="w-80 px-3 px-md-5">
              <div className="text-start fw-bold display-5 mb-4 request-title">
                Appointments
              </div>
            </div>

            <div
              className="appointments-wrapper container my-5"
              style={{ backgroundColor: "transparent" }}
            >
              {appointments.length === 0 ? (
                <p className="no-appointments">No appointments available.</p>
              ) : (
                <div className="appointments-scroll d-flex flex-wrap justify-content-center">
                  {appointments.map((app) => {
                    const past = isPastAppointment(app.appointment_date);

                    return (
                      <div
                        className="card appointment-card"
                        key={app.appointment_id}
                        onClick={() => setSelectedApp(app)}
                      >
                        <img
                          className="card-img-top"
                          src={placeholderImage}
                          alt="Card cap"
                        />
                        <div className="card-body">
                          <h5 className="card-title">
                            Subject Code: {app.course_code}
                          </h5>
                          <p className="card-text">
                            Tutee:{" "}
                            {`${app.first_name || ""} ${
                              app.middle_name || ""
                            } ${app.last_name || ""}`
                              .trim()
                              .trim() || "N/A"}
                          </p>

                          <div className="card px-2 px-sm-3 px-md-1 border-0 shadow-none">
                            <div className="card-body text-end">
                              <p className="card-text mb-1">
                                {app.appointment_date}
                              </p>
                              <p className="card-text">
                                {app.start_time} - {app.end_time}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="card-footer d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            {past ? "Session finished" : "Session upcoming"}
                          </small>

                          {past && (
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={(e) => {
                                e.stopPropagation(); // don’t open the modal
                                handleFinishAppointment(app.appointment_id);
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
              )}
            </div>
          </div>
        </div>

        {/* ===== PAGE 2: REQUESTS ===== */}
        <div className="appointments-panel">
          <div
            className="container d-flex flex-column align-items-start requests py-4"
            style={{ minHeight: "600px", marginTop: "140px" }}
          >
            <div className="w-80 px-3 px-md-5">
              <div className="text-start fw-bold display-5 mb-4 request-title">
                Requests
              </div>
            </div>

            <div
              className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-3 mb-3 gap-3 w-100"
              style={{ marginBottom: "200px" }}
            >
              <div
                className="d-flex justify-content-center w-100 px-3 px-md-5"
                style={{ marginBottom: "1rem", marginTop: "-30px" }}
              >
                <div
                  className="d-flex w-100"
                  style={{
                    maxWidth: "700px",
                    marginLeft: "auto",
                  }}
                >
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

            <div
              className="appointments-scroll"
              style={{
                position: "relative",
                maxHeight: "60vh",
                overflowY: "auto",
                overflowX: "hidden",
                width: "100%",
                paddingRight: "9rem",
                marginTop: "2rem",
                marginBottom: "2rem",
                boxSizing: "border-box",
              }}
            >
              {rows.length === 0 ? (
                <div
                  className="text-center py-5"
                  style={{
                    color: "#4956AD",
                    fontWeight: "500",
                    fontSize: "1rem",
                    backgroundColor: "#F8F9FF",
                    borderRadius: "12px",
                    padding: "2rem 3rem",
                    margin: "1rem auto",
                    maxWidth: "600px",
                    width: "100%",
                    transform: "translateX(5rem)",
                  }}
                >
                  Sorry, no tutoring request.
                </div>
              ) : (
                rows.map((row) => (
                  <div
                    key={row.appointment_id}
                    className="alert custom-alert d-flex flex-column flex-md-row align-items-center justify-content-between mt-4 last-box p-3"
                    style={{
                      marginTop: "2rem",
                      marginLeft: "5rem",
                      marginRight: "5rem",
                      marginBottom: "5rem",
                      border: "2px solid #4956AD",
                      position: "relative",
                    }}
                  >
                    <div className="d-flex align-items-center mb-5 mb-md-0">
                      <div className="text-center">
                        <div
                          className="text-white d-flex justify-content-center align-items-center"
                          style={{
                            width: "9rem",
                            height: "6rem",
                            fontWeight: "bold",
                            borderRadius: "5%",
                            marginBottom: "0.6rem",
                            backgroundColor: "#4956AD",
                          }}
                        >
                          {row?.name
                            ?.split(" ")
                            .filter((n) => n)
                            .map((n) => n?.[0]?.toUpperCase() || "")
                            .join("")}
                        </div>

                        <div>
                          <span className="d-block small text-muted">
                            Subject Code
                          </span>
                          <span
                            className="d-block fw-bold"
                            style={{ color: "#4956AD" }}
                          >
                            {row.course_code}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="info-section flex-grow-1">
                      <div className="mb-1">
                        <span className="d-block small text-muted">Name</span>
                        <span className="d-block small fw-semibold">
                          {row.name}
                        </span>
                      </div>
                      <div className="mb-1">
                        <span className="d-block small text-muted">
                          ID Number
                        </span>
                        <span className="d-block small fw-semibold">
                          {row.tutee_id}
                        </span>
                      </div>
                    </div>

                    <div className="datetime-section">
                      <div className="mb-1">
                        <span className="d-block small text-muted">Date</span>
                        <span className="d-block small fw-semibold">
                          {row.appointment_date}
                        </span>
                      </div>

                      <div className="mb-1">
                        <span className="d-block small text-muted">
                          Day of Week
                        </span>
                        <span className="d-block small fw-semibold">
                          {row.day_of_week}
                        </span>
                      </div>

                      <div className="mb-1">
                        <span className="d-block small text-muted">
                          Preferred Time
                        </span>
                        <span className="d-block small fw-semibold">
                          {row.start_time} - {row.end_time}
                        </span>
                      </div>
                    </div>

                    <div
                      className="d-flex gap-4 action-buttons"
                      style={{
                        marginTop: "1.5rem",
                        marginLeft: "auto",
                      }}
                    >
                      <button
                        className="btn fw-semibold"
                        style={{
                          backgroundColor: "#F8F9FF",
                          color: "#4956AD",
                          border: "2px solid #4956AD",
                          fontSize: "1.1rem",
                          padding: "14px 40px",
                          borderRadius: "6px",
                        }}
                        onClick={() =>
                          openConfirm(row.appointment_id, "decline")
                        }
                      >
                        Decline
                      </button>

                      <button
                        className="btn fw-semibold"
                        style={{
                          backgroundColor: "#4956AD",
                          color: "white",
                          border: "none",
                          fontSize: "1.1rem",
                          padding: "14px 40px",
                          borderRadius: "6px",
                        }}
                        onClick={() =>
                          openConfirm(row.appointment_id, "accept")
                        }
                      >
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
              src={placeholderImage}
              alt="Card image cap"
              style={{ objectFit: "cover", height: "300px" }}
            />
            <div className="card-body">
              <p>
                <strong>Subject Code:</strong>{" "}
                {selectedApp?.course_code || "N/A"}
              </p>
              <p className="card-text">
                <strong>Tutee:</strong>{" "}
                {`${selectedApp?.first_name || ""} ${
                  selectedApp?.middle_name || ""
                } ${selectedApp?.last_name || ""}`
                  .trim()
                  .trim() || "N/A"}
              </p>
              <p className="card-text">
                <strong>Time:</strong> {selectedApp?.start_time || "N/A"} -{" "}
                {selectedApp?.end_time || "N/A"}
              </p>
              <p className="card-text">
                <strong>Date:</strong>{" "}
                {selectedApp?.appointment_date || "N/A"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirm action modal */}
      {showConfirm && (
        <div
          className="confirm-overlay"
          onClick={() => setShowConfirm(false)}
        >
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <h5>Confirm Action</h5>
            <p>
              {pendingAction === "accept"
                ? "Are you sure you want to accept this request?"
                : "Are you sure you want to decline this request?"}
            </p>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button
                className="btn my-no-btn"
                onClick={() => setShowConfirm(false)}
              >
                No
              </button>
              <button className="btn my-yes-btn" onClick={handleConfirmYes}>
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Appointments;
