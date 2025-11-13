import React, { useEffect, useState,useRef  } from "react";
import { useParams } from "react-router-dom";
import "./Tutorprofile.css"; 
import profile from "../../assets/images/placeholders/Profile.png";
import { Carousel } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import slide1 from "../../assets/images/placeholders/Profile.png";
import slide2 from"../../assets/images/placeholders/Profile.png";
import friendly from "../../assets/images/placeholders/handshake.png"
import proficient from "../../assets/images/placeholders/proficiency.png"
import panctual from "../../assets/images/placeholders/panctual.png"
import responsive from "../../assets/images/placeholders/response.png"
import bigger_responsive from "../../assets/images/placeholders/bigger_response.png"
import bigger_handshake from "../../assets/images/placeholders/bigger_handshake.png"
import bigger_panctual from "../../assets/images/placeholders/bigger_panctual.png"
import bigger_proficiency from "../../assets/images/placeholders/bigger_proficiency.png"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


function TutorProfile() {
  const { tutor_id } = useParams(); //this will extract the tutor_id from ur URL, example /Tutorprofile/2023-3984
  const [date, setDate] = useState(new Date());
 const [tutor, setTutor] = useState({ profile_img: null }); // your tutor object
  const [loading, setLoading] = useState(true); //tracks if the API call is in progress or something
  const [error, setError] = useState("");//this stores error msg
  const [courses, setCourses] = useState([]);
    const [userGoogleId, setUserGoogleId] = useState(null); 
    const [isModalOpen, setIsModalOpen] = useState(false);
const [activeBadge, setActiveBadge] = useState(""); // to know which badge was clicked
const [selectedBadges, setSelectedBadges] = useState([]);
const [isShortInfoModalOpen, setIsShortInfoModalOpen] = useState(false);
const [shortInfo, setShortInfo] = useState(tutor?.short_info || ""); // 
const [previewImg, setPreviewImg] = useState(null); // local preview
const [badgeCounts, setBadgeCounts] = useState({
  
  friendly: 0,
  punctual: 0,
  engaging: 0,
  proficient: 0,
});

const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCoursesModalOpen, setIsCoursesModalOpen] = useState(false);
const [selectedReasons, setSelectedReasons] = useState([]);
const [reportDetails, setReportDetails] = useState("");
const [reportFiles, setReportFiles] = useState([]); // store files
const [tuteeId, setTuteeId] = useState(null);
const [isSubmitting, setIsSubmitting] = useState(false);

const fileInputRef = useRef(null);
const toggleBadge = (badgeName) => {
  setSelectedBadges((prev) =>
    prev.includes(badgeName)
      ? prev.filter((b) => b !== badgeName) // remove if already selected
      : [...prev, badgeName] // add if not selected
  );
};



const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Preview locally
  const reader = new FileReader();
  reader.onloadend = () => {
    setPreviewImg(reader.result); // only update preview
  };
  reader.readAsDataURL(file);

  // Upload binary to server
  const formData = new FormData();
  formData.append("tutor_id", tutor.tutor_id);
  formData.append("profile_img", file);

  try {
    const res = await fetch("/api/tutor/update_profile_img", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // Update tutor state only after successful upload
setTutor((prev) => ({ ...prev, profile_img: previewImg ? undefined : prev.profile_img }));

  } catch (err) {
    console.error(err.message);
  }
};


