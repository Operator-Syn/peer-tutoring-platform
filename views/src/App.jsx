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
import TutorAppointmentsPage from "./pages/Tutor/Appointments";
import ProtectedRoute from "./components/ProtectedRoute";
import AccountCreation from "./pages/AccountCreation";
import TutorList from "./pages/TutorList/TutorList";
import CreateAppointment from "./components/CreateAppointmentsPage/CreateApointment";
import Banned from "./pages/Banned"
import TuteeList from "./pages/TuteeList/TuteeList";
import UploadNotes from "./pages/UploadNotes/UploadNotes";

import Feedback from "./pages/profile/feedback"
import TutorProfile from "./pages/Tutor/Tutorprofile";
import AdminRoute from "./components/AdminRoute";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<MasterLayout />}>
          <Route index element={<HomePage />} />
          <Route path="About/:tutorId" element={<About />} />
          <Route path="Events" element={<Events />} />
          
          
          <Route element={<ProtectedRoute />}>
            <Route path="Messages" element={<Messages />} />
            <Route path="Report" element={<Report />} />  
            <Route path="profile/apply" element={<Apply />} />
            <Route path="Appointments" element={<TuteeAppointmentsPage />} />
            <Route path="AccountCreation" element={<AccountCreation />} />
            <Route path="tutorappointments" element={<TutorAppointmentsPage />} />
            <Route path="tutor/:tutor_id" element={<TutorProfile />} />

            <Route element={<AdminRoute />}>
              <Route path="admin" element={<AdminDashboard />} />
            </Route>
            
            <Route path="CreateAppointment" element={<CreateAppointment />} />
            <Route path="TutorAppointments" element={<TutorAppointmentsPage />} />
            <Route path="TutorList" element={<TutorList />} />
            <Route path ="banned" element={<Banned />} />
            <Route path="TuteeList" element={<TuteeList />} />
            <Route path="UploadNotes" element={<UploadNotes />} />
            <Route path= "Feedback" element = {<Feedback/>}/>

          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
