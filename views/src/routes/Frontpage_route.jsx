import React from "react";
import { Routes, Route } from "react-router-dom";
import MasterLayout from "../Layouts/masterlayout";
import Front_page from "../pages/Front_page";

function Frontroute() {
  return (
    <Routes>
      
      <Route element={<MasterLayout />}>
        <Route path = "/" index element={<Front_page />} />
      </Route>
    </Routes>
  );
}

export default Frontroute;
