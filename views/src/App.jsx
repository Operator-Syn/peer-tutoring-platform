import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MasterLayout from "./Layouts/masterlayout";
import Front_page from "./pages/header/Front_page";
import Frontpage_route from "./routes/Frontpage_route"
import HomePage from './pages/HomePage/HomePage.jsx';

function App() {
  return (
    <BrowserRouter>
      <Frontpage_route/>
    </BrowserRouter>
  );
}

export default App;
