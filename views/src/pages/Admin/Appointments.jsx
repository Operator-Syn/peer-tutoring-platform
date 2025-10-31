import React from "react";
import "./appointments.css"
function Appointments() {
  return (
    <div>
      <div
        className="container d-flex justify-content-center requests"
        style={{ marginTop: "220px", height: "700px" }}
      >
        <div className="alert alert-success text-center w-100 w-md-75 w-lg-50 mx-auto shadow-sm p-3">
          No issues found. We're good to move to the next state.
        </div>
      </div>

 <div
        className="container d-flex justify-content-center schedules mb-5"
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
