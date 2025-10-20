import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../assets/css/header.css"
import logo from"../assets/images/M_layouts/LAV_logo.png"
import notifIcon from "../assets/images/M_layouts/Notifications.png";
import histIcon from "../assets/images/M_layouts/History.png";
import feedIcon from "../assets/images/M_layouts/Feedback.png";
import reportIcon from "../assets/images/M_layouts/Report.png";
import applyIcon from "../assets/images/M_layouts/Apply.png";
import webIcon from "../assets/images/M_layouts/Website.png";
import tutorsIcon from "../assets/images/M_layouts/Tutors.png";
 
function Header(){
 const [popup, showpopup] = useState(false);



    return(
        <div className="Mainhead"> 

        <a href="https://www.facebook.com/lav.msuiit">
    <img src={logo} alt="logo" className="logo"/>
    <span className="tooltip">Home</span>
  </a>

  <div className="right-group">
    <div className="buttoncon">
          <Link to="/" className="nav-link">
      Home
    </Link>
      <Link to="/About" className="nav-link">
      About
    </Link> 
      <Link to="/Events" className="nav-link">
      Events
    </Link>
      <Link to="/Messages" className="nav-link">
      Messages
    </Link>
      <Link to="/Report" className="nav-link">
      Report
    </Link>
    </div>

   <div className="profile-container">
      <div className="prof" onClick={() => showpopup(!popup)}></div>
      
      {popup && (
        <div className="profilepopup">
          <p>
               <img src={notifIcon} className="notificationicon" alt="Notifications" />
             Notifications</p>

          <p><img src={histIcon} className="historyicon" alt="History" />
            History</p>
          <p><img src={applyIcon} className="applyicon" alt="Apply" />
          Apply as tutor</p>
          <p><img src={feedIcon} className="feedbackicon" alt="Feedback" />
          Feedback</p>
          <p><img src={webIcon} className="webicon" alt="Website" />
          Myiit</p>
          <p><img src={tutorsIcon} className="tutoricon" alt="Tutors" />
          Tutors</p>
          <p><img src={reportIcon} className="reporticon" alt="Reports" />Report a bug</p>
        </div>
      )}
    </div>
            </div>
            </div>
            
            
    );
}
export default Header