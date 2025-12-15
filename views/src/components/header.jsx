import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLoginCheck } from "../hooks/useLoginCheck";
import { io } from "socket.io-client";
import "../assets/css/header.css";
import NotificationPanel from "./NotificationPanel/NotificationPanel";

// Import all assets
import logo from "../assets/images/M_layouts/LAV_logo.png";
import notifIcon from "../assets/images/M_layouts/Notifications.png";
import feedIcon from "../assets/images/M_layouts/Feedback.png";
import reportIcon from "../assets/images/M_layouts/Report.png";
import applyIcon from "../assets/images/M_layouts/Apply.png";
import webIcon from "../assets/images/M_layouts/Website.png";
import tutorsIcon from "../assets/images/M_layouts/Tutors.png";
import logoutIcon from "../assets/images/M_layouts/logout.png";
import profilePlaceholder from "../assets/images/M_layouts/profile.png";
import arrow from "../assets/images/M_layouts/downarrow.png";
import uploadIcon from "../assets/images/M_layouts/upload.svg";
import histIcon from "../assets/images/M_layouts/History.png"; 

// Define your socket URL
const SOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || "http://localhost:5000";

function Header() {
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null); 
  const [profileUrl, setProfileUrl] = useState(null); 

  // Keep hook, but ignore result to prevent re-renders
  const loginCheck = useLoginCheck({ login: false });

  // State for Notification Panel Visibility and Count
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [popup, setPopup] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnimating, setMenuAnimating] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  
  // --- 1. STABILIZED USER DATA FETCHER ---
  const fetchUserData = useCallback(async () => {
    let fullUserData = null;
    
    try {
        const res = await fetch(`/api/auth/get_user`); 
        if (res.ok) {
            fullUserData = await res.json();
        } else {
            console.warn(`User not logged in. Status: ${res.status}`);
            setUser(null);
            setProfileUrl(null);
            return; 
        }
    } catch (e) {
        console.error("Error fetching user:", e);
        setUser(null);
        return;
    }
    
    // Log this to ensure we actually have an ID for the socket
    // console.log("User Data Fetched:", fullUserData); 
    
    setUser(fullUserData);
    
    // Fetch Profile Image
    const googleId = fullUserData?.sub || fullUserData?.google_id;
    if (!googleId) {
        setProfileUrl(null);
        return;
    }

    try {
        const res = await fetch(
            `/api/tutor/profile_img_url/by_google/${googleId}`,
            { credentials: "include" }
        );
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.profile_img_url) {
            setProfileUrl(`${data.profile_img_url}?v=${Date.now()}`);
        } else {
            setProfileUrl(null);
        }
    } catch (err) {
        setProfileUrl(null);
    }
  }, []); 

  // --- Initial Fetch ---
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]); 

  // --- 2. FIXED SOCKET CONNECTION LOGIC ---
  useEffect(() => {
    // We check for id_number, but fallback to google_id or id if necessary
    const userId = user?.id_number || user?.google_id || user?.id;

    // If no user ID, ensure we disconnect any existing socket and stop.
    if (!userId) {
      if (socket) {
        console.log("User logged out, disconnecting socket.");
        socket.disconnect();
        setSocket(null);
      }
      return;
    }
    
    // If we already have a socket connected for this EXACT user, do nothing.
    // We convert to String to avoid mismatches (e.g. 123 vs "123")
    if (socket && String(socket.io.opts.query.user_id) === String(userId)) {
        return;
    }

    console.log("🔌 Connecting Socket for User:", userId);

    const newSocket = io(SOCKET_URL, {
      transports: ["websocket"],
      secure: SOCKET_URL.includes("https"),
      query: { user_id: userId }
    });

    setSocket(newSocket);

    // CLEANUP: This runs automatically when the component unmounts 
    // OR when the `userId` changes.
    return () => {
      console.log("Cleaning up socket connection...");
      newSocket.disconnect();
    };
    
    // Dependency: Only re-run if the user ID specifically changes.
    // We do NOT include 'socket' in the dependency array to avoid loops.
  }, [user?.id_number, user?.google_id, user?.id]); 

  // --- 3. Profile Image Update Listener ---
  useEffect(() => {
    const onUpdated = () => fetchUserData();
    const onStorage = (e) => {
      if (e.key === "PROFILE_IMG_UPDATED_AT") fetchUserData();
    };

    window.addEventListener("profile-img-updated", onUpdated);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("profile-img-updated", onUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, [fetchUserData]); 

  // --- UI/Navigation Logic ---

  useEffect(() => {
    setPopup(false);
    setShowNotificationPanel(false); 
  }, [location]);

  const handleUnreadCountChange = useCallback((newCount) => {
    setUnreadCount(prev => typeof newCount === 'function' ? newCount(prev) : newCount);
  }, []);

  const handleCloseNotifications = () => setShowNotificationPanel(false);

  const handleShowNotifications = () => {
    setPopup(false);
    setShowNotificationPanel(true);
    handleNavClick();
  };

  const handleNotificationAction = (appointmentId) => {
    navigate('/Messages', { state: { deepLinkAppointmentId: appointmentId } });
    handleCloseNotifications();
  };

  const handleAppointmentAction = (appointmentId = null) => {
    const isActiveTutor = user?.role === "TUTOR" && user?.tutor_status === "ACTIVE";
    if (isActiveTutor) {
        navigate("/TutorAppointments", { state: { highlightId: appointmentId } });
    } else {
        navigate("/Appointments", { state: { highlightId: appointmentId } });
    }
    handleCloseNotifications();
  };

  const toggleMenu = () => {
    if (window.innerWidth < 992) setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    const collapseEl = document.getElementById("navbarNav");
    if (!collapseEl) return;

    const handleShow = () => setMenuAnimating(true);
    const handleShown = () => setMenuAnimating(false);
    const handleHide = () => setMenuAnimating(true);
    const handleHidden = () => {
      setMenuAnimating(false);
      setMenuOpen(false);
    };

    collapseEl.addEventListener("show.bs.collapse", handleShow);
    collapseEl.addEventListener("shown.bs.collapse", handleShown);
    collapseEl.addEventListener("hide.bs.collapse", handleHide);
    collapseEl.addEventListener("hidden.bs.collapse", handleHidden);

    return () => {
      collapseEl.removeEventListener("show.bs.collapse", handleShow);
      collapseEl.removeEventListener("shown.bs.collapse", handleShown);
      collapseEl.removeEventListener("hide.bs.collapse", handleHide);
      collapseEl.removeEventListener("hidden.bs.collapse", handleHidden);
    };
  }, []);

  useEffect(() => {
    const collapseEl = document.getElementById("navbarNav");
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setMenuOpen(false);
        setMenuAnimating(false);
        collapseEl?.classList.remove("show");
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNavClick = () => {
    const collapseEl = document.getElementById("navbarNav");
    if (collapseEl && collapseEl.classList.contains("show")) {
      collapseEl.classList.remove('show'); 
    }
    setMenuOpen(false);
  };

  const profileSrc = profileUrl || profilePlaceholder;

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary fixed-top">
        <div
          className="container-fluid Mainhead"
          style={{
            background: "#4956AD",
            color: "white",
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            transition: "all 0.3s ease",
            minHeight: menuOpen ? "0rem" : "0rem",
          }}
        >
          <a
            href="https://www.facebook.com/lav.msuiit"
            className="navbar-brand d-flex"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={logo} alt="logo" className="logo" />
          </a>

          <button
            className="navbar-toggler"
            type="button"
            onClick={toggleMenu}
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded={menuOpen ? "true" : "false"}
            aria-label="Toggle navigation"
          >
            More
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0 gap-2">
              <li className="nav-item">
                <Link to="/" className="nav-link" onClick={handleNavClick}>Home</Link>
              </li>
              <li className="nav-item">
                <Link to="/About" className="nav-link" onClick={handleNavClick}>About</Link>
              </li>
              <li className="nav-item">
                <Link to="/Events" className="nav-link" onClick={handleNavClick}>Events</Link>
              </li>
              {user && (
                <>
                  <li className="nav-item">
                    <Link to="/Messages" className="nav-link" onClick={handleNavClick}>Messages</Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/Report" className="nav-link" onClick={handleNavClick}>Report</Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {!menuOpen && !menuAnimating && (
            <div className="position-relative ms-3">
              <div
                className="prof"
                onClick={() => setPopup(!popup)}
                style={{ display: "flex", alignItems: "center", gap: "8px", position: 'relative' }} 
              >
                <img 
                    src={profileSrc} 
                    alt="profile" 
                    onError={(e) => (e.currentTarget.src = profilePlaceholder)}
                    style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        objectPosition: "center",
                        display: "block",
                    }}
                />
                <div className="circle">
                  <img src={arrow} className="arrowimg" alt="dropdown arrow" />
                </div>
                {unreadCount > 0 && (
                  <span
                    className="position-absolute translate-middle badge rounded-circle bg-danger"
                    style={{
                      top: '5px',    
                      right: '15px', 
                      padding: '0.4em 0.6em',
                      fontSize: '0.7em',
                      border: '2px solid white',
                      zIndex: 10
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </div>

              {popup && (
                <div className="profilepopup">
                  <p onClick={handleShowNotifications} style={{ cursor: "pointer", position: 'relative' }}>
                    <img src={notifIcon} alt="Notifications" /> Notifications
                    {unreadCount > 0 && (
                      <span className="badge bg-danger ms-2">{unreadCount}</span>
                    )}
                  </p>
                  
                  <p>
                    <img src={histIcon} alt="History" /> History
                  </p>
                  
                  <p
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setPopup(false);
                      handleNavClick();
                      navigate("/profile/apply");
                    }}
                  >
                    <img src={applyIcon} alt="Apply" /> Apply as tutor
                  </p>
                  
                  <p onClick={() => {
                    setPopup(false);
                    handleNavClick();
                    navigate("/Feedback");
                  }}>
                    < img src={feedIcon} alt="Feedback" /> Rate Session
                  </p>
                  
                  <p onClick={() => {
                    setPopup(false);
                    handleNavClick();
                    window.location.href = "https://myiit.msuiit.edu.ph";
                  }}>
                    <img src={webIcon} alt="Website" /> Myiit
                  </p>
                  
                  <p onClick={() => {
                    setPopup(false);
                    handleNavClick();
                    navigate('/tutorlist');
                  }}>
                    <img src={tutorsIcon} alt="Tutors" /> Tutors
                  </p>
                  
                  <p onClick={() => {
                    setPopup(false);
                    handleNavClick();
                    navigate(`/uploadnotes`);
                  }}>
                    <img src={uploadIcon} width={30} height={30} alt="Upload Notes" /> Upload Notes
                  </p>

                  {user && user.role === "ADMIN" && (
                    <p
                      onClick={() => {
                        setPopup(false);
                        handleNavClick();
                        navigate("/admin");
                      }}
                    >
                      <img src={reportIcon} alt="Admin Page" /> Admin Page
                    </p>
                  )}
                  
                  <p>
                    <img src={reportIcon} alt="Report a bug" /> Report a bug
                  </p>

                  {user && (
                    <p onClick={() => {
                      setPopup(false);
                      handleNavClick();
                      window.location.href = `/api/auth/logout`;
                    }}>
                      <img src={logoutIcon} width={30} height={30} alt="Logout" /> Logout
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Render Notification Panel - Ensure we pass the socket and user ID */}
      {user && socket && ( 
        <NotificationPanel
          user={user}
          socket={socket}
          show={showNotificationPanel}
          handleClose={handleCloseNotifications}
          onNotificationClick={handleNotificationAction}
          onAppointmentClick={handleAppointmentAction} 
          onUnreadCountChange={handleUnreadCountChange}
        />
      )}
    </>
  );
}

export default Header;