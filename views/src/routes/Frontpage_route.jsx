import React from "react";
import { Routes, Route } from "react-router-dom";
import MasterLayout from "../Layouts/masterlayout";
import Front_page from "../pages/header/Front_page";
import About from "../pages/header/About";
import Events from "../pages/header/Events";
import Messages from "../pages/header/Messages";
import Report from "../pages/header/Report";

function Frontroute() {
  return (
    <Routes>
      
      <Route element={<MasterLayout />}>
        <Route path = "/" element={<Front_page />} />
        <Route path = "/About" element={<About />} />
        <Route path = "/Events" element={<Events />} />
        <Route path = "/Messages" element={<Messages />} />
        <Route path = "/Report" element={<Report />} />
       
      </Route>
    </Routes>
  );
}

export default Frontroute;
