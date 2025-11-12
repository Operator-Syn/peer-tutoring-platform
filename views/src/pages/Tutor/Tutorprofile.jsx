import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./TutorProfile.css"; // import the CSS
import profile from "../../assets/images/placeholders/Profile.png";
import { Carousel } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import slide1 from "../../assets/images/placeholders/Profile.png";
import slide2 from"../../assets/images/placeholders/Profile.png";
import friendly from "../../assets/images/placeholders/Handshake.png"
import proficient from "../../assets/images/placeholders/proficiency.png"
import panctual from "../../assets/images/placeholders/panctual.png"
import responsive from "../../assets/images/placeholders/response.png"
import bigger_responsive from "../../assets/images/placeholders/bigger_response.png"
import bigger_handshake from "../../assets/images/placeholders/bigger_handshake.png"
import bigger_panctual from "../../assets/images/placeholders/bigger_panctual.png"
import bigger_proficiency from "../../assets/images/placeholders/bigger_proficiency.png"
function TutorProfile() {
  const { tutor_id } = useParams(); //this will extract the tutor_id from ur URL, example /Tutorprofile/2023-3984
  const [date, setDate] = useState(new Date());
  const [tutor, setTutor] = useState(null);//this will be a storage that will return by the API
  const [loading, setLoading] = useState(true); //tracks if the API call is in progress or something
  const [error, setError] = useState("");//this stores error msg
  const [courses, setCourses] = useState([]);
    const [userGoogleId, setUserGoogleId] = useState(null); 
    const [isModalOpen, setIsModalOpen] = useState(false);
const [activeBadge, setActiveBadge] = useState(""); // to know which badge was clicked
const [selectedBadges, setSelectedBadges] = useState([]);
const [isShortInfoModalOpen, setIsShortInfoModalOpen] = useState(false);
const [shortInfo, setShortInfo] = useState(tutor?.short_info || ""); // 

const toggleBadge = (badgeName) => {
  setSelectedBadges((prev) =>
    prev.includes(badgeName)
      ? prev.filter((b) => b !== badgeName) // remove if already selected
      : [...prev, badgeName] // add if not selected
  );
};


const fetchExistingBadges = async () => {
  try {
    const tuteeRes = await fetch(`http://localhost:5000/api/tutee/by_google/${userGoogleId}`);
    const tuteeData = await tuteeRes.json();

    if (!tuteeRes.ok || !tuteeData.id_number) {
      console.error("Failed to fetch tutee id_number");
      return;
    }

    const tutee_id = tuteeData.id_number;

    const res = await fetch(
      `http://localhost:5000/api/tutor/badges/${tutor.tutor_id}/${tutee_id}`
    );

    if (!res.ok) {
      console.error("No existing badge record found");
      return;
    }

    const badgeData = await res.json();

    // Map true fields to badge names
    const preselected = [];
    if (badgeData.friendly) preselected.push("Handshake");
    if (badgeData.punctual) preselected.push("Punctual");
    if (badgeData.engaging) preselected.push("Responsive");
    if (badgeData.proficient) preselected.push("Proficiency");

    setSelectedBadges(preselected);
  } catch (err) {
    console.error("Error fetching existing badges:", err);
  }
};


// Inside useEffect to fetch logged-in user
useEffect(() => {
  const fetchUser = async () => {
    try {
      const res = await fetch("http://localhost:5173/api/auth/get_user", { credentials: "include" });
      if (!res.ok) throw new Error("Not authenticated");
      const data = await res.json();
      setUserGoogleId(data.sub || data.google_id); // depending on what your API returns
    } catch (err) {
      console.error("Failed to fetch logged-in user:", err);
    }
  };
  fetchUser();
}, []);

const openBadgeModal = async () => {
  if (!tutor || !tutor.tutor_id) return;
  await fetchExistingBadges();
  setIsModalOpen(true);
};


  useEffect(() => {
    const fetchTutor = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/tutor/${tutor_id}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load tutor.");
        } else {
          setTutor(data);
          setCourses(data.courses || []);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load tutor.");
      } finally {
        setLoading(false);
      }
    };

    fetchTutor();
  }, [tutor_id]);

  if (loading) return <p>Loading tutor profile...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  const isCurrentUserTutor = userGoogleId && tutor && userGoogleId === tutor.google_id;


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
 
