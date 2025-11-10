import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MasterLayout from "./Layouts/masterlayout";
import Frontpage_route from "./routes/Frontpage_route"
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";
import HomePage from "./pages/header/HomePage/HomePage";
import About from "./pages/header/About";
import Events from "./pages/header/Events";
import Messages from "./pages/header/Messages";
import Report from "./pages/header/Report";
import Apply from "./pages/profile/apply";
import TuteeAppointmentsPage from "./components/TuteeAppointmentsPage/TuteeAppointmentsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AccountCreation from "./pages/AccountCreation";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<MasterLayout />}>
          <Route index element={<HomePage />} />
          <Route path="About" element={<About />} />
          <Route path="Events" element={<Events />} />
          <Route element={<ProtectedRoute />}>
            <Route path="Messages" element={<Messages />} />
            <Route path="Report" element={<Report />} />
            <Route path="admin" element={<AdminDashboard />} />  
            <Route path="profile/apply" element={<Apply />} />
            <Route path="Appointments" element={<TuteeAppointmentsPage />} />
            <Route path="AccountCreation" element={<AccountCreation />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
