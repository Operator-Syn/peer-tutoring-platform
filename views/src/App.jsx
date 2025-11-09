import React from 'react';
import Apply from "./pages/profile/apply";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MasterLayout from "./Layouts/masterlayout";
import Frontpage_route from "./routes/Frontpage_route"
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MasterLayout />}>
          <Route index element={<Frontpage_route />} />
          <Route path="/profile/apply" element={<Apply />} />
          <Route path="admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
