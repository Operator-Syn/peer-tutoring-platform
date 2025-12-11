import React, { useEffect, useState } from "react";
import "./appointments.css";
import placeholderImage from "../../assets/images/placeholders/placeholderImage.jpeg";

function Appointments() {
  const [rows, setRows] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [tutorId, setTutorId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [allRows, setAllRows] = useState([]); // backup for filtering

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingAppId, setPendingAppId] = useState(null);

  // 🔹 New: confirmation for "Mark as finished"
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [finishAppId, setFinishAppId] = useState(null);

  const [activePage, setActivePage] = useState("appointments");

  useEffect(() => {
    async function fetchData() {
      try {
        // 1) Logged-in user
        const resUser = await fetch("/api/auth/get_user", {
          credentials: "include",
        });
        if (!resUser.ok) {
          window.location.href = "/api/auth/login";
          return;
        }
        const loggedInUser = await resUser.json();
        const googleId = loggedInUser.sub;

        // 2) Find tutee row
        const resTutees = await fetch("/api/tutee/all");
        const tutees = await resTutees.json();
        const currentTutee = tutees.find((t) => t.google_id === googleId);
        if (!currentTutee) return;
        const tuteeId = currentTutee.id_number;

        // 3) Find tutor row
        const resTutors = await fetch("/api/tutor/all");
        const tutors = await resTutors.json();
        const currentTutor = tutors.find((t) => t.tutor_id === tuteeId);
        if (!currentTutor) return;
        setTutorId(currentTutor.tutor_id);

        // 4) Pending requests
        const resPending = await fetch(
          `/api/requests/pending/${currentTutor.tutor_id}`
        );
        const pendingData = await resPending.json();
        setRows(pendingData);
        setAllRows(pendingData);

        // 5) Accepted appointments
        const resAppointments = await fetch(
          `/api/requests/appointments/${currentTutor.tutor_id}`
        );
        const appointmentsData = await resAppointments.json();
        setAppointments(appointmentsData);
      } catch (err) {
        console.error("Error fetching appointments:", err);
      }
    }

    fetchData();
  }, []);

  // ===== Helpers for appointments =====

  const isPastAppointment = (app) => {
    if (!app.appointment_date || !app.end_time) return false;

    // appointment_date might be "2025-12-11" or "2025-12-11T00:00:00"
    const datePart = app.appointment_date.split("T")[0];

    const endDateTimeString = `${datePart}T${app.end_time}:00`;
    const endDateTime = new Date(endDateTimeString);

    if (isNaN(endDateTime.getTime())) {
      console.warn("Invalid endDateTime for app:", app, endDateTimeString);
      return false;
    }

    return endDateTime.getTime() < Date.now();
  };

  // 🔹 Finish appointment -> calls /appointments/finish + removes from state
  const handleFinishAppointment = async (appointmentId) => {
    if (!appointmentId) return;

    try {
      const res = await fetch(
        `/api/requests/appointments/finish/${appointmentId}`,
        { method: "POST" }
      );

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        alert(body?.error || "Failed to finish appointment");
        return;
      }

      // Remove from local state so UI updates
      setAppointments((prev) =>
        prev.filter(
          (a) =>
            (a.appointment_id ?? a.request_id) !== appointmentId
        )
      );
    } catch (err) {
      console.error("Error finishing appointment:", err);
      alert("Network error while finishing appointment.");
    }
  };

  // ===== Search filter for requests =====
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

  // ===== Confirm modal helpers (accept/decline) =====
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

      // Remove from pending rows
      setRows((prev) =>
        prev.filter((r) => r.appointment_id !== appointment_id)
      );
      setAllRows((prev) =>
        prev.filter((r) => r.appointment_id !== appointment_id)
      );

      // Refresh appointments
      const resAppointments = await fetch(
        `/api/requests/appointments/${tutorId}`
      );
      const appointmentsData = await resAppointments.json();
      setAppointments(appointmentsData);
    } catch (err) {
      console.error(err);
      alert("Network error. Check console.");
    }
  };

  // 🔹 Confirm helpers for "Mark as finished"
  const openFinishConfirm = (appointmentId) => {
    setFinishAppId(appointmentId);
    setShowFinishConfirm(true);
  };

  const handleFinishConfirmYes = async () => {
    await handleFinishAppointment(finishAppId);
    setShowFinishConfirm(false);
    setFinishAppId(null);
  };

  return (
    <div className="appointments_page">
      {/* ===== SLIDER WRAPPER (two pages: Appointments + Requests) ===== */}
      <div className="appointments-page-wrapper">
        {/* Arrows */}
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

        {/* Slider that moves left/right */}
        <div
          className={`appointments-slider ${
            activePage === "requests"
              ? "show-requests"
              : "show-appointments"
          }`}
        >
          {/* ===== PAGE 1: APPOINTMENTS ===== */}
          <div className="appointments-panel">
            <div
              className="container d-flex flex-column align-items-start requests py-4"
              style={{
                minHeight: "700px",
                marginTop: "90px",
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
                  <p
                    className="no-appointments"
                    style={{ color: "#4956AD" }}
                  >
                    No appointments available.
                  </p>
                ) : (
                  <div className="appointments-scroll d-flex flex-wrap justify-content-center">
                    {appointments.map((app) => {
                      const id = app.appointment_id ?? app.request_id;
                      return (
                        <div
                          className="card appointment-card"
                          key={id}
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
                              {isPastAppointment(app)
                                ? "Session finished"
                                : "Upcoming session"}
                            </small>

                            {isPastAppointment(app) && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={(e) => {
                                  e.stopPropagation(); // don't open modal
                                  openFinishConfirm(id);
                                }}
                              >
                                Mark as finished
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
              style={{ minHeight: "600px", marginTop: "90px" }}
            >
              <div className="w-80 px-3 px-md-5">
                <div className="text-start fw-bold display-5 mb-4 request-title">
                  Requests
                </div>
              </div>

              {/* Search bar */}
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

              {/* Pending requests list */}
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
                      {/* Avatar + Subject Code */}
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

                      {/* Info Section */}
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

                      {/* Date / Time */}
                      <div className="datetime-section">
                        <div className="mb-1">
                          <span className="d-block small text-muted">
                            Date
                          </span>
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

                      {/* Buttons */}
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
      </div>

      {/* ===== APPOINTMENT MODAL ===== */}
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

      {/* ===== CONFIRM MODAL (Accept / Decline) ===== */}
      {showConfirm && (
        <div
          className="confirm-overlay"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="confirm-box"
            onClick={(e) => e.stopPropagation()}
          >
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
              <button
                className="btn my-yes-btn"
                onClick={handleConfirmYes}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 CONFIRM MODAL (Mark as finished) */}
      {showFinishConfirm && (
        <div
          className="confirm-overlay"
          onClick={() => setShowFinishConfirm(false)}
        >
          <div
            className="confirm-box"
            onClick={(e) => e.stopPropagation()}
          >
            <h5>Mark Session as Finished</h5>
            <p>Are you sure you want to mark this session as finished?</p>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button
                className="btn my-no-btn"
                onClick={() => setShowFinishConfirm(false)}
              >
                No
              </button>
              <button
                className="btn my-yes-btn"
                onClick={handleFinishConfirmYes}
              >
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
