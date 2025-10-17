import React from "react";
import "../assets/css/header.css"
function Header(){

    return(
        <div className="Mainhead"> 
        <div className="buttoncon">
        <button className = "homebutton">Home</button>
        <button className = "Aboutbutton">About</button>    
        <button>Events</button>
        <button>Messages</button> 
        <button>Report</button>
          
        </div> 
            
            
            </div>
    );
}
export default Header