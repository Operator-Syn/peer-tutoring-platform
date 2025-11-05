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
  const [showFilter, setShowFilter] = useState(false); // toggle filter frame
  return (
    <div className="appointments_page">
      <div
  className="container d-flex flex-column align-items-center requests py-4"
  style={{ minHeight: "600px", marginTop: "120px"}} // add margin-top
>
  
{/* Search & Filter */}
<div
  className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-5 mt-md-n2 mb-3 gap-3 w-100"
  style={{ marginTop: "10px", marginBottom: "200px" }}
>

{/* Filter Button + Popup */}
<div style={{ position: "relative", display: "inline-block" }}>
 <div style={{ minWidth: "200px" }}>
  <button
    type="button"
    className="btn btn-primary"
    style={{
      fontSize: "1.5rem",
      width: "100%",
      height: "60px",
      backgroundColor: "#4956AD",
      borderRadius: "8px"
    }}
    onClick={() => setShowFilter(!showFilter)}
  >
    Filter
  </button>
</div>


  {showFilter && (
    <div
      className="filter-popup shadow-sm"
      style={{
        position: "absolute",
        top: "70px", 
        left: 0,
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        padding: "1rem",
        zIndex: 1000,
        width: "200px"
      }}
    >
      <p style={{ cursor: "pointer", marginBottom: "0.5rem" }}>Sort by Date</p>
      <p style={{ cursor: "pointer", marginBottom: "0.5rem" }}>Sort by Name</p>
      <p style={{ cursor: "pointer", marginBottom: "0.5rem" }}>Sort by College</p>
    </div>
  )}
</div>



  {/* Search Input + Enter Button */}
  <div className="d-flex w-100" style={{ maxWidth: "700px" }}>
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
      onChange={(e) => console.log("Search:", e.target.value)}
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
        backgroundColor: "#4956AD"
      }}
      onClick={() => console.log("Enter/Search clicked")}
    >
      Enter
    </button>
  </div>
</div>


        {/* Appointment Cards */}
       
          {rows.map((row) => (
            <div
              key={row.id}
              className="alert custom-alert d-flex flex-column flex-md-row align-items-center justify-content-between mt-4 last-box p-3"
               style={{ marginTop: "10rem", marginLeft: "5rem", marginRight: "5rem", marginBottom: "5rem" }}
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
                      backgroundColor: "#4956AD",
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
              <div className="d-flex flex-column flex-grow-1 mt-0 mt-md-n4 ms-md-1">
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

              {/* Date and Time */}
              <div className="d-flex flex-column flex-md-column flex-grow-1 mt-0 mt-md-n1 ms-4 ms-md-n1">
                {/* Date */}
                <div className="mb-1">
                  <span className="d-block small text-muted">Date</span>
                  <span className="d-block small fw-semibold">October 6, 2025</span>
                </div>

                {/* Time */}
                <div className="mb-1">
                  <span className="d-block small text-muted">Time</span>
                  <span className="d-block small fw-semibold">11:24 AM</span>
                </div>
              </div>

              {/* Buttons */}
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
      



      {/* No Issues Found */}
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