const fetchExistingBadges = async () => {
  try {
    const tuteeRes = await fetch(`${API_BASE_URL}/api/tutee/by_google/${userGoogleId}`);
    const tuteeData = await tuteeRes.json();

    if (!tuteeRes.ok || !tuteeData.id_number) {
      console.error("Failed to fetch tutee id_number");
      return;
    }

    const tutee_id = tuteeData.id_number;

const res = await fetch(
  `${API_BASE_URL}/api/tutor/badges/${tutor.tutor_id}/${tutee_id}`
);

    if (!res.ok) {
      console.error("No existing badge record found");
      return;
    }

    const badgeData = await res.json();


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



useEffect(() => {
  const fetchBadgeCounts = async () => {
    if (!tutor?.tutor_id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/tutor/badge_counts/${tutor.tutor_id}`);
      const data = await res.json();
      if (res.ok) {
        setBadgeCounts({
          friendly: data.friendly_count,
          punctual: data.punctual_count,
          engaging: data.engaging_count,
          proficient: data.proficient_count
        });
      } else {
        console.error("Failed to fetch badge counts:", data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };
  fetchBadgeCounts();
}, [tutor]);






useEffect(() => {
  if (tutor) {
    setShortInfo(tutor.about || ""); // or tutor.short_info depending on your API
  }
}, [tutor]);
// Inside useEffect to fetch ylogged-in user
useEffect(() => {
  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/get_user`);
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
      const res = await fetch(`${API_BASE_URL}/api/tutor/${tutor_id}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load tutor.");
      } else {
        // Convert bytea image to base64 if present
        if (data.profile_img) {
          data.profile_img = `data:image/png;base64,${data.profile_img}`;
        }
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



useEffect(() => {
  const fetchTuteeId = async () => {
    if (!userGoogleId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/tutee/by_google/${userGoogleId}`);
      const data = await res.json();
      if (res.ok && data.id_number) setTuteeId(data.id_number);
      else console.error("Failed to fetch tutee ID:", data.error);
    } catch (err) {
      console.error("Error fetching tutee ID:", err);
    }
  };
  fetchTuteeId();
}, [userGoogleId]);


  useEffect(() => {
    const fetchTutor = async () => {
      try {
       const res = await fetch(`${API_BASE_URL}/api/tutor/${tutor_id}`);
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




 <div className="tutor-header text-center" style={{ position: "relative" }}>

<img
  src={previewImg || (tutor.profile_img ? `data:image/png;base64,${tutor.profile_img}` : profile)}
  alt="Tutor Profile"
  onClick={() => {
    if (isCurrentUserTutor) {
      fileInputRef.current?.click();
    }
  }}
  style={{
    width: "150px",
    height: "150px",
    borderRadius: "50%",
    objectFit: "cover",
    cursor: isCurrentUserTutor ? "pointer" : "default", // show pointer only if editable
    border: "3px solid #4956AD",
  }}
/>

{isCurrentUserTutor && (
  <input
    type="file"
    accept="image/*"
    ref={fileInputRef}
    style={{ display: "none" }}
    onChange={handleFileChange}
  />
)}



<input
  type="file"
  accept="image/*"
  ref={fileInputRef}
  style={{ display: "none" }}
  onChange={handleFileChange}
/>



  <p className="tutor-name">{tutor.first_name} {tutor.middle_name} {tutor.last_name}</p>
  <h1 className="tutor-title">Tutor</h1> 


{!isCurrentUserTutor && (
  <button
    onClick={() => setIsReportModalOpen(true)}
    style={{
      position: "absolute",
      top: "-1.25rem",
      left: "-3rem",
      padding: "0.5rem 1rem",
      backgroundColor: "#ffffffff",
      color: "#4F62DE",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      fontWeight: "bold",
      fontSize: "0.9rem",
      textDecoration: "underline",
    }}
  >
    Report
  </button>
)}

{isReportModalOpen && (
  <div
    style={{
      position: "fixed",
      top: 50,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    }}
    onClick={() => setIsReportModalOpen(false)}
  >
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "10px",
        padding: "20px",
        maxWidth: "500px",
        width: "90%",
        maxHeight: "80%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "15px",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <h3>Reasons for Reporting</h3>
      <p style={{ fontSize: "0.9rem", color: "#555" }}>
        LAV has a zero-tolerance policy for bullying. Please describe the incident truthfully 
        and with as much detail as possible. We will review the report and, if warranted, 
        impose appropriate consequences.
      </p>

      {/* Multiple selectable reason buttons */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {[
          "Harassment",
          "Racist",
          "Verbal Abuse",
          "Cursing",
          "Inappropriate Profile",
          "Mocking",
        ].map((reason) => (
          <button
            key={reason}
            onClick={() => {
              if (selectedReasons.includes(reason)) {
                setSelectedReasons(selectedReasons.filter((r) => r !== reason));
              } else {
                setSelectedReasons([...selectedReasons, reason]);
              }
            }}
            style={{
              padding: "8px 12px",
              borderRadius: "5px",
              border: selectedReasons.includes(reason)
                ? "2px solid #4F62DE"
                : "1px solid #ccc",
              backgroundColor: selectedReasons.includes(reason)
                ? "#4F62DE"
                : "#f8f8f8",
              color: selectedReasons.includes(reason) ? "#fff" : "#000",
              cursor: "pointer",
            }}
          >
            {reason}
          </button>
        ))}
      </div>

      {/* Details textarea */}
 <textarea
  placeholder="Describe the incident in detail..."
  rows={5}
  value={reportDetails}
  onChange={(e) => setReportDetails(e.target.value)}
  style={{
    width: "100%",
    padding: "clamp(8px, 2vw, 12px)",  // scales padding with screen width
    borderRadius: "6px",
    border: "1px solid #ccc",
    resize: "none",
    fontSize: "clamp(0.8rem, 2.2vw, 1rem)",  // responsive text
    lineHeight: "1.5",
    minHeight: "120px", // ensures good height on small screens
  }}
/>


      {/* File Upload */}
      <div>
        <label
          htmlFor="reportFile"
          style={{
            display: "block",
            marginBottom: "5px",
            fontWeight: "500",
          }}
        >
          Attach files (optional)
        </label>
        <input
          type="file"
          id="reportFile"
          multiple
          onChange={(e) => setReportFiles([...e.target.files])}
          style={{
            display: "block",
            width: "100%",
            border: "1px solid #ccc",
            borderRadius: "5px",
            padding: "5px",
          }}
        />
        {reportFiles.length > 0 && (
          <ul style={{ marginTop: "10px", paddingLeft: "20px" }}>
            {reportFiles.map((file, i) => (
              <li key={i}>{file.name}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
        <button
          onClick={() => setIsReportModalOpen(false)}
          style={{
            padding: "8px 15px",
            borderRadius: "5px",
            border: "2px solid #4F62DE",
            cursor: "pointer",
            backgroundColor: "#fff",
            color: "#4F62DE",
            fontWeight: "600",
          }}
        >
          Cancel
        </button>

 
<button
  onClick={async () => {
    if (selectedReasons.length === 0 && reportDetails.trim() === "") {
      alert("Please select at least one reason or add a description.");
      return;
    }

    if (isSubmitting) return; // prevent multiple clicks
    setIsSubmitting(true);

    try {
    
     const tuteeRes = await fetch(`${API_BASE_URL}/api/tutee/by_google/${userGoogleId}`);
      const tuteeData = await tuteeRes.json();

      /*if (!tuteeRes.ok || !tuteeData.id_number) {
        alert("Could not find your tutee ID. Please re-login.");
        return;
      }*/

      
      const formData = new FormData();
      formData.append("reporter_id", tuteeData.id_number);
      formData.append("reported_id", tutor.tutor_id);
      formData.append("type", "TUTOR_REPORT");
      formData.append("description", reportDetails);
      formData.append("status", "PENDING");

     
      selectedReasons.forEach((reason) => formData.append("reasons", reason));

  
      reportFiles.forEach((file) => formData.append("files", file));

      
   const res = await fetch(`${API_BASE_URL}/api/tutee/report`, {
  method: "POST",
  body: formData,
});

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to submit report");

      // 4️⃣ Success feedback
      alert("✅ Report submitted successfully!");
      setIsReportModalOpen(false);
      setSelectedReasons([]);
      setReportDetails("");
      setReportFiles([]);
    } catch (err) {
      console.error("Report submission error:", err);
      alert("⚠️ Error submitting report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }}
  style={{
    padding: "8px 15px",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
    backgroundColor: "#4F62DE",
    color: "#fff",
    fontWeight: "600",
  }}
>
  Confirm
</button>



      </div>
    </div>
  </div>
)}




  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "10px",
    }}
  >
    <span></span> {/* empty left side if you want carousel to fill remaining space */}
   <p
  style={{ cursor: "pointer", color: "#4F62DE", margin: 0, textDecoration: "underline" }}
  onClick={() => setIsCoursesModalOpen(true)}
>
  See all
</p>

{isCoursesModalOpen && (
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
    onClick={() => setIsCoursesModalOpen(false)} // close on background click
  >
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "10px",
        padding: "20px",
        maxWidth: "600px",
        width: "90%",
        maxHeight: "80%",
        overflowY: "auto",
        
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
      onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside modal
    >
      <h3 style={{ textAlign: "center", marginBottom: "10px",color: "#4956AD", }}>All Courses</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
        {courses.length > 0 ? (
          courses.map((course, index) => (
            <div
              key={index}
              style={{
                minWidth: "120px",
                padding: "10px",
                borderRadius: "8px",
                border: "2px solid #4956AD",
                backgroundColor: "#F8F9FF",
                color: "#4956AD",
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              {course}
            </div>
          ))
        ) : (
          <p>No courses available.</p>
        )}
      </div>
      <button
        onClick={() => setIsCoursesModalOpen(false)}
        style={{
          marginTop: "15px",
          padding: "8px 15px",
          borderRadius: "5px",
          border: "none",
          backgroundColor: "#4F62DE",
          color: "#fff",
          cursor: "pointer",
          alignSelf: "center",
        }}
      >
        Close
      </button>
    </div>
  </div>
)}


  </div>

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
    <div className="d-flex flex-wrap gap-5 mb-5 justify-content-e"></div>
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
    flexWrap: "wrap", // allow wrapping on smaller screens
    alignItems: "center", // vertically center children
    justifyContent: "center", // horizontally center children
    gap: "20px",
    borderRadius:"20px",
    overflowX: "auto",
    backgroundColor: "#dbdce4ff",
    padding: "10px",
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
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "15px",
  }}
>
  <h4 className="displays">Recognition Count</h4>

  <div 
  style={{ 
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", // responsive
    gap: "15px",
    width: "100%",
  }}
>
  {/* Badge cards */}
  {[
    { label: "Friendly", count: badgeCounts.friendly },
    { label: "Punctual", count: badgeCounts.punctual },
    { label: "Engaging", count: badgeCounts.engaging },
    { label: "Proficient", count: badgeCounts.proficient },
  ].map((badge, index) => (
    <div key={index} style={{
      backgroundColor: "#F8F9FF",
      border: "3px solid #4956AD",
      borderRadius: "8px",
      padding: "10px",
      textAlign: "center",
      boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
    }}>
      <p style={{ margin: 0, fontWeight: "bold", color: "#333C7B" }}>{badge.label}</p>
      <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: "bold" }}>{badge.count}</p>
    </div>
  ))}
</div>

</div>








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
    height: "545px", // fixed height
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
      color: "#333C7B",
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
      <h4 style={{
        backgroundColor: "#fff",
        color:"#4956AD",
        padding: "20px",
        borderRadius: "10px",
        maxWidth: "500px",
        width: "90%",
        
      }}>Edit Short Info</h4>
     <textarea
     
  value={shortInfo}
  onChange={(e) => setShortInfo(e.target.value)}
  rows={5}
  style={{
    border: "2px solid #4956AD",
    color:"#4956AD",
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
          style={{ padding: "8px 15px", borderRadius: "5px", cursor: "pointer", backgroundColor: "#fff",
        color:"#4956AD",border:"2px solid #4956AD" }}
        >
          Cancel
        </button>
        <button
          onClick={async () => {
            try {
               const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tutor/update_about`, {
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
<div className="container py-5"> 
  {/* Schedules / Badge count aligned under profile */}
  <div className="container py-5">
    <div className="column justify-content-start">
      {/* Match left column width (col-md-4 like the profile card) */}
      <div className="col-12 col-md-4 d-flex justify-start">
        <h4 className="displays text-center">Schedules_________________</h4>
      </div>

      {/* Dynamic Schedule Cards (from tutor.availability) */}
      <div
        className="d-flex flex-wrap gap-4 mt-5"
        style={{
          maxHeight: "400px",  // fixed height for vertical scroll
          overflowY: "auto",   // vertical scrollbar
          paddingBottom: "10px",
        }}
      >
        {tutor.availability && tutor.availability.length > 0 ? (
          tutor.availability.map((slot, index) => (
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
              <p className="mb-1" style={{ color: "#333C7B" }}>
                <strong>Start Time:</strong> {slot.start_time}
              </p>
              <p className="mb-1" style={{ color: "#333C7B" }}>
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
        
            backgroundColor: "#ffffffff",
            border:"3px solid #4F62DE",
            color: "#4F62DE",
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
            
             backgroundColor: "#4F62DE",
            color: "#fff",
            cursor: "pointer",
          }}
          onClick={async () => {
            console.log("Confirm clicked");
            
            if (!userGoogleId || !tutor?.tutor_id) {
              console.error("Missing Google ID or tutor ID");
              return;
            }

            try {
            const tuteeRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tutee/by_google/${userGoogleId}`);

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

const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tutor/badges`, {
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