<div
  className="responsive-tutor-layout"
  style={{
   
    display: "flex",
    flexWrap: "nowrap", // ✅ keeps them side by side
    alignItems: "flex-center",
    justifyContent: "space-between",
     
    gap: "20px",
    overflowX: "auto", // ✅ prevents overflow cutoff if needed
  }}
>
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
      
<button
  className="tutor-btn"
  onClick={() => {
    if (userGoogleId && tutor && userGoogleId !== tutor.google_id) {
      openBadgeModal("Punctual"); // reset & open modal
    }
  }}
  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
>
  <img src={panctual} style={{ width: "60px", height: "55px", marginBottom: "5px", transition: "transform 0.3s ease" }} />
  Punctual
</button>

<button
  className="tutor-btn"
  onClick={() => {
    if (userGoogleId && tutor && userGoogleId !== tutor.google_id) {
      openBadgeModal("Engaging");
    }
  }}
  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
>
  <img src={responsive} style={{ width: "60px", height: "55px", marginBottom: "5px", transition: "transform 0.3s ease" }} />
  Engaging
</button>

<button
  className="tutor-btn"
  onClick={() => {
    if (userGoogleId && tutor && userGoogleId !== tutor.google_id) {
      openBadgeModal("Friendly");
    }
  }}
  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
>
  <img src={friendly} style={{ width: "60px", height: "55px", marginBottom: "5px", transition: "transform 0.3s ease" }} />
  Friendly
</button>

<button
  className="tutor-btn"
  onClick={() => {
    if (userGoogleId && tutor && userGoogleId !== tutor.google_id) {
      openBadgeModal("Proficient");
    }
  }}
  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
>
  <img src={proficient} style={{ width: "60px", height: "60px", marginBottom: "5px", transition: "transform 0.3s ease" }} />
  Proficient
</button>


    </div>
  </div>


    <div
      className="card p-4 rounded flex-grow-1"
      style={{
        backgroundColor: "#F8F9FF",
         border: "3px solid #4956AD",
        minWidth: "250px",
        maxWidth: "450px",
        minHeight: "255px",
         boxShadow: "0 8px 10px rgba(0, 0, 0, 0.25)", 
      }}
    ><h4 className="displays">Badge Count</h4></div>




  </div>

  {/* Right Column */}
  <div className="responsive-column">

<div
  className="card p-4 rounded flex-grow-1"
  style={{
    backgroundColor: "#F8F9FF",
    border: "3px solid #4956AD",
    minWidth: "400px",
    maxWidth: "450px",
    height: "510px", // fixed height
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.25)", // stronger shadow
    display: "flex",
    flexDirection: "column",
    overflow: "hidden", // prevents inner content from breaking out
  }}
  onClick={() => {
    if (isCurrentUserTutor) {
      setIsShortInfoModalOpen(true);
    } else {
      console.log("Card clicked by visitor!");
    }
  }}
>
  <h4 className="displays">About</h4>
  <p
    style={{
      marginTop: "10px",
      flexGrow: 1,
      overflowY: "auto",      // scroll if content is too tall
      paddingRight: "5px",    // prevents scrollbar overlap
      lineHeight: "1.4em",
      color: "#333",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    }}
  >
    {tutor?.about
      ? tutor.about.replace(/(.{40})/g, "$1\n") // line break every 40 chars
      : "Click to add info about yourself..."}
  </p>
</div>



