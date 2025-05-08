import React, { useState, useEffect, useRef } from 'react';
import Logo from './Images/hyphenviewlogo.png';
import { useNavigate, useLocation } from 'react-router-dom';
import './globalCSS/header.css';
import { decryptData } from './utils/EncriptionStore';
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  PieChart,
  Menu as HamburgerMenu // Add the hamburger icon here
} from 'lucide-react';
import { fetchNavIcon } from "../actions/logowhitelisting";
import { useDispatch, useSelector } from 'react-redux';

function Header() {
  const history = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
  })();
  const [dropdown, setDropDown] = useState("none");
  const [activeTab, setActiveTab] = useState(location.pathname);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const userfeature = user.features.filter((item) => user.group_id === item.group_id).map(item => item.featurename);
  const dropdownRef = useRef(null);

  const menuItems = [
    {
      path: '/Dashboard',
      icon: <LayoutDashboard className="menu-icon" />,
      label: 'Dashboard',
      feature: null // Always show dashboard
    },
    {
      path: '/UserManagementList',
      icon: <Users className="menu-icon" />,
      label: 'User Management',
      feature: 'User Management'
    },
    {
      path: '/ListOfReports',
      icon: <FileText className="menu-icon" />,
      label: 'Reports Management',
      feature: 'Report Management'
    },
    {
      path: '/ReportSchedulerList',
      icon: <Calendar className="menu-icon" />,
      label: 'Reports Scheduled',
      feature: 'Report Scheduler'
    },
    {
      path: '/ListOfDashboardCanvas',
      icon: <PieChart className="menu-icon" />,
      label: 'Dashboard Management',
      feature: 'Dashboard Management'
    }
  ];

  useEffect(() => {
    setActiveTab(location.pathname);
  }, [location.pathname]);

  const handleTabClick = (path) => {
    setActiveTab(path);
    history(path);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropDown("none");
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const logout = () => {
    localStorage.clear()
    history('/');
  };

  useEffect(() => {
    dispatch(fetchNavIcon(user.customer_id));
  }, [])

  const { nav_icon } = useSelector(
    (state) => state.logowhitelisting?.images || {}
  );

  // Toggle the menu visibility

  return (
    <>
      <nav className={`vertical-navbar ${isMenuOpen ? 'open' : ''}`}>
        {/* Modified by kashish */}
      <div className="logo_container">
          {nav_icon ? (
            <img src={nav_icon} alt="Logo" className="nav-icon-logo" />
          ) : (
            <img src={Logo} alt="Logo" className="navbar-logo" />
          )}
        </div>
        <div className="navbar-collapse">
          <ul className="navbar-nav">
            {menuItems.map((item) => (
              (!item.feature || userfeature.includes(item.feature)) && (
                <li
                  key={item.path}
                  className="nav-item"
                  onClick={() => handleTabClick(item.path)}
                >
                  <a
                    className={`new-nav-link ${activeTab === item.path ? 'active-tab' : ''}`}
                    href="#"
                  >
                    {item.icon}
                    <span className="tooltip-text">{item.label}</span>
                  </a>
                </li>
              )
            ))}
          </ul>
        </div>
        <div className="header__profile_notification">
          <button
            className="header__profile_button"
            onClick={() =>
              dropdown === 'none' ? setDropDown('block') : setDropDown('none')
            }
          >
            <div className="header__profile_details">
              <div className="header__profile_picture">
                {user?.groupname[0]}
              </div>
            </div>
          </button>
          <div
            className="header_dropdown"
            style={{ display: dropdown }}
            ref={dropdownRef}
          >
            <p className="log-out">{user?.groupname}</p>
            <p onClick={logout} className="log-out">
              Log out
            </p>
          </div>
        </div>
      </nav>
      <div className="main-content-not-use">
        {/* Your main content goes here */}
      </div>

      {/* Hamburger Menu for smaller screens */}
      {/* <button className="hamburger-menu" onClick={toggleMenu}>
        <HamburgerMenu className="hamburger-icon" />
      </button> */}
    </>
  );
}

export default Header;
