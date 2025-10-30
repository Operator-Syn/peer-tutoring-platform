import React from "react";

import { Outlet, Link } from "react-router-dom";

 import Head from "../components/header";


function MasterLayout() {
    
  return (
    <div>
     
     


        <Head />
        <Outlet />
     

     
      
    </div>
  );
}

export default MasterLayout;
