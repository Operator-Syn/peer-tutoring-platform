import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLoginCheck } from "../hooks/useLoginCheck";
import { io } from "socket.io-client";
import "../assets/css/header.css";
import NotificationPanel from "./NotificationPanel/NotificationPanel";
import logo from "../assets/images/M_layouts/LAV_logo.png";
import notifIcon from "../assets/images/M_layouts/Notifications.png";
import histIcon from "../assets/images/M_layouts/History.png";
import feedIcon from "../assets/images/M_layouts/Feedback.png";
import reportIcon from "../assets/images/M_layouts/Report.png";
import applyIcon from "../assets/images/M_layouts/Apply.png";
import webIcon from "../assets/images/M_layouts/Website.png";
import tutorsIcon from "../assets/images/M_layouts/Tutors.png";
import logoutIcon from "../assets/images/M_layouts/logout.png";
import profile from "../assets/images/M_layouts/profile.png";
import arrow from "../assets/images/M_layouts/downarrow.png";

// Define your socket URL (matches your ChatInterface logic)
const SOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || "http://localhost:5000";

function Header() {

  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null); // 2. State for Socket
  const loginCheck = useLoginCheck({ login: false });

  // State for Notification Panel Visibility and Count
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // --- 1. Fetch User ---
  useEffect(() => {
    async function fetchUser() {
      const userData = await loginCheck();
      
      // Attempt to fetch full user details (including role/status) for navigation logic
      let fullUserData = userData;
      if (userData?.id_number) {
          try {
              const res = await fetch(`/api/auth/get_user`); 
              
              if (res.ok) {
                  fullUserData = await res.json();
              } else {
                  console.warn(`Failed to fetch full user details from /api/auth/get_user. Status: ${res.status}`);
              }
          } catch (e) {
              console.error("Error fetching full user details:", e);
          }
      }
      setUser(fullUserData);
    }
    fetchUser();
  }, []);

  // --- 2. Initialize Socket Connection (Global) ---
  useEffect(() => {
    // Only connect if we have a user and they have an ID number
    if (!user || !user.id_number) return;

    console.log("Header connecting to socket for user:", user.id_number);

    // Initialize connection
    const newSocket = io(SOCKET_URL, {
      transports: ["websocket"],
      secure: SOCKET_URL.includes("https"),
      // This query param allows the backend (sockets.py) to add the user 
      // to their personal notification room immediately upon connection.
      query: { user_id: user.id_number }
    });

    setSocket(newSocket);

    // Cleanup on unmount or logout
    return () => {
      newSocket.disconnect();
    };
  }, [user]); // Re-run if user changes (e.g. login/logout)

  const [popup, setPopup] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnimating, setMenuAnimating] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();


  useEffect(() => {
    setPopup(false);
    setShowNotificationPanel(false);
  }, [location]);

  // Handler to update the unread count from the NotificationPanel
  const handleUnreadCountChange = useCallback((newCount) => {
    setUnreadCount(prev => typeof newCount === 'function' ? newCount(prev) : newCount);
  }, []);

  // Handler to close the notification panel
  const handleCloseNotifications = () => setShowNotificationPanel(false);

  // Handler to open the notification panel
  const handleShowNotifications = () => {
    setPopup(false);
    setShowNotificationPanel(true);
    handleNavClick();
  };

  // Handler for NEW_MESSAGE notifications (redirect to /Messages)
  const handleNotificationAction = (appointmentId) => {
    // This part sends the user to the /Messages route with the specific chat ID in the state
    navigate('/Messages', { state: { deepLinkAppointmentId: appointmentId } });
    handleCloseNotifications();
  };

  // 🎯 NEW HANDLER: For BOOKING_... notifications (redirect to /Appointments)
  const handleAppointmentAction = (appointmentId = null) => {
    const isActiveTutor = user?.role === "TUTOR" && user?.tutor_status === "ACTIVE";

    if (isActiveTutor) {
        navigate("/TutorAppointments", { 
            state: { highlightId: appointmentId } 
        });
    } else {
        // Default for students or if not an active tutor
        navigate("/Appointments", { 
            state: { highlightId: appointmentId } 
        });
    }
    handleCloseNotifications();
  };


  const toggleMenu = () => {
    if (window.innerWidth < 992) {
      setMenuOpen(!menuOpen);
    }
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
                style={{ position: 'relative' }} // Ensure relative positioning for the badge to work
              >
                <img src={profile} className="profileimg" alt="profile" />
                <div className="circle">
                  <img src={arrow} className="arrowimg" alt="dropdown arrow" />
                </div>
                {/* Badge with corrected positioning */}
                {unreadCount > 0 && (
                  <span
                    className="position-absolute translate-middle badge rounded-circle bg-danger"
                    style={{
                      top: '5px',    
                      right: '-2px', 
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
                  {/* Trigger Notification Panel on Click */}
                  <p onClick={handleShowNotifications} style={{ cursor: "pointer", position: 'relative' }}>
                    <img src={notifIcon} alt="Notifications" /> Notifications
                    {/* Render inner badge */}
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
                  <p>
                    <img src={webIcon} alt="Website" /> Myiit
                  </p>
                  <p onClick={() => {
                    setPopup(false);
                    handleNavClick();
                    navigate('/tutorlist');
                  }}>
                    <img src={tutorsIcon} alt="Tutors" /> Tutors
                  </p>
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

      {/* Render Notification Panel with the Active Socket */}
      {user && (
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