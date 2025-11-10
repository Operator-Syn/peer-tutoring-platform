import React, { useEffect, useState } from "react";
import "./appointments.css";
import placeholderImage from "../../assets/images/placeholders/placeholderImage.jpeg";
function Appointments() {
  const [rows, setRows] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

useEffect(() => {
  async function fetchData() {
    try {
      console.log("🔹 Fetching logged-in user...");
      const resUser = await fetch("/api/auth/get_user", { credentials: "include" });
      if (!resUser.ok) {
        console.warn("❌ Not logged in, redirecting...");
        window.location.href = "/api/auth/login";
        return;
      }
      const loggedInUser = await resUser.json();
      console.log("✅ Logged in user:", loggedInUser);

      const googleId = loggedInUser.sub;

      console.log("🔹 Fetching all tutees...");
      const resTutees = await fetch("/api/tutee/all");
      const tutees = await resTutees.json();
      console.log("✅ Tutees:", tutees);

      const currentTutee = tutees.find(t => t.google_id === googleId);
      if (!currentTutee) {
        console.error("❌ No tutee found for Google ID:", googleId);
        return;
      }
      console.log("✅ Found tutee:", currentTutee);

      const tuteeId = currentTutee.id_number;

      console.log("🔹 Fetching tutors...");
      const resTutors = await fetch("/api/tutor/all");
      const tutors = await resTutors.json();
      console.log("✅ Tutors:", tutors);

      const currentTutor = tutors.find(t => t.tutor_id === tuteeId);
      if (!currentTutor) {
        console.error("❌ This user is not registered as a tutor.");
        return;
      }
      console.log("✅ Found tutor:", currentTutor);

      const tutorId = currentTutor.tutor_id;

      console.log("🔹 Fetching pending requests...");
      const resPending = await fetch(`/api/requests/pending/${tutorId}`);
      const pendingData = await resPending.json();
      console.log("✅ Pending requests:", pendingData);
      setRows(pendingData);

      console.log("🔹 Fetching appointments...");
      const resAppointments = await fetch(`/api/requests/appointments/${tutorId}`);
      const appointmentsData = await resAppointments.json();
      console.log("✅ Appointments:", appointmentsData);
      setAppointments(appointmentsData);
    } catch (err) {
      console.error("💥 Error in fetchData:", err);
    }
  }

  fetchData();
}, []);


 



const handleSearch = async () => {
  try {
    const query = searchTerm.trim();

    // Get the logged-in user dynamically
    const resUser = await fetch("/api/auth/get_user", { credentials: "include" });
    if (!resUser.ok) throw new Error("User not authenticated");
    const loggedInUser = await resUser.json();
    const googleId = loggedInUser.sub;

    // Fetch tutees to find their ID number
    const resTutees = await fetch("/api/tutee/all");
    const tutees = await resTutees.json();
    const currentTutee = tutees.find(t => t.google_id === googleId);

    if (!currentTutee) {
      console.error("No tutee found for this user");
      return;
    }

    const tuteeId = currentTutee.id_number;

    // Fetch tutors and match by tuteeId
    const resTutors = await fetch("/api/tutor/all");
    const tutors = await resTutors.json();
    const currentTutor = tutors.find(t => t.tutor_id === tuteeId);

    if (!currentTutor) {
      console.error("Tutor not found for this user");
      return;
    }

    const tutorId = currentTutor.tutor_id;

    // If search bar empty → reload all pending requests
    if (!query) {
      const res = await fetch(`/api/requests/pending/${tutorId}`);
      const data = await res.json();
      setRows(data);
      return;
    }

    // Otherwise, perform filtered search
    const res = await fetch(
      `/api/requests/search?tutor_id=${tutorId}&q=${encodeURIComponent(query)}`
    );
    if (!res.ok) throw new Error("Failed to fetch search results");
    const data = await res.json();
    setRows(data);

  } catch (err) {
    console.error("Search error:", err);
    alert("Error searching appointments. Check console for details.");
  }
};




const handleAccept = async (id) => {
  try {
    const res = await fetch(`/api/requests/update-status/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED" }),
    });

    const body = await res.json().catch(() => null);

    if (!res.ok) {
      console.error("Update failed:", res.status, body);
      alert(body?.error || `Failed to accept request (${res.status})`);
      return;
    }

    // Remove request from pending requests
    setRows((prev) => prev.filter((r) => r.request_id !== id));

    // Fetch updated appointments
    const tutorId = "2023-3984"; // replace with current tutor
    const apptRes = await fetch(`/api/requests/appointments/${tutorId}`);
    const appointments = await apptRes.json();

    // Update appointments state
    setAppointments(appointments); // assuming you have useState for appointments
  } catch (err) {
    console.error("Network error updating status:", err);
    alert("Network error. Check console for details.");
  }
};



const handleDecline = (id) => {
  fetch(`/api/requests/delete/${id}`, {
    method: "DELETE",
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("Deleted:", data);
      
      setRows((prev) => prev.filter((r) => r.request_id !== id));
    })
    .catch((err) => console.error("Error deleting request:", err));
};



 

  return (
    <div className="appointments_page">
      <div
  className="container d-flex flex-column align-items-center requests py-4"
  style={{ minHeight: "600px", marginTop: "180px"}} 
>
  
{/* Search & Filter */}
<div
  className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-5 mt-md-n2 mb-3 gap-3 w-100"
  style={{ marginTop: "10px", marginBottom: "200px" }}
>


<div style={{ position: "relative", display: "inline-block" }}>
</div>



 
{/* Search Input + Enter Button */}
{/* Search Input + Enter Button */}
<div 
  className="d-flex justify-content-center w-100 px-3 px-md-5"
  style={{ marginBottom: "1rem" }}
>
  <div 
    className="d-flex w-100" 
    style={{ 
      maxWidth: "700px", 
      marginLeft: "auto", // pushes slightly to the right
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
      }}
      onClick={handleSearch}
    >
      Enter
    </button>
  </div>
</div>




</div>


        {/* Appointment Cards */}
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
  Sorry unavailable...
</div>

  ) : (
    rows.map((row) => (
      <div
        key={row.request_id}
        className="alert custom-alert d-flex flex-column flex-md-row align-items-center justify-content-between mt-4 last-box p-3"
        style={{
          marginTop: "102rem",
          marginLeft: "5rem",
          marginRight: "5rem",
          marginBottom: "5rem",
        }}
      >
        {/* Avatar + College Code */}
        <div className="d-flex align-items-center mb-5 mb-md-0">
          <div className="text-center ">
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
              {row.initials}
            </div>
            <div>
              <span className="d-block small text-muted">Subject Code</span>
              <span className="d-block fw-bold" style={{ color: "#4956AD" }}>
                {row.course_code}
              </span>
            </div>
          </div>
        </div>

        <div className="info-section flex-grow-1">
          <div className="mb-1">
            <span className="d-block small text-muted">Name</span>
            <span className="d-block small fw-semibold">{row.name}</span>
          </div>
          <div className="mb-1">
            <span className="d-block small text-muted">ID Number</span>
            <span className="d-block small fw-semibold">{row.tutee_id}</span>
          </div>
          <div className="d-flex flex-column">
            <span className="d-block small text-muted">Program Code</span>
            <span className="d-block small fw-semibold">{row.program_code || "N/A"}</span>
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
            <span className="d-block small text-muted">Day of Week</span>
            <span className="d-block small fw-semibold">
              {row.day_of_week|| "N/A"}
            </span>
          </div>
          <div className="mb-1">
            <span className="d-block small text-muted">Preferred Time</span>
            <span className="d-block small fw-semibold">
              {row.start_time} - {row.end_time}
            </span>
          </div>
           
        </div>

        <div
          className="position-absolute d-flex gap-4 action-buttons"
          style={{ bottom: "-3rem", right: "1rem" }}
        >
          <button
            className="btn fw-semibold"
            style={{
              backgroundColor: "#F8F9FF",
              color: "#4956AD",
              border: "2px solid #4956AD",
              fontSize: "1.1rem",
              padding: "14px 80px",
              borderRadius: "6px",
            }}
            onClick={() => handleDecline(row.request_id)}
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
              padding: "14px 80px",
              borderRadius: "6px",
            }}
            onClick={() => handleAccept(row.request_id)}
          >
            Accept
          </button>
        </div>
      </div>
    ))
  )}
</div>


</div>

   
      {/* No Issues Found */}
<div
      className="container d-flex flex-column align-items-center justify-content-center py-4"
      style={{
        minHeight: "600px",
        marginTop: "180px",
        backgroundColor: "#F8F9FF",
        borderRadius: "5px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
      }}
    >
      <div className="container my-5">
        {appointments.length === 0 ? (
          <p style={{ color: "white", textAlign: "center" }}>
            No appointments available.
          </p>
        ) : (
          <div
            className="d-flex flex-wrap justify-content-center"
            style={{ gap: "3rem" }}
          >
            {appointments.map((app) => (
              <div
                className="card"
                style={{ width: "23rem", minHeight: "400px", cursor: "pointer" }}
                key={app.request_id}
                onClick={() => setSelectedApp(app)}
              >
                <img
                  className="card-img-top"
                  src={placeholderImage}
                  alt="Card image cap"
                  style={{ objectFit: "cover", height: "250px" }}
                />
                <div className="card-body">
                  <h5 className="card-title">Subject Code: {app.course_code}</h5>
                  <p className="card-text">
  Tutee: {app.first_name} {app.middle_name} {app.last_name}
</p>


                  <div
                    className="card px-2 px-sm-3 px-md-1"
                    style={{ border: "none", boxShadow: "none" }}
                  >
                    <div className="card-body text-end">
                      <p className="card-text mb-1">{app.appointment_date}</p>
                      <p className="card-text">
                        {app.start_time} - {app.end_time}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="card-footer d-flex justify-content-between">
                  <small className="text-muted">Session started</small>
                  <div></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal overlay */}
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
            onClick={(e) => e.stopPropagation()} // prevent modal close on inner click
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
              <h5 className="card-title">
                Subject Code: {selectedApp.course_code}
              </h5>
              <p className="card-text">Tutee: {selectedApp.name}</p>
              <p className="card-text">
                {selectedApp.start_time} - {selectedApp.end_time}
              </p>
              <p className="card-text">Date: {selectedApp.appointment_date}</p>
              <p className="card-text">Course: {selectedApp.course_code}</p>
            </div>
          </div>
        </div>
      )}


    </div>

    </div>
  )
  ;
}

export default Appointments;
