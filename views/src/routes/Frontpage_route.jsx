import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/header/HomePage/HomePage";
import About from "../pages/header/About";
import Events from "../pages/header/Events";
import Messages from "../pages/header/Messages";
import Report from "../pages/header/Report";
import Tutorappointments from "../pages/Tutor/Appointments";

function FrontpageRoute() {
  return (
    <Routes>
      <Route index element={<HomePage />} />
      <Route path="About" element={<About />} />
      <Route path="Events" element={<Events />} />
      <Route path="Messages" element={<Messages />} />
      <Route path="Report" element={<Report />} />
    </Routes>
  );
}

export default FrontpageRoute;
