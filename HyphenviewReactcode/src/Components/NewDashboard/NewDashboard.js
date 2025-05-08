import React, { useState,useEffect } from "react";
import NewSidebar from "./NewSidebar";
import "./../globalCSS/NewDashboard/NewDashboard.css";
import NewTabs from "./NewTabs";
import { useNavigate } from 'react-router-dom';
function NewDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sideBarWidth, setSideBarWidth] = useState(0);
  const history = useNavigate();
  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    let sessionTimeout = setTimeout(() => {
      history('/'); // Redirect to login on session expiration
    }, 60 * 60 * 1000); // 5 minutes in milliseconds

    const resetTimer = () => {
      clearTimeout(sessionTimeout);
      sessionTimeout = setTimeout(() => {
        history('/');
      }, 60 * 60 * 1000);
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      clearTimeout(sessionTimeout);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [history]);

  return (
    <div className="dasboardcnt">
      <NewSidebar sideBarWidth={sideBarWidth} setSideBarWidth={setSideBarWidth} onToggle={handleSidebarToggle} isOpen={isSidebarOpen} />
      <div className={`content ${isSidebarOpen ? "expanded" : "collapsed"}`}>
        <NewTabs sideBarWidth={sideBarWidth} />
      </div>
    </div>
  );
}

export default NewDashboard;
