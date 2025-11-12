import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./TutorProfile.css"; // import the CSS
import profile from "../../assets/images/placeholders/Profile.png";
import { Carousel } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import slide1 from "../../assets/images/placeholders/Profile.png";
import slide2 from"../../assets/images/placeholders/Profile.png";
import slide3 from "../../assets/images/placeholders/Profile.png"
function TutorProfile() {
  const { tutor_id } = useParams(); //this will extract the tutor_id from ur URL, example /Tutorprofile/2023-3984
  const [date, setDate] = useState(new Date());
  const [tutor, setTutor] = useState(null);//this will be a storage that will return by the API
  const [loading, setLoading] = useState(true); //tracks if the API call is in progress or something
  const [error, setError] = useState("");//this stores error msg
  const [courses, setCourses] = useState([]);
  useEffect(() => { //useEffects runs once. Meaning that React components appears on screen for the first time that's when it mounts
    const fetchTutor = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/tutor/${tutor_id}`); //sends Get request to your backend
        const data = await res.json(); //await means "wait until parsin is done" 
                                        //data now will contain the actual content of your API response

        if (!res.ok) {
          setError(data.error || "Failed to load tutor.");
        } else {
          setTutor(data); //tutor nw holds the data variable that holds your tutor data
            setCourses(data.courses || []);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load tutor.");
      } finally {
        setLoading(false); // tells react that this effect whenever tutor_id changes
      }
    };

    fetchTutor(); //calls the function that is inside the useEffect
  }, [tutor_id]);

  if (loading) return <p>Loading tutor profile...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="row justify-content-en g-0">
 <div className="container py-5"> 

      <div className="row justify-content-center g-4 mt-5" > 
        
           {/* first Card */}
<div className="col-12 col-md-4 mt-5 d-flex justify-content-center ">
  <div
    className="card  p-5 rounded my-card-bg mt-5"
    style={{
      border:"transparent",
      maxWidth: "400px",
      marginLeft: "0px",
      transition: "margin 0.3s ease", 
      boxShadow: "none", 
    }}
  >
   <div className="tutor-header text-center">
  <img src={profile} alt="Tutor Profile" className="tutor-profile-img" />
  <p className="tutor-name">{tutor.first_name} {tutor.middle_name} {tutor.last_name}</p>
  <h1 className="tutor-title">Tutor</h1> 
    <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "10px",
    }}
  >
    <span></span> {/* empty left side if you want carousel to fill remaining space */}
    <p style={{ cursor: "pointer", color: "#4F62DE", margin: 0,textDecoration: "underline" }}>See all</p>
  </div>
   {/* Carousel */}
{/* Carousel */}
{/* Carousel */}
 <div style={{ display: "flex", overflowX: "auto", gap: "10px", padding: "10px" }}>
      {courses.length > 0 ? (
        courses.map((course, index) => (
          <div
            key={index}
            style={{
              flex: "0 0 auto",
              width: "150px",
              height: "55px",
              backgroundColor: "#F8F9FF",
              border: "3px solid #4956AD",
              color: "#4956AD",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              borderRadius: "10px",
            }}
          >
            {course}
          </div>
        ))
      ) : (
        <div
          style={{
            flex: "0 0 auto",
            width: "150px",
            height: "55px",
            backgroundColor: "#F8F9FF",
            border: "3px solid #4956AD",
            color: "#4956AD",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: "10px",
          }}
        >
          No Courses
        </div>
      )}
    </div>



<h1 className="tutor-title mt-4">Subjects Offered</h1> 



</div>




    {/* Small Boxes */}
    <div className="d-flex flex-wrap gap-3 mb-4 justify-content-e"></div>
  </div>
</div>


     
        {/* Second Card */}
    <div className="col-12 col-md-7 mt-5 d-flex justify-content-center justify-content-md-start">
  <div
    className="card p-4 rounded my-card-bg mt-5"
    style={{
      backgroundColor: "#F8F9FF",
      border: "3px solid #4956AD",
      minHeight: "500px",
      width: "100%",         
      maxWidth: "900px",     
      marginLeft: "10px",   
      boxSizing: "border-box",
       boxShadow: "0 8px 20px rgba(0, 0, 0, 0.5)"
    }}
  >
 
<div className="responsive-tutor-layout">
  {/* Left Column */}
  <div className="responsive-column">
    <div
    className="card  p-4 rounded flex-grow-1 button-card"
    style={{
      backgroundColor: "#4956AD",
      border: "4px solid #4956AD",
      minWidth: "400px",
      maxWidth: "450px",
      minHeight: "150px",
        boxShadow: "0 8px 10px rgba(0, 0, 0, 0.25)", 
    }}
  >
    <div className="button-grid">
      <button className="tutor-btn">Panctual</button>
      <button className="tutor-btn">Responsive</button>
      <button className="tutor-btn">Friendly</button>
      <button className="tutor-btn">Proficient</button>
    </div>
  </div>


    <div
      className="card p-4 rounded flex-grow-1"
      style={{
        backgroundColor: "#F8F9FF",
         border: "3px solid #4956AD",
        minWidth: "250px",
        maxWidth: "450px",
        minHeight: "250px",
         boxShadow: "0 8px 10px rgba(0, 0, 0, 0.25)", 
      }}
    ><h4 className="displays">Statistics</h4></div>




  </div>

  {/* Right Column */}
  <div className="responsive-column">
 <div
  className="card  p-4 rounded flex-grow-1"
  style={{
    backgroundColor: "#F8F9FF",
    border: "3px solid #4956AD",
    minWidth: "400px",
    maxWidth: "450px",
    minHeight: "250px",
    cursor: "pointer", // ✅ show pointer on hover
     boxShadow: "0 8px 10px rgba(0, 0, 0, 0.25)", 
  }}
  onClick={() => {
    console.log("Card clicked!"); // replace this with your action
    // Example: navigate to another page
    // navigate("/tutor-details");
  }}
><h4 className="displays" >Short Info</h4></div>


    <div
      className="card p-4 rounded flex-grow-1"
      style={{
        backgroundColor: "#F8F9FF",
         border: "3px solid #4956AD",
        minWidth: "250px",
        maxWidth: "450px",
        minHeight: "180px",
         boxShadow: "0 8px 10px rgba(0, 0, 0, 0.25)", 
      }}
    ><h4 className="displays"> Badge count</h4></div>
  </div>
</div>


  </div>
</div>


</div>

      </div>

        {/* Schedules */}
       <div className="container py-5"> 

  {/* Schedules / Badge count aligned under profile */}
  <div
    className="container py-5"
   
  >
    <div className="column justify-content-start">
      {/* Match left column width (col-md-4 like the profile card) */}
      <div className="col-125 col-md-4 d-flex justify-start">
        <h4 className="displays text-center">Schedules_________________</h4>
      </div>

      {/* Dynamic Schedule Cards (from tutor.schedule) */}
      <div className="d-flex flex-wrap gap-4 mt-5"  style={{
      maxHeight: "400px",  // fixed height for vertical scroll
      overflowY: "auto",   // vertical scrollbar
      paddingBottom: "10px",
    }}>
        {tutor.schedule && tutor.schedule.length > 0 ? (
          tutor.schedule.map((slot, index) => (
            <div
              key={index}
              className="card p-4 rounded flex-grow-1"
              style={{
                backgroundColor: "#F8F9FF",
                minWidth: "250px",
                maxWidth: "700px",
                minHeight: "100px",
                boxShadow: "0 8px 10px rgba(0, 0, 0, 0.08)",
              }}
            >
              <h5 className="displays mb-2">{slot.day_of_week}</h5>
              <p className="mb-1">
                <strong>Start Time:</strong> {slot.start_time}
              </p>
              <p className="mb-1">
                <strong>End Time:</strong> {slot.end_time}
              </p>
            </div>
          ))
        ) : (
          <div
            className="card p-4 rounded flex-grow-1"
            style={{
              backgroundColor: "#F8F9FF",
              border: "3px solid #4956AD",
              minWidth: "250px",
              maxWidth: "450px",
              minHeight: "150px",
              boxShadow: "0 8px 10px rgba(0, 0, 0, 0.25)",
            }}
          >
            <h4 className="displays">No Schedule Available</h4>
          </div>
        )}
      </div>
    </div>
  </div>
</div>

    </div>


  );
}

export default TutorProfile;
