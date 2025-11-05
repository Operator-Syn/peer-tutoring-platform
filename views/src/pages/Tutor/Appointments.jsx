import React, { useState } from "react";
import "./appointments.css";

function Appointments() {
  const [rows, setRows] = useState([
    { id: 1, box: "CCS", message: "No issues found" },
    { id: 2, box: "Box 3", message: "No issues found." }
  ]);

  const handleDelete = (id) => {
    setRows(rows.filter((row) => row.id !== id));
  };

  return (
    <div className="appointments_page">
     <div
  className="container d-flex flex-column align-items-center requests py-4"
  style={{ marginTop: "220px", minHeight: "700px" }}
>
  <div className="boxes-wrapper w-100">
    {rows.map((row) => (
      <div
        key={row.id}
        className="alert custom-alert d-flex flex-column flex-md-row align-items-center justify-content-between mt-3 last-box p-3"
        style={{ marginBottom: "4rem" }} // adjust value here

      >
        {/* Avatar + College Code */}
        <div className="d-flex align-items-center mb-5 mb-md-0">
          <div className="text-center me-5">
            <div
  className="text-white d-flex justify-content-center align-items-center"
  style={{ 
    width: "10rem", 
    height: "6rem", 
    fontWeight: "bold",
    borderRadius: "5%",
    marginBottom: "0.6rem",
    backgroundColor: "#4956AD"  
  }}
>
  {row.initials}
</div>
            <div>
              <span className="d-block small text-muted">College Code</span>
              <span className="d-block fw-bold">CCS</span>
            </div>

          </div>

          {/* Box Name */}
          <span className="fw-bold md-5"></span>
        </div>

        {/* Message */}
<div 
  className="
    d-flex flex-column flex-grow-1
    mt-0 mt-md-n4 ms-md-1
  "
>

  {/* Program */}
  <div className="mb-1">
    <span className="d-block small text-muted">Program Code</span>
    <span className="d-block small fw-semibold">BSCS</span>
  </div>

  {/* Name */}
  <div className="mb-1">
    <span className="d-block small text-muted">Name</span>
    <span className="d-block small fw-semibold">Jazrel Xandrei Quinlob</span>
  </div>

  {/* School Year + Gender side by side */}
<div className="d-flex align-items-baseline gap-4 mt-2">

  <div className="d-flex flex-column" style={{ minWidth: "20px" }}>
    <span className="d-block small text-muted">School Year</span>
    <span className="d-block small fw-semibold">3rd Year</span>
  </div>

  <div className="d-flex flex-column">
    <span className="d-block small text-muted">Gender</span>
    <span className="d-block small fw-semibold">Male</span>
  </div>

</div>




</div>



<div 
  className="
    d-flex flex-column flex-md-column flex-grow-1
    mt-0 mt-md-n1
    ms-4 ms-md-n1
  "
>
  {/* Date */}
  <div className="mb-1">
    <span className="d-block small text-muted">Date</span>
    <span className="d-block small fw-semibold">October 6, 2025</span>
  </div>

  {/* Time */}
  <div className="mb-1 ">
    <span className="d-block small text-muted">Time</span>
    <span className="d-block small fw-semibold">11:24 AM</span>
  </div>
</div>












        {/* Buttons */}
        {/* Buttons - overlapping */}

<div
  className="position-absolute d-flex gap-4 action-buttons"
  style={{ bottom: "-3rem", right: "5rem" }}
>
  <button
    className="btn fw-semibold"
    style={{
      backgroundColor: "#F8F9FF",
      color: "#4956AD",
      border: "2px solid #4956AD",
      fontSize: "1.1rem",
      padding: "14px 95px",
      borderRadius: "6px",
    }}
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
      padding: "14px 95px",
      borderRadius: "6px",
    }}
    onClick={() => handleDelete(row.id)}
  >
    Accept
  </button>
</div>



      </div>
    ))}
  </div>
</div>

      <div
        className="container d-flex justify-content-center requests"
        style={{ marginTop: "140px", height: "700px" }}
      >
        <div className="alert alert-success text-center w-100 w-md-75 w-lg-50 mx-auto shadow-sm p-3">
          No issues found. We're good to move to the next state.
        </div>
      </div>
    </div>
  );
}

export default Appointments;
