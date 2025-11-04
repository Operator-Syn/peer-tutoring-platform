import React from "react";
import "./appointments.css"
function Appointments() {
  return (
    <div className="appointments_page">
      <div
  className="container d-flex flex-column align-items-center requests"
  style={{ marginTop: "220px", height: "700px" }}
>
 

 <div className="boxes-wrapper">

  <div className="alert alert-success mt-3 last-box">Box 2</div>


  <div className="alert alert-success mt-3 last-box">
    No issues found. Box 3
  </div>

</div>


</div>


 <div
        className="container d-flex justify-content-center requests "
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