{/* Modal for editing Short Info */}
{isShortInfoModalOpen && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    }}
    onClick={() => setIsShortInfoModalOpen(false)}
  >
    <div
      style={{
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "10px",
        maxWidth: "500px",
        width: "90%",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <h4>Edit Short Info</h4>
     <textarea
  value={shortInfo}
  onChange={(e) => setShortInfo(e.target.value)}
  rows={5}
  style={{
    width: "100%",
    marginTop: "10px",
    padding: "10px",
    borderRadius: "5px",
    resize: "none",          // optional: prevent resizing
    overflow: "auto",        // scroll if too tall
    whiteSpace: "normal",    // normal wrapping behavior
    wordWrap: "break-word",  // breaks very long words that exceed width
  }}
/>

      <div style={{ marginTop: "15px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
        <button
          onClick={() => setIsShortInfoModalOpen(false)}
          style={{ padding: "8px 15px", borderRadius: "5px", cursor: "pointer" }}
        >
          Cancel
        </button>
        <button
          onClick={async () => {
            try {
              const res = await fetch("http://localhost:5000/api/tutor/update_about", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  tutor_id: tutor.tutor_id,
                  about: shortInfo,
                }),
              });

              const data = await res.json();
              if (!res.ok) {
                console.error("Failed to save About:", data.error);
              } else {
                console.log("About updated successfully");
                setTutor((prev) => ({ ...prev, about: shortInfo }));
              }
            } catch (err) {
              console.error("Error saving About:", err);
            } finally {
              setIsShortInfoModalOpen(false);
            }
          }}
          style={{ padding: "8px 15px", borderRadius: "5px", cursor: "pointer", backgroundColor: "#4F62DE", color: "#fff", border: "none" }}
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}




  



    
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



{isModalOpen && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    }}
    onClick={() => setIsModalOpen(false)}
  >
    <div
      style={{
        backgroundColor: "#fff",
        padding: "23px",
        borderRadius: "10px",
        width: "100%",
        maxWidth: "710px",
        maxHeight: "90%",
        overflowY: "auto",
        boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        pointerEvents: "auto",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Scrollable Image Row */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          overflowX: "auto",
          paddingBottom: "10px",
          width: "100%",
        }}
      >
        {["Responsive", "Handshake", "Punctual", "Proficiency"].map((badge) => (
          <button
            key={badge}
            style={{
              border: "none",
              background: selectedBadges.includes(badge) ? "#4F62DE" : "transparent",
              padding: 0,
              flex: "0 0 auto",
              cursor: "pointer",
              outline: "none",
              borderRadius: "10px",
            }}
            onClick={() => toggleBadge(badge)}
          >
            <img
              src={
                badge === "Responsive" ? bigger_responsive :
                badge === "Handshake" ? bigger_handshake :
                badge === "Punctual" ? bigger_panctual :
                bigger_proficiency
              }
              style={{
                width: "150px",
                height: "150px",
                objectFit: "cover",
                opacity: selectedBadges.includes(badge) ? 1 : 0.7,
                transition: "all 0.2s",
              }}
            />
          </button>
        ))}
      </div>

      {/* Modal Buttons */}
      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        <button
          style={{
            padding: "10px 20px",
            borderRadius: "5px",
            border: "none",
            backgroundColor: "#4F62DE",
            color: "#fff",
            cursor: "pointer",
          }}
          onClick={() => setIsModalOpen(false)}
        >
          Cancel
        </button>
        <button
          style={{
            padding: "10px 20px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            backgroundColor: "#fff",
            color: "#000",
            cursor: "pointer",
          }}
          onClick={async () => {
            console.log("Confirm clicked");
            
            if (!userGoogleId || !tutor?.tutor_id) {
              console.error("Missing Google ID or tutor ID");
              return;
            }

            try {
             const tuteeRes = await fetch(`http://localhost:5000/api/tutee/by_google/${userGoogleId}`);
const tuteeData = await tuteeRes.json();

if (!tuteeRes.ok || !tuteeData.id_number) {
  console.error("Failed to fetch tutee id_number");
  return;
}

const payload = {
  tutee_id: tuteeData.id_number,
  tutor_id: tutor.tutor_id,
  friendly: selectedBadges.includes("Handshake"),
  punctual: selectedBadges.includes("Punctual"),
  engaging: selectedBadges.includes("Responsive"),
  proficient: selectedBadges.includes("Proficiency"),
};

const res = await fetch("http://localhost:5000/api/tutor/badges", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});


const data = await res.json();
if (!res.ok) console.error("Error giving badges:", data.error);
else console.log("Badges saved:", data.badge);


              setIsModalOpen(false);
            } catch (err) {
              console.error("Failed to submit badges:", err);
            }
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
)}





    </div>


  );
}

export default TutorProfile;
