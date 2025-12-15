import React from "react";

import { Outlet, Link } from "react-router-dom";

import Head from "../components/header";
import CalendarOverlay from "../components/CalendarOverlay";


function MasterLayout() {
    
  return (
    <div>
     
     


        <Head />
        <Outlet />
        <CalendarOverlay />

     
      
    </div>
  );
}

export default MasterLayout;
