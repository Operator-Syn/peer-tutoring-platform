import React from "react";
import { Routes, Route } from "react-router-dom";
import MasterLayout from "../Layouts/masterlayout";
import HomePage from "../pages/header/HomePage/HomePage";
import About from "../pages/header/About";
import Events from "../pages/header/Events";
import Messages from "../pages/header/Messages";
import Report from "../pages/header/Report";
import Tutorappointments from "../pages/Admin/Appointments";

function Frontroute() {
  return (
    <Routes>
      
      <Route element={<MasterLayout />}>
        <Route path = "/" element={<HomePage />} />
        <Route path = "/About" element={<About />} />
        <Route path = "/Events" element={<Events />} />
        <Route path = "/Messages" element={<Messages />} />
        <Route path = "/Report" element={<Report />} />
       <Route path = "/TutorAppointments" element={<Tutorappointments />} />
       
      </Route>


    </Routes>
  );
}

export default Frontroute;
