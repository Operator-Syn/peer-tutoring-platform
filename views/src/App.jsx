import React from 'react';
import TutorApplicationForm from './components/TutorApplication/TutorApplicationForm';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MasterLayout from "./Layouts/masterlayout";
import Frontpage_route from "./routes/Frontpage_route"

function App() {
  return (
    <BrowserRouter>
      <Frontpage_route/>
    </BrowserRouter>
  );
}

export default App;
