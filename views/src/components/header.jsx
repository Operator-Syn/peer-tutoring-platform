import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "../assets/css/header.css";

import logo from "../assets/images/M_layouts/LAV_logo.png";
import notifIcon from "../assets/images/M_layouts/Notifications.png";
import histIcon from "../assets/images/M_layouts/History.png";
import feedIcon from "../assets/images/M_layouts/Feedback.png";
import reportIcon from "../assets/images/M_layouts/Report.png";
import applyIcon from "../assets/images/M_layouts/Apply.png";
import webIcon from "../assets/images/M_layouts/Website.png";
import tutorsIcon from "../assets/images/M_layouts/Tutors.png";
import profile from "../assets/images/M_layouts/profile.png";
import arrow from "../assets/images/M_layouts/downarrow.png";

function Header() {
  const [popup, setPopup] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnimating, setMenuAnimating] = useState(false);
  const location = useLocation();


  useEffect(() => {
    setPopup(false);
  }, [location]);

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
      const bsCollapse = window.bootstrap.Collapse.getInstance(collapseEl);
      bsCollapse?.hide();
    }
    setMenuOpen(false);
  };

  return (
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
          minHeight: menuOpen ? "0rem" : "1rem",
          height: "auto",
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
              <Link to="/" className="nav-link" onClick={handleNavClick}>
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/About" className="nav-link" onClick={handleNavClick}>
                About
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/Events" className="nav-link" onClick={handleNavClick}>
                Events
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/Messages" className="nav-link" onClick={handleNavClick}>
                Messages
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/Report" className="nav-link" onClick={handleNavClick}>
                Report
              </Link>
            </li>
          </ul>
        </div>

        {!menuOpen && !menuAnimating && (
          <div className="position-relative ms-3">
            <div className="prof" onClick={() => setPopup(!popup)}>
              <img src={profile} className="profileimg" alt="profile" />
              <div className="circle">
                <img src={arrow} className="arrowimg" alt="dropdown arrow" />
              </div>
            </div>

            {popup && (
              <div className="profilepopup">
                <p>
                  <img src={notifIcon} alt="Notifications" /> Notifications
                </p>
                <p>
                  <img src={histIcon} alt="History" /> History
                </p>
                <p>
                  <img src={applyIcon} alt="Apply" /> Apply as tutor
                </p>
                <p>
                  <img src={feedIcon} alt="Feedback" /> Feedback
                </p>
                <p>
                  <img src={webIcon} alt="Website" /> Myiit
                </p>
                <p>
                  <img src={tutorsIcon} alt="Tutors" /> Tutors
                </p>
                <p>
                  <img src={reportIcon} alt="Report a bug" /> Report a bug
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Header;
